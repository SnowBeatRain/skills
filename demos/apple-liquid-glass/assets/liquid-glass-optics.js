/*!
 * LiquidGlassOptics — controlled-background WebGL lens renderer.
 * Classic script or side-effect import. No DOM access at module evaluation.
 * Real texture resampling; a rounded lens approximation, not Apple's renderer.
 * See references/web-implementation.md for the background/DOM contract.
 */
(function (global) {
  'use strict';
  const MAX_LENSES = 4;
  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUV;
    void main() {
      vUV = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;
  const fragmentSource = `
    precision highp float;
    varying vec2 vUV;
    uniform sampler2D uSource;
    uniform vec2 uSize;
    uniform vec2 uSourceSize;
    uniform int uCount;
    uniform vec4 uRect[4];
    uniform vec4 uMaterial[4];
    uniform float uRefraction;
    uniform vec3 uLight;

    vec3 backgroundAt(vec2 px) {
      float cover = max(uSize.x / uSourceSize.x, uSize.y / uSourceSize.y);
      vec2 uv = (px - uSize * 0.5) / (uSourceSize * cover) + 0.5;
      return texture2D(uSource, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
    }
    float roundedDistance(vec2 p, vec2 halfSize, float radius) {
      vec2 q = abs(p) - halfSize + radius;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    }
    void main() {
      vec2 px = vUV * uSize;
      vec3 color = backgroundAt(px);
      for (int i = 0; i < 4; i++) {
        if (i < uCount) {
          vec4 rect = uRect[i];
          vec2 halfSize = rect.zw * 0.5;
          vec2 p = px - rect.xy - halfSize;
          float radius = uMaterial[i].x;
          float strength = uMaterial[i].y;
          float blur = uMaterial[i].z;
          float tint = uMaterial[i].w;
          float d = roundedDistance(p, halfSize, radius);
          // Soft local shadow; no full-surface opaque scrim.
          if (d > 0.0 && d < 30.0) {
            color *= 1.0 - 0.13 * exp(-d / 8.0);
          }
          if (d < 1.0) {
            vec2 gradient = vec2(
              roundedDistance(p + vec2(0.5, 0.0), halfSize, radius) - roundedDistance(p - vec2(0.5, 0.0), halfSize, radius),
              roundedDistance(p + vec2(0.0, 0.5), halfSize, radius) - roundedDistance(p - vec2(0.0, 0.5), halfSize, radius)
            );
            vec2 normal = gradient / max(length(gradient), 0.0001);
            float depth = max(-d, 0.0);
            float edgeWidth = min(22.0, min(halfSize.x, halfSize.y) * 0.7);
            float edge = 1.0 - smoothstep(0.0, edgeWidth, depth);
            vec2 displacement = (-normal * strength * edge * edge - p * 0.012 * (1.0 - edge)) * uRefraction;
            vec2 samplePoint = px + displacement;
            float b = blur * (1.0 - edge * 0.75);
            vec3 lens = backgroundAt(samplePoint) * 0.4;
            lens += backgroundAt(samplePoint + vec2(b, 0.0)) * 0.15;
            lens += backgroundAt(samplePoint - vec2(b, 0.0)) * 0.15;
            lens += backgroundAt(samplePoint + vec2(0.0, b)) * 0.15;
            lens += backgroundAt(samplePoint - vec2(0.0, b)) * 0.15;
            lens = mix(lens, vec3(1.0), tint);
            float rim = 1.0 - smoothstep(0.0, 1.65, depth);
            float specular = pow(max(dot(normal, normalize(vec2(-0.45, -0.9))), 0.0), 2.0);
            float shade = pow(max(dot(normal, normalize(vec2(0.7, 0.8))), 0.0), 2.0);
            lens *= 1.0 - shade * edge * 0.14;
            lens = mix(lens, vec3(1.0), rim * (0.26 + 0.53 * specular));
            float lightDistance = length(px - uLight.xy);
            lens = mix(lens, vec3(1.0), exp(-lightDistance * lightDistance / 7000.0) * uLight.z * 0.12);
            color = mix(color, lens, 1.0 - smoothstep(-0.6, 0.8, d));
          }
        }
      }
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  /**
   * source: loaded, origin-clean Canvas/Image/ImageBitmap/Video.
   * Lens geometry uses CSS pixels relative to this canvas, top-left origin.
   * render([{x,y,width,height,radius,refraction,blur,tint}], {refraction,light})
   * Call render during an actual transition; no permanent animation loop.
   */
  function createRenderer(canvas, options = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('A canvas is required.');
    const css = canvas.ownerDocument?.defaultView?.getComputedStyle?.(canvas);
    const token = (name, fallback) => {
      const value = Number.parseFloat(css?.getPropertyValue(`--lg-optics-${name}`));
      return Number.isFinite(value) ? value : fallback;
    };
    const defaults = { refraction: token('edge-displacement', 15), blur: token('regular-blur', 1.2), tint: token('regular-tint', 0.045), radius: token('radius', 30), maxDpr: token('max-dpr', 1.5) };
    let gl;
    let program;
    let buffer;
    let texture;
    let uniforms;
    let source = options.source;
    let width = 1;
    let height = 1;
    let sourceWidth = 1;
    let sourceHeight = 1;
    let mode = 'fallback';
    let reason = 'initializing';
    let destroyed = false;
    let lastLenses = [];
    let lastOptions = {};
    const report = (next, why = '') => {
      mode = next; reason = why;
      options.onStatus?.({ mode, reason });
    };
    const release = () => {
      if (!gl) return;
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      texture = buffer = program = null;
    };
    const compile = (type, sourceCode) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, sourceCode);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${message}`);
      }
      return shader;
    };
    const upload = () => {
      sourceWidth = source?.videoWidth || source?.naturalWidth || source?.width;
      sourceHeight = source?.videoHeight || source?.naturalHeight || source?.height;
      if (!(sourceWidth > 0 && sourceHeight > 0)) throw new Error('The source must be loaded and have nonzero dimensions.');
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('Texture upload failed. Check texture size and CORS.');
    };
    const setup = () => {
      try {
        gl ||= canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
        if (!gl) throw new Error('WebGL is unavailable.');
        release();
        const shaders = [];
        try {
          shaders.push(compile(gl.VERTEX_SHADER, vertexSource));
          shaders.push(compile(gl.FRAGMENT_SHADER, fragmentSource));
          program = gl.createProgram();
          shaders.forEach((shader) => gl.attachShader(program, shader));
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
        } finally { shaders.forEach((shader) => gl.deleteShader(shader)); }
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        uniforms = Object.fromEntries(['uSource','uSize','uSourceSize','uCount','uRect[0]','uMaterial[0]','uRefraction','uLight'].map((key) => [key, gl.getUniformLocation(program, key)]));
        upload();
        report('webgl');
      } catch (error) { release(); report('fallback', error.message); }
    };
    const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;
    const api = {
      get status() { return { mode, reason }; },
      resize(cssWidth, cssHeight) {
        if (destroyed) return;
        if (![cssWidth, cssHeight].every((value) => Number.isFinite(value) && value > 0)) throw new RangeError('Canvas CSS dimensions must be finite and positive.');
        width = cssWidth; height = cssHeight;
        const deviceRatio = canvas.ownerDocument?.defaultView?.devicePixelRatio || 1;
        const ratio = Math.min(deviceRatio, Math.max(0.5, finite(options.maxDpr, defaults.maxDpr)));
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        api.render(lastLenses, lastOptions);
      },
      setSource(nextSource) {
        if (destroyed) return;
        source = nextSource;
        if (mode !== 'webgl') { setup(); return; }
        try { upload(); api.render(lastLenses, lastOptions); }
        catch (error) { release(); report('fallback', error.message); }
      },
      render(lenses = [], settings = {}) {
        if (destroyed || mode !== 'webgl') return false;
        if (!Array.isArray(lenses) || lenses.length > MAX_LENSES) throw new RangeError(`Use at most ${MAX_LENSES} independent lenses.`);
        const rects = new Float32Array(MAX_LENSES * 4);
        const materials = new Float32Array(MAX_LENSES * 4);
        lenses.forEach((lens, index) => {
          if (![lens.x,lens.y,lens.width,lens.height].every(Number.isFinite) || lens.width <= 0 || lens.height <= 0) throw new TypeError('Lens geometry must contain finite positive dimensions.');
          rects.set([lens.x,lens.y,lens.width,lens.height], index * 4);
          materials.set([
            Math.min(Math.max(0, finite(lens.radius, defaults.radius)), lens.width / 2, lens.height / 2),
            Math.min(32, Math.max(0, finite(lens.refraction, defaults.refraction))),
            Math.min(8, Math.max(0, finite(lens.blur, defaults.blur))),
            Math.min(0.25, Math.max(0, finite(lens.tint, defaults.tint)))
          ], index * 4);
        });
        lastLenses = lenses; lastOptions = settings;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.uniform1i(uniforms.uSource, 0);
        gl.uniform2f(uniforms.uSize, width, height);
        gl.uniform2f(uniforms.uSourceSize, sourceWidth, sourceHeight);
        gl.uniform1i(uniforms.uCount, lenses.length);
        gl.uniform4fv(uniforms['uRect[0]'], rects);
        gl.uniform4fv(uniforms['uMaterial[0]'], materials);
        gl.uniform1f(uniforms.uRefraction, settings.refraction === false ? 0 : 1);
        const light = settings.light || {};
        gl.uniform3f(uniforms.uLight, finite(light.x, -1000), finite(light.y, -1000), Math.min(1, Math.max(0, finite(light.intensity, 0))));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return true;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        canvas.removeEventListener?.('webglcontextlost', onLost);
        canvas.removeEventListener?.('webglcontextrestored', onRestored);
        release(); report('destroyed');
      }
    };
    const onLost = (event) => { event.preventDefault(); report('fallback', 'WebGL context lost.'); };
    const onRestored = () => { if (!destroyed) { setup(); api.render(lastLenses, lastOptions); } };
    canvas.addEventListener?.('webglcontextlost', onLost);
    canvas.addEventListener?.('webglcontextrestored', onRestored);
    setup();
    return api;
  }
  global.LiquidGlassOptics = { createRenderer, maxLenses: MAX_LENSES };
})(globalThis);

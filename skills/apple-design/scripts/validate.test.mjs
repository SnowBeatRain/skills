import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { collectResources, preflight, sourceManifest, verifyEvidence } from './validate.mjs';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(base, 'examples/optical-reference.html');
const rendererSource = readFileSync(join(base, 'assets/liquid-glass-optics.js'), 'utf8');
const loadRenderer = () => { const context = {}; vm.runInNewContext(rendererSource, context); return context.LiquidGlassOptics; };
const temp = mkdtempSync(join(tmpdir(), 'apple-glass-tests-'));
test.after(() => {
  const inside = relative(resolve(tmpdir()), resolve(temp));
  assert(inside && !inside.startsWith('..') && !inside.includes('/') && !inside.includes('\\'));
  rmSync(temp, { recursive: true });
});

test('ordinary frosted material cannot pass optical preflight', () => {
  const basic = join(temp, 'basic.html');
  writeFileSync(join(temp, 'basic.css'), readFileSync(join(base, 'assets/liquid-glass.css')));
  writeFileSync(basic, '<!doctype html><html lang="en"><head><link rel="stylesheet" href="./basic.css"></head><body><button class="lg-surface">Basic test fixture</button></body></html>');
  assert.equal(preflight(basic, 'basic').errors.length, 0);
  assert(preflight(basic, 'optical').errors.some((s) => s.includes('WebGL')));
});

test('optical dependency graph follows CSS url imports and rejects missing resources', () => {
  const files = [...collectResources(entry).keys()];
  assert(files.includes(join(base, 'assets/liquid-glass.css')));
  assert(files.includes(join(base, 'assets/liquid-glass-optics.js')));
  assert.equal(preflight(entry, 'optical').errors.length, 0);
  const broken = join(temp, 'broken.html');
  writeFileSync(broken, '<link rel="stylesheet" href="./absent.css">');
  assert.throws(() => collectResources(broken), /absent.css/);
});

test('renderer module evaluates without browser globals', () => {
  const api = loadRenderer();
  assert.equal(typeof api.createRenderer, 'function');
  assert.throws(() => api.createRenderer(null), /canvas is required/);
});

test('unavailable GPU reports fallback and cleanup removes listeners', () => {
  const listeners = new Map();
  const states = [];
  const canvas = {
    getContext: () => null,
    addEventListener: (key, fn) => listeners.set(key, fn),
    removeEventListener: (key) => listeners.delete(key)
  };
  const renderer = loadRenderer().createRenderer(canvas, { onStatus: (s) => states.push(s.mode) });
  assert.equal(renderer.status.mode, 'fallback');
  assert.equal(renderer.render([]), false);
  renderer.destroy(); renderer.destroy();
  assert.equal(listeners.size, 0);
  assert.deepEqual(states, ['fallback', 'destroyed']);
});

test('shader compilation failure is not reported as working optics', () => {
  let deleted = 0;
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3,
    createShader: () => ({}), shaderSource() {}, compileShader() {},
    getShaderParameter: () => false, getShaderInfoLog: () => 'fixture compile failure',
    deleteShader: () => { deleted++; }
  };
  const renderer = loadRenderer().createRenderer({ getContext: () => gl });
  assert.equal(renderer.status.mode, 'fallback');
  assert.match(renderer.status.reason, /fixture compile failure/);
  assert.equal(deleted, 1);
  renderer.destroy();
});

test('invalid resize does not allocate unbounded drawing buffers', () => {
  const renderer = loadRenderer().createRenderer({ getContext: () => null });
  assert.throws(() => renderer.resize(Infinity, 100), /finite/);
  assert.throws(() => renderer.resize(100, -1), /positive/);
  renderer.destroy();
});

test('receipt structure binds source hashes, cases, renderer mode and screenshot files', () => {
  // A schema fixture, NOT an actual visual acceptance record.
  const png = join(temp, 'fixture.png');
  writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=', 'base64'));
  const receipt = {
    version: 1, profile: 'optical', renderer: 'webgl', ...sourceManifest(entry),
    testedAt: new Date().toISOString(), environment: { browser: 'schema fixture', width: 1, height: 1 },
    cases: ['lensing','transmission','morph','input','fallback','motion','contrast'].map((id) => ({ id, status: 'pass', notes: 'Schema test only; this is not visual evidence.', evidence: ['fixture.png'] }))
  };
  const path = join(temp, 'receipt.json');
  const check = () => { writeFileSync(path, JSON.stringify(receipt)); return verifyEvidence(path, entry); };
  assert.equal(check().length, 0);
  const key = Object.keys(receipt.files)[0], original = receipt.files[key];
  receipt.files[key] = 'old-hash'; assert(check().some((s) => s.includes(key))); receipt.files[key] = original;
  receipt.renderer = 'fallback'; assert(check().some((s) => s.includes('webgl'))); receipt.renderer = 'webgl';
  receipt.cases[0].status = 'not-run'; assert(check().some((s) => s.includes('lensing'))); receipt.cases[0].status = 'pass';
  receipt.cases[0].evidence = ['missing.png']; assert(check().some((s) => s.includes('missing.png')));
});

test('CLI works from another cwd and rejects incomplete options', () => {
  const cli = join(base, 'scripts/validate.mjs');
  const valid = spawnSync(process.execPath, [cli, '--profile', 'optical', entry], { cwd: temp, encoding: 'utf8' });
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /NEEDS_VISUAL_QA/);
  const bad = spawnSync(process.execPath, [cli, entry, '--evidence'], { cwd: temp, encoding: 'utf8' });
  assert.notEqual(bad.status, 0);
});

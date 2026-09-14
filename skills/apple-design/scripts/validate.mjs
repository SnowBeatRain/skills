#!/usr/bin/env node
/** Node >=20. Static preflight is NOT optical acceptance. See visual-validation.md. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokenPath = resolve(base, 'assets/tokens.json');
const slash = (s) => s.replaceAll('\\', '/');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const requiredCases = ['lensing', 'transmission', 'morph', 'input', 'fallback', 'motion', 'contrast'];

export function collectResources(file, seen = new Map()) {
  file = resolve(file);
  if (seen.has(file)) return seen;
  const source = readFileSync(file, 'utf8');
  seen.set(file, source);
  const refs = [];
  if (extname(file) === '.html') {
    for (const match of source.matchAll(/<(link|script)\b[^>]*>/gi)) {
      if (match[1].toLowerCase() === 'link' && !/rel\s*=\s*["']stylesheet["']/i.test(match[0])) continue;
      const ref = match[0].match(/(?:href|src)\s*=\s*["']([^"']+)["']/i)?.[1];
      if (ref) refs.push(ref);
    }
  } else if (extname(file) === '.css') {
    for (const match of stripComments(source).matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?/g)) refs.push(match[1]);
  } else if (/\.[cm]?[jt]sx?$/.test(file)) {
    for (const match of source.matchAll(/\bimport\s+(?:[^;\n]*?\s+from\s+)?["']([^"']+)["']/g)) {
      if (match[1].startsWith('.')) refs.push(match[1]);
    }
  }
  for (const ref of refs) {
    if (/^(?:[a-z]+:|\/\/)/i.test(ref)) throw new Error(`外部代码资源不能纳入离线验收：${ref}`);
    if (ref.startsWith('/')) throw new Error(`请先映射站点绝对路径：${ref}`);
    const target = resolve(dirname(file), ref.split(/[?#]/)[0]);
    const found = [target, ...['.ts','.tsx','.js','.jsx','.css'].map((e) => target + e)].find(existsSync);
    if (!found) throw new Error(`缺少本地依赖：${ref}`);
    collectResources(found, seen);
  }
  return seen;
}

export function sourceManifest(entry) {
  const resources = collectResources(entry);
  resources.set(tokenPath, readFileSync(tokenPath, 'utf8'));
  return {
    entry: slash(relative(base, resolve(entry))),
    files: Object.fromEntries([...resources].sort(([a], [b]) => a.localeCompare(b)).map(([path, content]) => [
      slash(relative(base, path)), createHash('sha256').update(content.replace(/\r\n/g, '\n')).digest('hex')
    ]))
  };
}

export function verifyEvidence(evidencePath, entry) {
  const receipt = JSON.parse(readFileSync(evidencePath, 'utf8'));
  const manifest = sourceManifest(entry);
  const errors = [];
  if (receipt.version !== 1 || receipt.profile !== 'optical' || receipt.renderer !== 'webgl') errors.push('验收记录必须为 v1 optical / webgl，降级不能通过光学验收');
  if (receipt.entry !== manifest.entry) errors.push('验收记录的入口不匹配');
  const files = receipt.files || {};
  if (Object.keys(files).length !== Object.keys(manifest.files).length) errors.push('验收记录的文件范围已改变');
  for (const [path, hash] of Object.entries(manifest.files)) if (files[path] !== hash) errors.push(`证据已过期或缺失：${path}`);
  if (!receipt.testedAt || !Number.isFinite(Date.parse(receipt.testedAt))) errors.push('缺少有效的验收时间');
  if (!receipt.environment?.browser || !(receipt.environment?.width > 0) || !(receipt.environment?.height > 0)) errors.push('缺少实际浏览器与视口信息');
  const cases = new Map((receipt.cases || []).map((item) => [item.id, item]));
  for (const id of requiredCases) {
    const item = cases.get(id);
    if (item?.status !== 'pass' || !item.notes || !item.evidence?.length) { errors.push(`视觉项目未完成：${id}`); continue; }
    for (const name of item.evidence) {
      if (typeof name !== 'string' || isAbsolute(name) || name.split(/[\\/]/).includes('..')) { errors.push(`非法证据路径：${name}`); continue; }
      const file = resolve(dirname(evidencePath), name);
      try {
        const data = readFileSync(file);
        if (!data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) errors.push(`截图不是 PNG：${name}`);
      } catch { errors.push(`截图不存在：${name}`); }
    }
  }
  return errors;
}

function tokenBlock() {
  const tokens = JSON.parse(readFileSync(tokenPath, 'utf8'));
  const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const vars = {};
  for (const [group, values] of Object.entries(tokens.intensity)) {
    for (const [key, value] of Object.entries(values)) if (key !== 'usage') vars[`${group}-${kebab(key)}`] = value;
  }
  for (const group of ['radius','shadow','inset','highlight','motion','darkMode','optics']) {
    for (const [key, value] of Object.entries(tokens[group])) vars[`${group === 'darkMode' ? 'dark' : group}-${kebab(key)}`] = value;
  }
  Object.assign(vars, tokens.cssVariables);
  return `/* tokens:start */\n:root {\n${Object.entries(vars).map(([key, value]) => `  --lg-${key}: ${value};`).join('\n')}\n}\n/* tokens:end */`;
}

export function preflight(entry, profile = 'optical') {
  const sources = collectResources(entry);
  const errors = [], warnings = [], styles = [];
  for (const [path, source] of sources) {
    if (extname(path) === '.css') styles.push(source);
    if (extname(path) === '.html') {
      for (const m of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) styles.push(m[1]);
      for (const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (!/\bsrc\s*=/.test(m[1]) && !/type\s*=\s*["']module/.test(m[1])) new Script(m[2], { filename: path });
      }
    }
    if (extname(path) === '.js') new Script(source, { filename: path });
  }
  const style = stripComments(styles.join('\n'));
  const definitions = new Map([...style.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map((m) => [m[1], m[2].trim()]));
  const expand = (value, depth = 0) => depth > 16 ? value : value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]+))?\)/g, (all, key, fallback) => definitions.has(key) ? expand(definitions.get(key), depth + 1) : (fallback ?? all));
  const expanded = expand(style);
  for (const [pattern, message] of [
    [/prefers-reduced-transparency/, '缺少降低透明度规则'],
    [/prefers-reduced-motion/, '缺少减少动态规则'],
    [/@supports\s+not/, '缺少 CSS 能力降级'],
    [/forced-colors/, '缺少强制颜色模式'],
    [/:focus-visible/, '缺少可见键盘焦点']
  ]) if (!pattern.test(style)) errors.push(message);
  const html = sources.get(resolve(entry));
  if (profile === 'optical') {
    const code = [...sources.values()].join('\n');
    for (const [pattern, message] of [
      [/getContext\(["']webgl2?["']/, '没有 WebGL 初始化；基础 blur 不能通过 optical 预检'],
      [/texture2D\(|texture\(/, '没有可检查的纹理采样实现'],
      [/displacement/, '没有可检查的位移路径'],
      [/webglcontextlost/, '缺少 WebGL 上下文失败处理'],
      [/fallback/, '缺少明确的降级状态']
    ]) if (!pattern.test(code)) errors.push(message);
    if (!/<canvas\b/.test(html) || !/<(?:button|input|nav)\b/.test(html)) errors.push('光学入口需包含背景画布和真实语义控件');
    if (/class(?:Name)?\s*=\s*["'][^"']*\blg-surface\b/.test(html)) errors.push('入口仍使用旧 lg-surface；请区分 optical 控件与 basic 内容');
    warnings.push('静态代码存在不代表 GPU 输出正确；需当前版本的视觉验收记录');
  } else {
    if (!/backdrop-filter\s*:[^;{}]*blur\([^;{}]*saturate\(/.test(expanded)) errors.push('基础毛玻璃缺少 blur + saturate');
    if (/(?:^|[;{}])\s*(?:-webkit-)?filter\s*:[^;{}]*blur\(/m.test(expanded)) errors.push('检测到对内容使用 filter:blur');
  }
  if (/\.(tsx|jsx)$/.test(entry)) warnings.push('TSX 需要另外进行框架类型检查/构建');
  return { errors, warnings, sources };
}

function main() {
  const args = process.argv.slice(2);
  const cssPath = resolve(base, 'assets/liquid-glass.css');
  const css = readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
  const marker = /\/\* tokens:start \*\/[\s\S]*?\/\* tokens:end \*\//;
  if (args.length === 1 && args[0] === '--sync-tokens') {
    if (!marker.test(css)) throw new Error('CSS 缺少令牌标记');
    writeFileSync(cssPath, css.replace(marker, () => tokenBlock()), 'utf8');
    console.log('已同步 CSS Tokens，包含光学默认参数与历史基础配方。'); return;
  }
  let profile = 'optical', evidence, manifestPath;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (['--profile','--evidence','--manifest'].includes(args[i]) && (!args[i + 1] || args[i + 1].startsWith('--'))) throw new Error(`${args[i]} 缺少取值`);
    if (args[i] === '--profile') profile = args[++i];
    else if (args[i] === '--evidence') evidence = args[++i];
    else if (args[i] === '--manifest') manifestPath = args[++i];
    else if (args[i].startsWith('--')) throw new Error(`未知选项：${args[i]}`);
    else files.push(args[i]);
  }
  if (!files.length || !['basic','optical'].includes(profile)) throw new Error('用法: node scripts/validate.mjs --profile optical|basic [--evidence receipt.json | --manifest manifest.json] <file...>');
  if ((evidence || manifestPath) && files.length !== 1) throw new Error('验收记录/manifest 每次只对应一个入口');
  if (evidence && profile !== 'optical') throw new Error('basic 级别不能用光学证据宣称通过');
  if (manifestPath) { writeFileSync(resolve(manifestPath), JSON.stringify(sourceManifest(resolve(files[0])), null, 2) + '\n'); console.log('已记录来源哈希；没有生成任何通过状态。'); return; }
  let errors = 0, warnings = 0;
  if (css.match(marker)?.[0] !== tokenBlock()) { console.error('CSS 与 tokens.json 不一致，请 --sync-tokens 后重新验收。'); errors++; }
  for (const file of files) {
    console.log(`\n── ${profile}: ${file} ──`);
    try {
      const result = preflight(resolve(file), profile);
      if (evidence) {
        result.errors.push(...verifyEvidence(resolve(evidence), resolve(file)));
        result.warnings = result.warnings.filter((s) => !s.startsWith('静态代码存在'));
      }
      result.errors.forEach((message) => console.log(`  ✗ ${message}`));
      result.warnings.forEach((message) => console.log(`  ⚠ ${message}`));
      if (!result.errors.length) console.log(evidence ? '  ✓ 静态检查与验收记录完整性通过（截图判断由验收者负责）' : '  ✓ 静态预检通过');
      errors += result.errors.length; warnings += result.warnings.length;
    } catch (error) { console.log(`  ✗ ${error.message}`); errors++; }
  }
  console.log(`\n结果：${errors} 错误，${warnings} 提示。`);
  if (profile === 'basic') console.log('级别：基础毛玻璃。此结果不代表 Liquid Glass 光学验收。');
  else if (!evidence) console.log('视觉状态：NEEDS_VISUAL_QA。不得仅凭此结果宣称 Liquid Glass 已完成。');
  process.exitCode = errors ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

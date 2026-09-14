#!/usr/bin/env node
/** 静态预检（非浏览器、对比度或性能认证）。Node >=20，无第三方依赖。
 * node scripts/validate.mjs examples/card.html
 * node scripts/validate.mjs --sync-tokens  # 修改 JSON 后刷新 CSS 令牌区
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(resolve(base, 'assets/tokens.json'), 'utf8'));
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const variables = {};
for (const [group, values] of Object.entries(tokens.intensity)) {
  for (const [key, value] of Object.entries(values)) {
    if (key !== 'usage') variables[`${group}-${kebab(key)}`] = value;
  }
}
for (const group of ['radius', 'shadow', 'inset', 'highlight', 'motion', 'darkMode']) {
  for (const [key, value] of Object.entries(tokens[group])) {
    variables[`${group === 'darkMode' ? 'dark' : group}-${kebab(key)}`] = value;
  }
}
Object.assign(variables, tokens.cssVariables);
const tokenBlock = `/* tokens:start */\n:root {\n${Object.entries(variables).map(([k, v]) => `  --lg-${k}: ${v};`).join('\n')}\n}\n/* tokens:end */`;
const cssPath = resolve(base, 'assets/liquid-glass.css');
const css = readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
const marker = /\/\* tokens:start \*\/[\s\S]*?\/\* tokens:end \*\//;
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--sync-tokens') {
  if (!marker.test(css)) throw new Error('CSS 缺少令牌区标记');
  writeFileSync(cssPath, css.replace(marker, () => tokenBlock), 'utf8');
  console.log('已从 tokens.json 同步 CSS 令牌区。');
  process.exit(0);
}
if (!args.length || args.some((a) => a.startsWith('--'))) {
  console.error('用法: node scripts/validate.mjs <file...> 或 --sync-tokens');
  process.exit(1);
}

let totalErrors = 0;
let totalWarnings = 0;
if (css.match(marker)?.[0] !== tokenBlock) {
  console.error('✗ CSS 与 tokens.json 不一致；运行 --sync-tokens 后重新校验。');
  totalErrors++;
}
const stripCSSComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

function collect(file, seen = new Map()) {
  if (seen.has(file)) return seen;
  const source = readFileSync(file, 'utf8');
  seen.set(file, source);
  const refs = [];
  if (extname(file) === '.html') {
    for (const match of source.matchAll(/<(link|script)\b[^>]*>/gi)) {
      const tag = match[0];
      if (match[1].toLowerCase() === 'link' && !/rel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
      const ref = tag.match(/(?:href|src)\s*=\s*["']([^"']+)["']/i)?.[1];
      if (ref) refs.push(ref);
    }
  } else if (/\.(?:tsx?|jsx?|css)$/.test(file)) {
    for (const match of source.matchAll(/(?:\bimport\s+(?:[^;\n]*?\s+from\s+)?|@import\s+)["']([^"']+)["']/g)) refs.push(match[1]);
  }
  for (const ref of refs) {
    if (/^(?:[a-z]+:|\/\/)/i.test(ref)) throw new Error(`外部资源无法离线校验：${ref}`);
    if (!ref.startsWith('.') && extname(file) !== '.html') continue; // 框架包交给其构建工具
    if (ref.startsWith('/')) throw new Error(`站点绝对路径需先映射本地根目录：${ref}`);
    const target = resolve(dirname(file), ref.split(/[?#]/)[0]);
    const found = [target, ...['.ts', '.tsx', '.js', '.jsx', '.css'].map((e) => target + e)].find(existsSync);
    if (!found) throw new Error(`缺少本地依赖：${ref}`);
    collect(found, seen);
  }
  return seen;
}

for (const arg of args) {
  console.log(`\n── ${arg} ──`);
  const errors = [];
  const warnings = [];
  try {
    const file = resolve(process.cwd(), arg);
    const sources = collect(file);
    const styles = [];
    for (const [path, source] of sources) {
      if (extname(path) === '.css') styles.push(source);
      if (extname(path) === '.html') {
        for (const m of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) styles.push(m[1]);
        for (const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
          if (!m[1].includes('src=') && !m[1].includes('type="module"')) new Script(m[2], { filename: path });
        }
      }
      if (extname(path) === '.js') new Script(source, { filename: path });
    }
    const style = stripCSSComments(styles.join('\n'));
    const definitions = new Map([...style.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map((m) => [m[1], m[2].trim()]));
    const expand = (value, depth = 0) => depth > 16 ? value : value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]+))?\)/g, (all, key, fallback) => definitions.has(key) ? expand(definitions.get(key), depth + 1) : (fallback ?? all));
    const expanded = expand(style);
    const checks = [
      [/backdrop-filter\s*:[^;{}]*blur\([^;{}]*saturate\(/, 'backdrop-filter 必须同时含 blur 与 saturate'],
      [/-webkit-backdrop-filter\s*:/, '缺少 -webkit-backdrop-filter 前缀'],
      [/border\s*:\s*1px\s+solid\s+rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/, '缺少 1px 半透明白边（支持 CSS 变量）'],
      [/box-shadow\s*:[^;{}]*inset\s+0\s+1px\s+0/, '缺少实际使用的顶部 inset 高光'],
      [/box-shadow\s*:[^;{}]*0\s+(?:8|20|32)px\s+(?:24|50|80)px\s+rgba\(0,\s*0,\s*0,/, '缺少配方中的柔和外阴影'],
      [/@media\s*\(prefers-reduced-transparency:\s*reduce\)/, '缺少降低透明度降级'],
      [/@media\s*\(prefers-reduced-motion:\s*reduce\)/, '缺少减弱动态降级'],
      [/@supports\s+not/, '缺少 backdrop-filter 特性降级'],
      [/@media\s*\(forced-colors:\s*active\)/, '缺少强制颜色模式'],
      [/:focus-visible/, '缺少可见键盘焦点']
    ];
    for (const [pattern, message] of checks) if (!pattern.test(expanded)) errors.push(message);
    if (/(?:^|[;{}])\s*(?:-webkit-)?filter\s*:[^;{}]*blur\(/m.test(expanded)) errors.push('不可使用 filter: blur() 模糊组件内容');
    for (const m of expanded.matchAll(/border-radius\s*:\s*(\d+(?:\.\d+)?)px/g)) {
      if (+m[1] > 0 && +m[1] < 16) errors.push(`圆角 ${m[1]}px 小于 16px`);
    }
    for (const m of style.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (!definitions.has(m[1]) && !['--lg-mx', '--lg-my'].includes(m[1])) errors.push(`未定义 CSS 变量 ${m[1]}`);
    }
    if (/(?:#(?:0ff|f0f|00ffff|ff00ff)(?![\da-f])|\b(?:cyan|lime|magenta)\b)/i.test(style)) warnings.push('检测到高饱和颜色，请人工检查是否有霓虹视觉');
    const entry = sources.get(file);
    if (extname(file) === '.html') {
      if (!/lang=["']/.test(entry) || !/name=["']viewport["']/.test(entry)) errors.push('HTML 缺少语言或 viewport');
      if (!/(?:gradient\(|background(?:-image)?\s*:\s*url\(|<video\b)/i.test(entry + style)) errors.push('缺少非纯色背景候选');
      let nesting = 0;
      let count = 0;
      const stack = [];
      for (const m of entry.matchAll(/<(\/)?([a-z][\w-]*)\b[^>]*>/gi)) {
        const name = m[2].toLowerCase();
        if (m[1]) {
          const index = stack.map((t) => t.name).lastIndexOf(name);
          if (index >= 0) for (const item of stack.splice(index)) if (item.glass) nesting--;
          continue;
        }
        const glass = /class=["'][^"']*\blg-surface\b[^"']*["']/.test(m[0]);
        if (glass) { count++; nesting++; if (nesting > tokens.limits.maxNestingDepth) errors.push('玻璃嵌套超过 3 层'); }
        if (!/^(?:meta|link|img|input|br|hr|source|area|base|embed|param|track|wbr)$/.test(name)) stack.push({ name, glass });
      }
      if (count > tokens.limits.maxSurfacesPerScreen) warnings.push(`文档有 ${count} 个玻璃节点，需人工检查同屏数量`);
      if (/aria-modal=["']true["']/.test(entry) && !/<dialog\b/.test(entry)) warnings.push('自定义模态框需手动验证焦点陷阱、Escape、焦点归还');
    }
    if (/\.(tsx|jsx)$/.test(file)) console.log('  · 已检查本地引用；TSX 编译需 React/TypeScript 工具链。');
  } catch (error) { errors.push(error.message); }
  for (const message of new Set(errors)) console.log(`  ✗ ${message}`);
  for (const message of new Set(warnings)) console.log(`  ⚠ ${message}`);
  if (!errors.length && !warnings.length) console.log('  ✓ 静态预检通过');
  totalErrors += errors.length;
  totalWarnings += warnings.length;
}
console.log(`\n结果: ${totalErrors} 错误, ${totalWarnings} 警告。对比度、实际级联、帧率与键盘行为仍需运行验证。`);
process.exitCode = totalErrors ? 1 : 0;

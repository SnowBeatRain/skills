#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const minDescriptionLength = 12;
const maxSkillLines = 220;
const allowedLinkedDirs = new Set(['references', 'scripts', 'assets']);
const sensitivePatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /Bearer\s+[A-Za-z0-9._-]{20,}/i,
  /(api[_-]?key|token|secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}/i
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;

  const data = {};
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }
  return data;
}

function countLines(content) {
  if (!content) return 0;
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
}

function collectBacktickLinks(content) {
  const links = [];
  const re = /`((?:references|scripts|assets)\/[^`]+)`/g;
  let match;
  while ((match = re.exec(content))) links.push(match[1]);
  return links;
}

function hasPathTraversal(relativePath) {
  return relativePath.split(/[\\/]+/).includes('..');
}

async function fileExists(filePath) {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}

async function collectFiles(dir) {
  const files = [];
  async function walk(current) {
    const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  await walk(dir);
  return files;
}

async function scanSensitive(skillName, skillPath, errors) {
  const files = await collectFiles(skillPath);
  for (const file of files) {
    const relative = path.relative(skillPath, file);
    if (!/\.(md|json|json5|mjs|js|ts|uts|vue)$/i.test(relative)) continue;
    const content = await readFile(file, 'utf8').catch(() => '');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(line)) {
          errors.push(`${skillName}: ${relative}:${index + 1} 疑似包含敏感信息`);
          break;
        }
      }
    });
  }
}

async function validateSkill(entry, errors) {
  const skillPath = path.join(skillsDir, entry);
  const info = await stat(skillPath);
  if (!info.isDirectory()) return false;

  if (!namePattern.test(entry)) {
    errors.push(`${entry}: 目录名必须是英文 kebab-case`);
  }

  const skillFile = path.join(skillPath, 'SKILL.md');
  const content = await readFile(skillFile, 'utf8').catch(() => null);
  if (content === null) {
    errors.push(`${entry}: 缺少 SKILL.md`);
    return true;
  }

  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push(`${entry}: SKILL.md 缺少 YAML frontmatter`);
  } else {
    if (!frontmatter.name) errors.push(`${entry}: frontmatter 缺少 name`);
    if (!frontmatter.description) errors.push(`${entry}: frontmatter 缺少 description`);
    if (frontmatter.name && frontmatter.name !== entry) {
      errors.push(`${entry}: frontmatter 的 name 必须与目录名一致`);
    }
    if (frontmatter.description && frontmatter.description.length < minDescriptionLength) {
      errors.push(`${entry}: description 需要更具体，至少说明何时触发`);
    }
  }

  const lineCount = countLines(content);
  if (lineCount > maxSkillLines) {
    errors.push(`${entry}: SKILL.md 过长（${lineCount} 行），请将细节下沉到 references/，上限 ${maxSkillLines} 行`);
  }

  for (const relativeLink of collectBacktickLinks(content)) {
    const topDir = relativeLink.split('/')[0];
    if (!allowedLinkedDirs.has(topDir) || hasPathTraversal(relativeLink)) {
      errors.push(`${entry}: 非法引用路径 ${relativeLink}`);
      continue;
    }
    const target = path.join(skillPath, relativeLink);
    if (!(await fileExists(target))) {
      errors.push(`${entry}: 引用不存在 ${relativeLink}`);
    }
  }

  await scanSensitive(entry, skillPath, errors);
  return true;
}

async function main() {
  const entries = await readdir(skillsDir).catch(() => []);
  const skillNames = [];
  const errors = [];

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const isSkill = await validateSkill(entry, errors);
    if (isSkill) skillNames.push(entry);
  }

  if (errors.length) {
    console.error('Skill 校验失败：');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Skill 校验通过（${skillNames.length} 个 skill）。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

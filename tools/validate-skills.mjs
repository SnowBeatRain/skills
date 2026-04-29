#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const skillsDir = path.join(root, 'skills');
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const minDescriptionLength = 12;

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

async function main() {
  const entries = await readdir(skillsDir).catch(() => []);
  const skillNames = [];
  const errors = [];

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const skillPath = path.join(skillsDir, entry);
    const info = await stat(skillPath);
    if (!info.isDirectory()) continue;

    skillNames.push(entry);

    if (!namePattern.test(entry)) {
      errors.push(`${entry}: 目录名必须是英文 kebab-case`);
    }

    const skillFile = path.join(skillPath, 'SKILL.md');
    const content = await readFile(skillFile, 'utf8').catch(() => null);
    if (content === null) {
      errors.push(`${entry}: 缺少 SKILL.md`);
      continue;
    }

    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      errors.push(`${entry}: SKILL.md 缺少 YAML frontmatter`);
      continue;
    }

    if (!frontmatter.name) errors.push(`${entry}: frontmatter 缺少 name`);
    if (!frontmatter.description) errors.push(`${entry}: frontmatter 缺少 description`);
    if (frontmatter.name && frontmatter.name !== entry) {
      errors.push(`${entry}: frontmatter 的 name 必须与目录名一致`);
    }
    if (frontmatter.description && frontmatter.description.length < minDescriptionLength) {
      errors.push(`${entry}: description 需要更具体，至少说明何时触发`);
    }
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

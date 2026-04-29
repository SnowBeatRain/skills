#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const skillsDir = path.join(process.cwd(), 'skills');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return separator === -1
          ? [line, '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
}

const entries = await readdir(skillsDir).catch(() => []);
const skills = [];

for (const entry of entries) {
  if (entry.startsWith('.')) continue;
  const skillPath = path.join(skillsDir, entry);
  const info = await stat(skillPath);
  if (!info.isDirectory()) continue;
  const content = await readFile(path.join(skillPath, 'SKILL.md'), 'utf8').catch(() => '');
  const frontmatter = parseFrontmatter(content);
  skills.push({ name: frontmatter.name ?? entry, description: frontmatter.description ?? '' });
}

if (!skills.length) {
  console.log('还没有 skills。可以用这个命令创建：npm run new:skill -- my-skill "用于……场景，当用户需要……时使用"');
} else {
  for (const skill of skills) console.log(`- ${skill.name}: ${skill.description}`);
}

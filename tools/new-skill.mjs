#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , rawName, rawDescription] = process.argv;
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const minDescriptionLength = 12;

if (!rawName || !rawDescription) {
  console.error('用法：npm run new:skill -- <kebab-case-name> "用于……场景，当用户需要……时使用"');
  process.exit(1);
}

const name = rawName.trim();
const description = rawDescription.trim();

if (!namePattern.test(name)) {
  console.error('Skill 名称必须是英文 kebab-case，例如：repo-maintainer');
  process.exit(1);
}

if (description.length < minDescriptionLength) {
  console.error(`description 至少需要 ${minDescriptionLength} 个字符，并说明何时使用这个 skill。`);
  process.exit(1);
}

const title = name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const root = process.cwd();
const skillDir = path.join(root, 'skills', name);
const templatePath = path.join(root, 'templates', 'skill', 'SKILL.md');

const template = await readFile(templatePath, 'utf8');
const content = template
  .replaceAll('{{name}}', name)
  .replaceAll('{{description}}', description)
  .replaceAll('{{title}}', title)
  .replaceAll('{{when_to_use}}', description.replace(/[。.]$/, ''));

await mkdir(path.join(skillDir, 'references'), { recursive: true });
await mkdir(path.join(skillDir, 'scripts'), { recursive: true });
await mkdir(path.join(skillDir, 'assets'), { recursive: true });
await writeFile(path.join(skillDir, 'SKILL.md'), content, { flag: 'wx' });
await writeFile(path.join(skillDir, 'references', '.gitkeep'), '', { flag: 'wx' });
await writeFile(path.join(skillDir, 'scripts', '.gitkeep'), '', { flag: 'wx' });
await writeFile(path.join(skillDir, 'assets', '.gitkeep'), '', { flag: 'wx' });

console.log(`已创建 skills/${name}/SKILL.md`);

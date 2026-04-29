#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , rawName, rawDescription] = process.argv;
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

if (!rawName || !rawDescription) {
  console.error('Usage: npm run new:skill -- <kebab-case-name> "Description of when to use it"');
  process.exit(1);
}

const name = rawName.trim();
const description = rawDescription.trim();

if (!namePattern.test(name)) {
  console.error('Skill name must be kebab-case, for example: repo-maintainer');
  process.exit(1);
}

if (description.length < 30) {
  console.error('Description should be at least 30 characters and explain when to use the skill.');
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
  .replaceAll('{{when_to_use}}', description.replace(/\.$/, ''));

await mkdir(path.join(skillDir, 'references'), { recursive: true });
await mkdir(path.join(skillDir, 'scripts'), { recursive: true });
await mkdir(path.join(skillDir, 'assets'), { recursive: true });
await writeFile(path.join(skillDir, 'SKILL.md'), content, { flag: 'wx' });
await writeFile(path.join(skillDir, 'references', '.gitkeep'), '', { flag: 'wx' });
await writeFile(path.join(skillDir, 'scripts', '.gitkeep'), '', { flag: 'wx' });
await writeFile(path.join(skillDir, 'assets', '.gitkeep'), '', { flag: 'wx' });

console.log(`Created skills/${name}/SKILL.md`);

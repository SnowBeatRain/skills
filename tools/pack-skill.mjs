#!/usr/bin/env node
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const [, , skillName] = process.argv;

if (!skillName) {
  console.error('用法：npm run pack:skill -- <skill-name>');
  process.exit(1);
}

const root = process.cwd();
const skillDir = path.join(root, 'skills', skillName);
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, `${skillName}.zip`);

async function existsDirectory(target) {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

async function hasZip() {
  return new Promise((resolve) => {
    const child = spawn('zip', ['--version'], { stdio: 'ignore' });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function runZip() {
  return new Promise((resolve, reject) => {
    const child = spawn('zip', ['-r', outputFile, '.'], {
      cwd: skillDir,
      stdio: 'inherit'
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`zip 退出码：${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  if (!(await existsDirectory(skillDir))) {
    console.error(`未找到 skill：skills/${skillName}`);
    process.exit(1);
  }

  const files = await readdir(skillDir);
  if (!files.includes('SKILL.md')) {
    console.error(`skill 缺少 SKILL.md：skills/${skillName}`);
    process.exit(1);
  }

  if (!(await hasZip())) {
    console.error('打包需要系统存在 `zip` 命令。请安装 zip，或手动创建压缩包。');
    process.exit(1);
  }

  await mkdir(outputDir, { recursive: true });
  await runZip();
  console.log(`已打包：${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

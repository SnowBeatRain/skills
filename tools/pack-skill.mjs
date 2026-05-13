#!/usr/bin/env node
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { ZipArchive } from 'archiver';

const [, , skillName] = process.argv;

if (!skillName) {
  console.error('用法：npm run pack:skill -- <skill-name>');
  process.exit(1);
}

const root = process.cwd();
const skillDir = path.join(root, 'skills', skillName);
const outputDir = path.join(root, 'dist');
const outputFile = path.join(outputDir, `${skillName}.zip`);

/**
 * 要排除的文件模式列表
 * - .gitkeep: 空目录占位文件，分发时无意义
 * - .DS_Store: macOS 系统文件
 */
const EXCLUDE_PATTERNS = [
  '.gitkeep',
  '.DS_Store',
];

async function existsDirectory(target) {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

async function existsFile(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

/**
 * 删除旧的 zip 文件，确保每次打包是"重建"而非"增量更新"
 */
async function cleanOldZip() {
  if (await existsFile(outputFile)) {
    await unlink(outputFile);
  }
}

/**
 * 使用 archiver 库创建 zip 文件
 * - 跨平台，无需依赖系统 zip 命令
 * - 支持精确过滤排除文件
 */
async function runArchive() {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputFile);
    const archive = new ZipArchive({
      zlib: { level: 9 }, // 最高压缩级别
    });

    output.on('close', () => {
      const size = (archive.pointer() / 1024).toFixed(2);
      console.log(`已打包：${outputFile} (${size} KB)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // 使用 glob 模式打包所有文件，排除特定文件
    archive.glob('**/*', {
      cwd: skillDir,
      ignore: EXCLUDE_PATTERNS,
      nodir: true, // 只打包文件，不打包空目录
    });

    archive.finalize();
  });
}

async function main() {
  // 1. 检查 skill 目录是否存在
  if (!(await existsDirectory(skillDir))) {
    console.error(`未找到 skill：skills/${skillName}`);
    process.exit(1);
  }

  // 2. 检查 SKILL.md 是否存在
  const files = await readdir(skillDir);
  if (!files.includes('SKILL.md')) {
    console.error(`skill 缺少 SKILL.md：skills/${skillName}`);
    process.exit(1);
  }

  // 3. 确保输出目录存在
  await mkdir(outputDir, { recursive: true });

  // 4. 删除旧的 zip 文件（确保是"重建"而非"增量更新"）
  await cleanOldZip();

  // 5. 使用 archiver 创建新的 zip 文件
  await runArchive();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

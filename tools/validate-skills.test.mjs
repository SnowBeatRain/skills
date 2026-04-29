#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const validator = path.join(repoRoot, 'tools/validate-skills.mjs');

async function createRepo(skillBody, extraFiles = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'skills-validate-'));
  const skillDir = path.join(root, 'skills/demo-skill');
  await mkdir(skillDir, { recursive: true });
  await writeFile(path.join(skillDir, 'SKILL.md'), skillBody, 'utf8');
  for (const [relative, content] of Object.entries(extraFiles)) {
    const file = path.join(skillDir, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content, 'utf8');
  }
  return root;
}

async function withRepo(skillBody, extraFiles, testFn) {
  const root = await createRepo(skillBody, extraFiles);
  try {
    return await testFn(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function runValidate(root) {
  return spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: 'utf8'
  });
}

function validSkill(lines = []) {
  return `---
name: demo-skill
description: 用于测试 validate 规则的示例 skill，当用户需要验证规则时使用。
---

# Demo Skill

## 意图

用于测试。

${lines.join('\n')}
`;
}

async function testValidSkillPasses() {
  await withRepo(validSkill([
    '读取 `references/guide.md`。'
  ]), {
    'references/guide.md': '# Guide\n'
  }, (root) => {
    const result = runValidate(root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
}

async function testMissingReferenceFails() {
  await withRepo(validSkill([
    '读取 `references/missing.md`。'
  ]), {}, (root) => {
    const result = runValidate(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /引用不存在/);
  });
}

async function testOversizedSkillFails() {
  const longLines = Array.from({ length: 260 }, (_, index) => `- line ${index}`);
  await withRepo(validSkill(longLines), {}, (root) => {
    const result = runValidate(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SKILL\.md 过长/);
  });
}

async function testSensitivePatternFails() {
  await withRepo(validSkill([
    '示例：token = "abcdefghijklmnopqrstuvwxyz123456"'
  ]), {}, (root) => {
    const result = runValidate(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /疑似包含敏感信息/);
  });
}

const tests = [
  testValidSkillPasses,
  testMissingReferenceFails,
  testOversizedSkillFails,
  testSensitivePatternFails
];

for (const test of tests) {
  await test();
  console.log(`✓ ${test.name}`);
}

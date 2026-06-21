import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import test from 'node:test';

import { getUserErrorMessage } from '../dist/legacy/utils/userErrorMessage.js';

function captureConsoleError(run) {
  const original = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);
  try {
    return { result: run(), calls };
  } finally {
    console.error = original;
  }
}

test('uses the Chinese fallback for an Electron IPC system error', () => {
  const error = new Error(
    "Error invoking remote method 'device:create': SqliteError: UNIQUE constraint failed: devices.code",
  );

  const { result, calls } = captureConsoleError(() =>
    getUserErrorMessage(error, '新增设备失败'),
  );

  assert.equal(result, '新增设备失败');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], error);
});

test('preserves an approved Chinese business message inside an IPC wrapper', () => {
  const error = new Error(
    "Error invoking remote method 'device:delete': Error: 设备已借出，无法删除",
  );

  const { result } = captureConsoleError(() =>
    getUserErrorMessage(error, '删除失败'),
  );

  assert.equal(result, '设备已借出，无法删除');
});

test('uses the fallback for unknown error values', () => {
  const { result } = captureConsoleError(() =>
    getUserErrorMessage({ reason: 'database is locked' }, '加载数据失败'),
  );

  assert.equal(result, '加载数据失败');
});

function sourceFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

test('message components never render raw Error.message values', () => {
  const roots = [
    new URL('../src/legacy/pages', import.meta.url).pathname,
    new URL('../../electron-app/src/renderer/pages', import.meta.url).pathname,
  ];
  const unsafePattern =
    /message\.error\([^\n]*(?:error|err)(?:\?\.|\.)message/;
  const unsafeFiles = roots
    .flatMap(sourceFiles)
    .filter((path) => unsafePattern.test(readFileSync(path, 'utf8')));

  assert.deepEqual(unsafeFiles, []);
});

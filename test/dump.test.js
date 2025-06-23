const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function runDump(target) {
  const result = spawnSync('node', [path.resolve(__dirname, '..', 'dump.js'), target], {
    encoding: 'utf8'
  });
  if (result.error) {
    throw result.error;
  }
  return result.stdout;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dump-test-'));
fs.writeFileSync(
  path.join(tempDir, '.gitignore'),
  '*.skip\nlogs/**/*.log\n'
);
const textFile = path.join(tempDir, 'hello.txt');
fs.writeFileSync(textFile, 'Hello\n');
const skipFile = path.join(tempDir, 'omit.skip');
fs.writeFileSync(skipFile, 'no');
const binaryFile = path.join(tempDir, 'binary.bin');
fs.writeFileSync(binaryFile, Buffer.from([0, 1, 2, 3]));

const logsDir = path.join(tempDir, 'logs/deep');
fs.mkdirSync(logsDir, { recursive: true });
const ignoredLog = path.join(logsDir, 'ignored.log');
fs.writeFileSync(ignoredLog, 'ignore log');
const keepLog = path.join(logsDir, 'keep.txt');
fs.writeFileSync(keepLog, 'Keep');

const subDir = path.join(tempDir, 'sub');
fs.mkdirSync(subDir);
fs.writeFileSync(path.join(subDir, '.gitignore'), 'skip.txt\n');
fs.writeFileSync(path.join(subDir, 'skip.txt'), 'ignore me');
const includedFile = path.join(subDir, 'keep.txt');
fs.writeFileSync(includedFile, 'keep');

const output = runDump(tempDir).split(/\r?\n/).filter(Boolean);

assert(output.includes(textFile), 'should print text file path');
assert(output.includes('Hello'), 'should print text file content');
assert(!output.includes(skipFile), 'should ignore files matching *.skip');
const binIndex = output.indexOf(binaryFile);
assert(binIndex !== -1, 'should list binary file path');
assert(output[binIndex + 1] !== '0', 'should not print binary file content');
assert(!output.some(line => line.includes('ignore me')), 'should respect nested .gitignore');
assert(!output.includes(ignoredLog), 'should ignore complex pattern');
assert(output.includes(keepLog), 'should include non-ignored deep file');
assert(output.includes(includedFile), 'should include non-ignored file');

console.log('All tests passed.');


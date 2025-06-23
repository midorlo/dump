#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const { isText } = require('istextorbinary');

function usage() {
  console.log(`Usage: dump [options] <file|directory> [more...]

Zeigt den Inhalt von Textdateien rekursiv an (unterstützt .gitignore).

Optionen:
  -h, --help        Diese Hilfe anzeigen
  -n, --names-only  Nur Dateipfade anzeigen, keine Inhalte

Beispiele:
  dump README.md
  dump src/
  dump -n config/notes.txt .env
`);
  process.exit(0);
}

const args = process.argv.slice(2);

// Flags
let showNamesOnly = false;
const files = [];

for (const arg of args) {
  if (arg === '-h' || arg === '--help') {
    usage();
  } else if (arg === '-n' || arg === '--names-only') {
    showNamesOnly = true;
  } else {
    files.push(arg);
  }
}

if (files.length === 0) {
  usage();
}

function dumpFile(file) {
  console.log(file);
  if (showNamesOnly) return;

  try {
    const buffer = fs.readFileSync(file);
    if (isText(file, buffer)) {
      process.stdout.write(buffer);
      if (buffer.length === 0 || buffer[buffer.length - 1] !== 10) {
        process.stdout.write('\n');
      }
    }
  } catch (err) {
    console.error(`Failed to read ${file}: ${err.message}`);
  }
}

function dumpDir(dir, rootDir = dir, patterns = []) {
  const gitignorePath = path.join(dir, '.gitignore');
  let combined = [...patterns];
  if (fs.existsSync(gitignorePath)) {
    try {
      const lines = fs
        .readFileSync(gitignorePath, 'utf8')
        .split(/\r?\n/)
        .filter(Boolean);
      combined = combined.concat(lines);
    } catch (err) {
      console.error(`Failed to read ${gitignorePath}: ${err.message}`);
    }
  }
  const ig = ignore().add(combined);
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error(`Failed to read directory ${dir}: ${err.message}`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(rootDir, full);
    if (ig.ignores(rel)) continue;
    if (entry.isFile()) {
      dumpFile(full);
    } else if (entry.isDirectory()) {
      dumpDir(full, rootDir, combined);
    }
  }
}

for (const arg of files) {
  const target = path.resolve(arg);
  let stat;
  try {
    stat = fs.statSync(target);
  } catch (err) {
    console.error(`❌ ${arg}: ${err.message}`);
    continue;
  }

  if (stat.isFile()) {
    dumpFile(target);
  } else if (stat.isDirectory()) {
    dumpDir(target);
  } else {
    console.error(`⚠️ ${arg}: Not a file or directory`);
  }
}

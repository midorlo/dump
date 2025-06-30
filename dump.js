#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ignore = require('ignore');
const glob = require('glob');
const micromatch = require('micromatch');
const { isText } = require('istextorbinary');

function usage() {
  console.log(`Usage: dump [options] <file|directory|glob> [more...]

Recursively dumps the content of text files (respects .gitignore).

Options:
  -h, --help                   Show this help message
  -n, --names-only             Only show file paths, no content
  -c, --count-only             Only count how many files would be dumped
  -g, --gitignore <file>       Path to a .gitignore file to use
  -e, --exclude-pattern <list> Glob patterns (space-separated) to additionally ignore
  -i, --include-pattern <list> Glob patterns (space-separated) to exclusively include

Globbing Note:
  Use **/*.ext for recursive file search (e.g., dump -n "**/*.vue").

Examples:
  dump README.md
  dump src/
  dump -n config/notes.txt .env
  dump -c .
  dump -g ../../.gitignore packages/api
  dump frontend/**/*.vue -c -g ../../.gitignore
  dump -e "*.md *.java" .            # Ignores all .md & .java files
`);
  process.exit(0);
}

const args = process.argv.slice(2);

// Flags
let showNamesOnly = false;
let countOnly = false;
let overrideGitignore = null;
let additionalExcludes = [];
let additionalIncludes = [];
const inputArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '-h':
    case '--help':
      usage();
    case '-n':
    case '--names-only':
      showNamesOnly = true;
      break;
    case '-c':
    case '--count-only':
      countOnly = true;
      break;
    case '-g':
    case '--gitignore':
      overrideGitignore = args[++i];
      if (!overrideGitignore) {
        console.error('❌ --gitignore requires a path');
        process.exit(1);
      }
      break;
    case '-e':
    case '--exclude-pattern':
      const next = args[++i];
      if (!next) {
        console.error('❌ --exclude-pattern requires at least one pattern');
        process.exit(1);
      }
      additionalExcludes.push(...next.split(/\s+/));
      break;
    case '-i':
    case '--include-pattern':
      const nextInclude = args[++i];
      if (!nextInclude) {
        console.error('❌ --include-pattern requires at least one pattern');
        process.exit(1);
      }
      additionalIncludes.push(...nextInclude.split(/\s+/));
      break;
    default:
      inputArgs.push(arg);
  }
}

if (inputArgs.length === 0) {
  usage();
}

let fileCount = 0;
let globalIgnore = null;

// Wenn globale Gitignore gesetzt
if (overrideGitignore) {
  try {
    const lines = fs
      .readFileSync(overrideGitignore, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean);
    globalIgnore = ignore().add(['.git', ...lines, ...additionalExcludes]);
  } catch (err) {
    console.error(`❌ Error reading gitignore file (${overrideGitignore}): ${err.message}`);
    process.exit(1);
  }
}

function dumpFile(file) {
  fileCount++;
  if (countOnly) return;
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
  let combined = ['.git', ...patterns];
  let ig = globalIgnore;

  if (!globalIgnore) {
    const gitignorePath = path.join(dir, '.gitignore');
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
    ig = ignore().add([...combined, ...additionalExcludes]);
  }

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

    // Handle includes
    if (additionalIncludes.length > 0) {
      if (entry.isDirectory()) {
        // For directories, we need to check if any of the included patterns could match a file inside.
        // This is a simplification; a more robust solution might need to traverse the directory.
        if (!micromatch.isMatch(rel + '/', additionalIncludes)) {
          // continue;
        }
      } else if (entry.isFile()) {
        if (!micromatch.isMatch(rel, additionalIncludes)) {
          continue;
        }
      }
    }

    if (entry.isFile()) {
      dumpFile(full);
    } else if (entry.isDirectory()) {
      dumpDir(full, rootDir, combined);
    }
  }
}

// 🔁 Expand globs & process
const resolvedPaths = new Set();
for (const pattern of inputArgs) {
  const matches = glob.sync(pattern, { nodir: false, absolute: true });
  if (matches.length === 0) {
    console.warn(`⚠️ No match for: ${pattern}`);
  } else {
    for (const match of matches) {
      resolvedPaths.add(path.resolve(match));
    }
  }
}

for (const target of resolvedPaths) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch (err) {
    console.error(`❌ ${target}: ${err.message}`);
    continue;
  }

  if (stat.isFile()) {
    dumpFile(target);
  } else if (stat.isDirectory()) {
    dumpDir(target);
  } else {
    console.error(`⚠️ ${target}: Not a file or directory`);
  }
}

if (countOnly) {
  console.log(fileCount);
}

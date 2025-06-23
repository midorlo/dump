# Dump

This command line tool recursively prints text files to standard output.

```bash
node dump.js <file-or-directory>
```

The command accepts exactly one argument which may be a file or directory. If the
argument is a directory, the tool walks the directory tree recursively.
Whenever a `.gitignore` file is found in a directory, its patterns are applied
and combined with patterns from parent directories to exclude matching entries
from the dump. Complex patterns such as `logs/**/*.log` are supported.

For each file that is processed, the absolute path is printed first. Only text
files are dumped; binary files are listed by path only.

Errors while reading files or directories are written to standard error. The
command exits with code `1` if the argument does not exist or is not accessible.

Install dependencies and run tests with:

```bash
npm install
npm test
```

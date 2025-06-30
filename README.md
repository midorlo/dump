# Dump

A CLI utility to recursively dump the contents of text files, respecting `.gitignore` patterns.

It's like `cat` but for directories, with built-in support for filtering based on gitignore rules, and additional include/exclude patterns.

## Features

-   Recursively process directories.
-   Automatically respects `.gitignore` files.
-   Optionally use a global `.gitignore` file.
-   Filter files with additional include and exclude glob patterns.
-   List file names only or count them.
-   Handles text and binary files gracefully.
-   Cross-platform (Windows, macOS, Linux).

## Installation

Install dependencies:

```bash
npm install
```

### Global Command (Optional)

To use the `dump` command globally from any directory, you can link the script:

```bash
npm link
```

This will make the `dump` command available in your system's path.

## Usage

```
dump [options] <file|directory|glob> [more...]
```

### Options

-   `-h, --help`: Show the help message.
-   `-n, --names-only`: Only show file paths, no content.
-   `-c, --count-only`: Only count how many files would be dumped.
-   `-g, --gitignore <file>`: Path to a `.gitignore` file to use.
-   `-e, --exclude-pattern <list>`: Space-separated glob patterns to additionally ignore.
-   `-i, --include-pattern <list>`: Space-separated glob patterns to exclusively include.

### Examples

-   **Dump a single file:**
    ```bash
    dump README.md
    ```
-   **Dump a whole directory:**
    ```bash
    dump src/
    ```
-   **List file names only:**
    ```bash
    dump -n .env config/notes.txt
    ```
-   **Count all files in the current directory:**
    ```bash
    dump -c .
    ```
-   **Use a specific gitignore file:**
    ```bash
    dump -g ../../.gitignore packages/api
    ```
-   **Count all `.vue` files while respecting a gitignore:**
    ```bash
    dump frontend/**/*.vue -c -g ../../.gitignore
    ```
-   **Exclude all markdown and java files:**
    ```bash
    dump -e "*.md *.java" .
    ```
-   **Include only JavaScript files:**
    ```bash
    dump -i "**/*.js" .
    ```
-   **Pipe all JavaScript files into the clipboard (Windows PowerShell):**
    ```powershell
    dump -i "**/*.js" . | Set-Clipboard
    ```

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

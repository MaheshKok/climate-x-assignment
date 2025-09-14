/**
 * Prettier Configuration
 * Code formatting rules
 */

module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,

  // Print width (line length)
  printWidth: 100,

  // JSX specific
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Object/Array formatting
  bracketSpacing: true,
  arrowParens: 'avoid',

  // File types
  endOfLine: 'lf',

  // Override specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
  ],
};

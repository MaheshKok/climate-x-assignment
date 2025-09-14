/**
 * Lint-staged Configuration
 * Run code quality tools on staged files before commit
 */

module.exports = {
  // TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JSON files
  '**/*.json': ['prettier --write'],

  // Markdown files
  '**/*.{md,mdx}': ['prettier --write'],

  // CSS/SCSS files
  '**/*.{css,scss,less}': ['prettier --write'],

  // Package.json files (avoid dependency conflicts)
  'package.json': ['prettier --write'],
};

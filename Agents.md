# AI agent instructions

## General Guidelines

- Don't work on any of the tasks in the TODO.md file unless you are asked to.

- Always try to early return from functions.

- Use \`const\` for variables that are not reassigned.

- Make sure to focus on why and not how in documentation.

- Write predictable functions and make a spec file for them according to the testing library in use.

- Don't use \`any\` in TypeScript, use \`unknown\` instead.

- Don't cast types without validation.

- Whenever finish a task from the TODO.md file mark it as finished, if there is some that already marked as finish delete them

- Work in a domain driven design (DDD) way, i.e. every function its is own module, and its its folder there is the code with JSDocs, spec file and types in there files.

- Put unit tests in the same folder as the code they test, and name them with \`.spec.ts\` suffix.

- After finishing the task make sure to run format, lint, test and build commands.

- Don't use file extensions in imports, use absolute imports instead.

- Don't test mocks

- Don't push a binary file like \`.png\` in a pull request.

- Always use a package to manage and validate environment variables.

- If you change or create a test in you work, always run the test and make sure it passes.

Package Manager: pnpm

Monorepo system: turbo

## Programming language (typescript)

- Use Interfaces over Types unless needed.

- Don't use plain TypeScript enums

- Use \`const\` over \`let\` unless reassignment is needed.

- Use \`===\` over \`==\` for strict equality checks.

- Use arrow functions for anonymous functions.

- Use template literals for string interpolation.

## Lint system (eslint)

- Use ESLint to enforce code quality and style guidelines.

- Fix lint issues before committing code.

## Testing framework (playwright)

## Project type (e2e)

- Structure tests using the Page Object Model (POM) for maintainability.

- Use screenshot testing when possible to detect visual regressions.

Network mocking: route-interception

## Framework (playwright)

- Prefer using fixtures to share setup across Playwright tests.

// @ts-check
import config from 'eslint-config-agent';

export default [
  ...config,
  {
    // Relax rules for E2E test files - these rules are too strict for test code
    files: ['**/*'],
    rules: {
      'no-optional-chaining/no-optional-chaining': 'off',
      'default/no-default-params': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'default/no-localhost': 'off',
      'default/no-hardcoded-urls': 'off',
      'error/no-generic-error': 'off',
      'error/require-custom-error': 'off',
      'error/no-throw-literal': 'off',
      'single-export/single-export': 'off',
      'ddd/require-spec-file': 'off',
      'security/detect-object-injection': 'off',
      'max-lines': 'off',
      'no-restricted-syntax': 'off',
    },
  },
];

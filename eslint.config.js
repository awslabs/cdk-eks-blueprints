const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        TextDecoder: 'readonly',
        // Browser globals
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        XMLHttpRequest: 'readonly',
        WebAssembly: 'readonly',
        fetch: 'readonly',
        atob: 'readonly',
        self: 'readonly',
        define: 'readonly',
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        jest: 'readonly',
        fail: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'prefer-const': 'off',
      'semi': ['warn', 'always'],
      'no-prototype-builtins': 'off',
      'no-misleading-character-class': 'off',
      'no-useless-escape': 'off',
      'no-empty': 'off',
      'no-redeclare': 'off',
      'no-fallthrough': 'off',
      'no-unsafe-finally': 'off',
      'no-cond-assign': 'off',
      'no-func-assign': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'cdk.out/**',
      '**/*.js',
      'examples/**/cdk.out/**',
    ],
  },
];
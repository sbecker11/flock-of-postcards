import { ESLint } from 'eslint';

export default new ESLint({
    baseConfig: {
        env: {
            browser: true,
            es2021: true,
            node: true,
        },
        extends: [
            'eslint:recommended',
            'plugin:react/recommended',
            'plugin:@typescript-eslint/recommended',
        ],
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            // Add your custom rules here
        },
    },
});
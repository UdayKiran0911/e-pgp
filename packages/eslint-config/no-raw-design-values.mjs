/**
 * Shared ESLint flat-config fragment enforcing UI-standards.md:
 * no raw hex/rgb colors or arbitrary px sizes outside the design-tokens
 * package. Import and spread this into an app's eslint.config.mjs.
 *
 * Usage:
 *   import { noRawDesignValues } from '@epg/eslint-config';
 *   export default [...nextConfig, noRawDesignValues];
 */
export const noRawDesignValues = {
  files: ['**/*.{ts,tsx,js,jsx}'],
  ignores: ['**/design-tokens/**', '**/*.config.{js,ts,mjs}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "Literal[value=/^#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/]",
        message:
          'Raw hex colors are not allowed. Import a token from @epg/design-tokens instead (see UI-standards.md).',
      },
      {
        selector:
          "Literal[value=/^(rgb|rgba|hsl|hsla)\\(/]",
        message:
          'Raw rgb()/rgba()/hsl() colors are not allowed. Import a token from @epg/design-tokens instead (see UI-standards.md).',
      },
      {
        selector:
          "Property[key.name=/^(color|background|backgroundColor|borderColor|borderRadius|fontSize|padding|margin|gap|width|height)$/] > Literal[value=/^\\d+(\\.\\d+)?px$/]",
        message:
          'Raw px values are not allowed in style props. Use a token from @epg/design-tokens instead (see UI-standards.md).',
      },
    ],
  },
};

export default noRawDesignValues;

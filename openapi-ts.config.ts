import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './revisium/openapi.json',
  output: {
    path: './src/__generated__/demo-rpg-data',
    format: 'prettier',
    lint: false,
  },
  plugins: ['@hey-api/client-fetch', '@hey-api/typescript', '@hey-api/sdk'],
});

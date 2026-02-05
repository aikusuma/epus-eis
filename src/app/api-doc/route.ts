import { ApiReference } from '@scalar/nextjs-api-reference';

export const GET = ApiReference({
  url: '/openapi.yaml',
  cdn: '/scalar/api-reference.js',
  theme: 'saturn'
});

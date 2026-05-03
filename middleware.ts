// Next.js 15 requires the middleware entry point to be named middleware.ts.
// All logic lives in proxy.ts — this file re-exports it so the rename to
// proxy.ts (intended for Next.js 16) doesn't break the current runtime.
export { middleware as default, config } from './proxy';

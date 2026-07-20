// The generated Prisma client (Prisma 7's `prisma-client` generator) uses
// NodeNext-style relative imports with explicit `.js` extensions pointing
// at sibling `.ts` source files (no compiled `.js` output exists outside a
// full build). Jest resolves this via `moduleNameMapper` stripping `.js`
// from relative specifiers; standalone `ts-node` scripts need the same
// trick since there's no jest config to apply it. Preloaded via `-r`
// before the entry script imports anything from `generated/prisma`.
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function patchedResolveFilename(request, ...rest) {
  if (/^\.{1,2}\//.test(request) && request.endsWith('.js')) {
    try {
      return originalResolveFilename.call(this, request.replace(/\.js$/, ''), ...rest);
    } catch {
      // Fall through — a real .js file might exist for this specifier.
    }
  }
  return originalResolveFilename.call(this, request, ...rest);
};

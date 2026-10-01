import { defineConfig } from 'vite';

// base './' keeps every URL relative, so the build works at
// https://cmtania.github.io/bill-tracker-docs/ (or any other path)
// without hard-coding the repo name.
export default defineConfig({
  base: './',
});

import { build } from 'esbuild';

await build({
  entryPoints: ['main.js'],
  outfile: 'app.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: false,
  logLevel: 'info',
});

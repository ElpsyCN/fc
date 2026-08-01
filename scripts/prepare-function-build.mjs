import { chmod, copyFile, mkdir, rm } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

import { build } from 'esbuild'

const generatedRoot = resolve('.cloudbase', 'functions')
const output = resolve(generatedRoot, 'fc-api')
const source = resolve('cloudfunctions', 'fc-api')

if (!output.startsWith(`${generatedRoot}${sep}`))
  throw new Error('Refusing to clean a path outside the generated function directory')

await rm(output, { force: true, recursive: true })
await mkdir(output, { recursive: true })

await build({
  bundle: true,
  entryPoints: [resolve(source, 'index.js')],
  format: 'cjs',
  legalComments: 'eof',
  minify: true,
  outfile: resolve(output, 'index.cjs'),
  platform: 'node',
  sourcemap: false,
  target: 'node20',
})

const bootstrap = resolve(output, 'scf_bootstrap')
await copyFile(resolve(source, 'scf_bootstrap'), bootstrap)
await chmod(bootstrap, 0o755)

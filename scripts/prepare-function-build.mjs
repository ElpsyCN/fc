import { rm } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

const generatedRoot = resolve('.cloudbase', 'functions')
const output = resolve(generatedRoot, 'fc-api')

if (!output.startsWith(`${generatedRoot}${sep}`))
  throw new Error('Refusing to clean a path outside the generated function directory')

await rm(output, { force: true, recursive: true })

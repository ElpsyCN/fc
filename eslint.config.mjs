import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  // 生成物 / 资源文件不参与 lint
  ignores: [
    'dist',
    'src/components.d.ts',
    'public',
  ],
})

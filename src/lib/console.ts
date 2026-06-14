import pkg from '../../package.json'

/**
 * 控制台输出信息
 * @param name 名称
 * @param link 链接
 * @param color 颜色
 * @param emoji 图标
 */
function consoleInfo(
  name: string,
  link: string,
  color?: string,
  emoji?: string,
) {
  if (!color) {
    color = '#0078E7'
  }
  // 控制台彩色 banner 是该函数的预期用途
  // eslint-disable-next-line no-console
  console.log(
    `%c ${emoji || '☁️'} ${name} %c ${link}`,
    `color: white; background: ${color}; padding:5px 0;`,
    `padding:4px;border:1px solid ${color};`,
  )
}

export function consoleAllInfo() {
  consoleInfo('fc', pkg.repository.url, '#DA4A4A', '🎮')
  consoleInfo(`@${pkg.author.name}`, pkg.repository.url)
}

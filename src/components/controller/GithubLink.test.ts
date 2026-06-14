import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import pkg from '../../../package.json'
import GithubLink from './GithubLink.vue'

describe('githubLink', () => {
  it('渲染唯一一个指向仓库的安全外链', () => {
    const wrapper = mount(GithubLink)
    const links = wrapper.findAll('a')

    expect(links).toHaveLength(1)
    const link = links[0]
    expect(link.attributes('href')).toBe(pkg.repository.url)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.attributes('aria-label')).toBeTruthy()
  })
})

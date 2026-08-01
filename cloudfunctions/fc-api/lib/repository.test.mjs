// @vitest-environment node

import { describe, expect, it } from 'vitest'
import repositoryModule from './repository.js'

const {
  SaveLimitError,
  createFcRepository,
} = repositoryModule

function fakeDatabase(seed = {}) {
  const collections = new Map(Object.entries(seed).map(([name, docs]) => [
    name,
    new Map(Object.entries(docs)),
  ]))

  function bucket(name) {
    if (!collections.has(name))
      collections.set(name, new Map())
    return collections.get(name)
  }

  function collection(name) {
    return {
      doc(id) {
        return {
          async get() {
            const value = bucket(name).get(id)
            return { data: value ? [{ _id: id, ...value }] : [] }
          },
          async remove() {
            bucket(name).delete(id)
          },
          async set(value) {
            if ('_id' in value)
              throw new Error('doc(id).set payload must not include _id')
            bucket(name).set(id, { ...value })
          },
        }
      },
      where(condition) {
        let limit = Number.POSITIVE_INFINITY
        let order
        return {
          async get() {
            const rows = [...bucket(name)]
              .map(([id, value]) => ({ _id: id, ...value }))
              .filter(row => Object.entries(condition).every(([key, value]) => row[key] === value))
            if (order)
              rows.sort((a, b) => order.direction === 'desc' ? b[order.field] - a[order.field] : a[order.field] - b[order.field])
            return { data: rows.slice(0, limit) }
          },
          limit(value) {
            limit = value
            return this
          },
          orderBy(field, direction) {
            order = { direction, field }
            return this
          },
        }
      },
    }
  }

  return {
    collection,
    collections,
    async runTransaction(operation) {
      return operation({ collection })
    },
  }
}

describe('fc save repository', () => {
  it('reads the canonical membership document by uid', async () => {
    const database = fakeDatabase({
      user_memberships: {
        'user-1': { expireAt: 2_000, userId: 'user-1' },
      },
    })
    const repository = createFcRepository(database, 2)

    await expect(repository.isMember('user-1', 1_000)).resolves.toBe(true)
    await expect(repository.isMember('user-1', 3_000)).resolves.toBe(false)
  })

  it('projects only safe public profile fields', async () => {
    const database = fakeDatabase({
      user_profiles: {
        'user-1': {
          avatar: 'https://example.com/avatar.png',
          nickname: 'Tester',
          phone: '13800000000',
        },
      },
    })
    const repository = createFcRepository(database, 2)

    await expect(repository.getUserProfile('user-1')).resolves.toEqual({
      avatar: 'https://example.com/avatar.png',
      name: 'Tester',
      uid: 'user-1',
    })
  })

  it('enforces the save quota transactionally and lists metadata only', async () => {
    const database = fakeDatabase()
    const repository = createFcRepository(database, 2)
    await repository.createSave('user-1', { name: 'First', rom: 'first.nes', state: '{"one":1}' }, 1)
    await repository.createSave('user-1', { name: 'Second', rom: 'second.nes', state: '{"two":2}' }, 2)

    await expect(repository.createSave('user-1', {
      name: 'Third',
      rom: 'third.nes',
      state: '{"three":3}',
    }, 3)).rejects.toBeInstanceOf(SaveLimitError)

    const saves = await repository.listSaves('user-1')
    expect(saves).toHaveLength(2)
    expect(saves[0]).toMatchObject({ name: 'Second', updatedAt: 2 })
    expect(saves[0]).not.toHaveProperty('state')
  })

  it('never returns or removes another users save', async () => {
    const database = fakeDatabase({
      fc_save_quotas: { 'user-2': { count: 1, userId: 'user-2' } },
      fc_saves: { 'save-1': { name: 'Private', rom: 'game.nes', state: '{}', userId: 'user-2' } },
    })
    const repository = createFcRepository(database, 20)

    await expect(repository.getSave('user-1', 'save-1')).resolves.toBeNull()
    await expect(repository.removeSave('user-1', 'save-1')).resolves.toBe(false)
    expect(database.collections.get('fc_saves').has('save-1')).toBe(true)
  })
})

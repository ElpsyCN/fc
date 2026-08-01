'use strict'

const MEMBERSHIP_COLLECTION = 'user_memberships'
const SAVE_COLLECTION = 'fc_saves'
const SAVE_QUOTA_COLLECTION = 'fc_save_quotas'
const USER_PROFILE_COLLECTION = 'user_profiles'

class SaveLimitError extends Error {
  constructor() {
    super('Cloud save limit reached')
    this.name = 'SaveLimitError'
  }
}

function firstDoc(data) {
  if (Array.isArray(data))
    return data[0] || null
  return data || null
}

function saveMetadata(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    rom: doc.rom,
    updatedAt: doc.updatedAt,
  }
}

function createFcRepository(database, maximumSaves) {
  async function readMembership(userId) {
    const collection = database.collection(MEMBERSHIP_COLLECTION)
    const canonical = firstDoc((await collection.doc(userId).get())?.data)
    if (canonical && (!canonical.userId || canonical.userId === userId))
      return canonical

    const { data } = await collection.where({ userId }).limit(10).get()
    return Array.isArray(data)
      ? data.find(item => item?._id === userId) || data[0] || null
      : null
  }

  async function isMember(userId, now = Date.now()) {
    const membership = await readMembership(userId)
    return Number(membership?.expireAt) > now
  }

  async function getUserProfile(userId) {
    const profile = firstDoc((await database.collection(USER_PROFILE_COLLECTION).doc(userId).get())?.data)
    if (!profile)
      return { name: '云乐坊用户', uid: userId }
    const name = typeof profile.nickname === 'string' && profile.nickname.trim()
      ? profile.nickname.trim()
      : typeof profile.login === 'string' && profile.login.trim()
        ? profile.login.trim()
        : '云乐坊用户'
    return {
      uid: userId,
      name: name.slice(0, 128),
      ...(typeof profile.avatar === 'string' && profile.avatar ? { avatar: profile.avatar.slice(0, 2048) } : {}),
    }
  }

  async function listSaves(userId) {
    const { data } = await database.collection(SAVE_COLLECTION)
      .where({ userId })
      .orderBy('updatedAt', 'desc')
      .limit(maximumSaves)
      .get()
    return Array.isArray(data) ? data.map(saveMetadata) : []
  }

  async function getSave(userId, saveId) {
    const doc = firstDoc((await database.collection(SAVE_COLLECTION).doc(saveId).get())?.data)
    return doc?.userId === userId ? doc : null
  }

  async function createSave(userId, input, now = Date.now()) {
    const saveId = crypto.randomUUID()
    const save = {
      _id: saveId,
      name: input.name,
      rom: input.rom,
      state: input.state,
      updatedAt: now,
      userId,
    }

    await database.runTransaction(async (transaction) => {
      const quotaRef = transaction.collection(SAVE_QUOTA_COLLECTION).doc(userId)
      const quota = firstDoc((await quotaRef.get())?.data)
      const count = Number.isSafeInteger(quota?.count) ? quota.count : 0
      if (count >= maximumSaves)
        throw new SaveLimitError()

      const { _id, ...saveDocument } = save
      await transaction.collection(SAVE_COLLECTION).doc(_id).set(saveDocument)
      await quotaRef.set({ count: count + 1, updatedAt: now, userId })
    })

    return saveMetadata(save)
  }

  async function removeSave(userId, saveId, now = Date.now()) {
    return database.runTransaction(async (transaction) => {
      const saveRef = transaction.collection(SAVE_COLLECTION).doc(saveId)
      const save = firstDoc((await saveRef.get())?.data)
      if (!save || save.userId !== userId)
        return false

      const quotaRef = transaction.collection(SAVE_QUOTA_COLLECTION).doc(userId)
      const quota = firstDoc((await quotaRef.get())?.data)
      const count = Number.isSafeInteger(quota?.count) ? quota.count : 1
      await saveRef.remove()
      await quotaRef.set({ count: Math.max(0, count - 1), updatedAt: now, userId })
      return true
    })
  }

  return {
    createSave,
    getSave,
    getUserProfile,
    isMember,
    listSaves,
    removeSave,
  }
}

module.exports = {
  MEMBERSHIP_COLLECTION,
  SAVE_COLLECTION,
  SAVE_QUOTA_COLLECTION,
  USER_PROFILE_COLLECTION,
  SaveLimitError,
  createFcRepository,
}

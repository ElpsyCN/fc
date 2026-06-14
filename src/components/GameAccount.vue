<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { useYlfAuth } from '../composables/useYlfAuth'

const { user, isLoggedIn, loading, login, logout } = useYlfAuth()
const { showToast } = useToast()

async function onLogin() {
  const res = await login()
  if (res.ok)
    showToast(`已登录：${user.value?.name ?? '云乐坊'}`)
  else if (res.reason && res.reason !== 'closed' && res.reason !== 'not_authenticated')
    showToast('登录失败，请重试')
}

async function onLogout() {
  await logout()
  showToast('已退出登录')
}
</script>

<template>
  <button
    v-if="!isLoggedIn"
    class="account-btn"
    type="button"
    :disabled="loading"
    aria-label="登录云乐坊账号"
    @click="onLogin"
  >
    <i-mdi-account-circle-outline />
  </button>
  <button
    v-else
    class="account-btn account-btn--user"
    type="button"
    :aria-label="`已登录 ${user?.name}，点击退出`"
    @click="onLogout"
  >
    <img v-if="user?.avatar" :src="user.avatar" :alt="user.name" class="account-avatar">
    <i-mdi-account-circle v-else />
  </button>
</template>

<style lang="scss">
.account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 5px;
  color: var(--panel);
  background: var(--btn);
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: var(--case-red);
    color: #fff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.account-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}
</style>

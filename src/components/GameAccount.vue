<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { useYlfAuth } from '../composables/useYlfAuth'

const { user, isLoggedIn, loading, login, logout } = useYlfAuth()
const { showToast } = useToast()

// SSO 失败原因 → 可操作的中文提示，便于排查；'closed'/'not_authenticated' 属正常未登录，不打扰
const SSO_FAIL_HINT: Record<string, string> = {
  invalid_request: '本站点未加入云乐坊 SSO 白名单',
  popup_blocked: '登录弹窗被拦截，请允许弹窗后重试',
  timeout: '登录超时，请重试',
}

async function onLogin() {
  const res = await login()
  if (res.ok) {
    showToast(`已登录：${user.value?.name ?? '云乐坊'}`)
    return
  }
  if (!res.reason || res.reason === 'closed' || res.reason === 'not_authenticated')
    return
  showToast(SSO_FAIL_HINT[res.reason] ?? '登录失败，请重试')
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

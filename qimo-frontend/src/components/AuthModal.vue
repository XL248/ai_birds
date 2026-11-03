<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Bird, LoaderCircle, X } from 'lucide-vue-next'
import { useSessionStore } from '../stores/session.js'

const session = useSessionStore()
const username = ref('')
const password = ref('')
const confirmation = ref('')
const error = ref('')
const message = ref('')
const isRegister = computed(() => session.authMode === 'register')

watch(() => session.authOpen, (open) => {
  if (open) {
    error.value = ''
    message.value = ''
  }
})

function onKeydown(event) {
  if (event.key === 'Escape') session.authOpen = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

async function submit() {
  error.value = ''
  message.value = ''
  if (isRegister.value && password.value !== confirmation.value) {
    error.value = '两次输入的密码不一致。'
    return
  }
  try {
    if (isRegister.value) {
      const result = await session.register(username.value.trim(), password.value)
      message.value = result.message || '注册成功，请登录。'
      session.authMode = 'login'
      password.value = ''
      confirmation.value = ''
    } else {
      await session.login(username.value.trim(), password.value)
      password.value = ''
    }
  } catch (submitError) {
    error.value = submitError.message || '操作失败，请稍后再试。'
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="session.authOpen" class="modal-backdrop" @click.self="session.authOpen = false">
      <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="modal-close icon-button" type="button" aria-label="关闭" @click="session.authOpen = false"><X :size="19" /></button>
        <div class="auth-icon"><Bird :size="23" /></div>
        <p class="eyebrow">WINGWATCH ACCOUNT</p>
        <h2 id="auth-title">{{ isRegister ? '加入观鸟同行者' : '欢迎回来' }}</h2>
        <p class="auth-lead">{{ isRegister ? '创建账号，保存你的观鸟记录。' : '登录后继续记录你的自然观察。' }}</p>

        <form class="stack-form" @submit.prevent="submit">
          <label>用户名
            <input v-model="username" name="username" autocomplete="username" minlength="2" maxlength="32" required placeholder="2–32 个字符" />
          </label>
          <label>密码
            <input v-model="password" name="password" type="password" :autocomplete="isRegister ? 'new-password' : 'current-password'" minlength="6" required placeholder="至少 6 个字符" />
          </label>
          <label v-if="isRegister">确认密码
            <input v-model="confirmation" type="password" autocomplete="new-password" minlength="6" required placeholder="再输入一次密码" />
          </label>
          <p v-if="error" class="form-message is-error" role="alert">{{ error }}</p>
          <p v-if="message" class="form-message is-success" role="status">{{ message }}</p>
          <button class="button button-primary submit-button" type="submit" :disabled="session.busy">
            <LoaderCircle v-if="session.busy" class="spin" :size="17" />
            {{ session.busy ? '请稍候' : isRegister ? '创建账号' : '登录' }}
          </button>
        </form>
        <button class="auth-switch" type="button" @click="session.authMode = isRegister ? 'login' : 'register'; error = ''; message = ''">
          {{ isRegister ? '已有账号？返回登录' : '还没有账号？立即注册' }}
        </button>
      </section>
    </div>
  </Teleport>
</template>

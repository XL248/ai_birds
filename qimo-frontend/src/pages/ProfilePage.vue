<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Award, Bird, CalendarDays, Heart, LoaderCircle, LockKeyhole, NotebookPen, RefreshCw, Save, UserRound } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import { api } from '../api.js'
import { useSessionStore } from '../stores/session.js'

const session = useSessionStore()
const loading = ref(true)
const saving = ref(false)
const changingPassword = ref(false)
const error = ref('')
const success = ref('')
const activeTab = ref('checkins')
const profile = ref({ username: '', nickname: '', bio: '', createdAt: '' })
const checkins = ref([])
const favorites = ref([])
const achievements = ref([])
const passwordForm = ref({ oldPassword: '', newPassword: '', confirm: '' })
const activeRecords = computed(() => activeTab.value === 'checkins' ? checkins.value : activeTab.value === 'favorites' ? favorites.value : achievements.value)

function value(item, camel, snake) {
  return item?.[camel] ?? item?.[snake] ?? ''
}

async function loadProfile() {
  if (!session.user) {
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const [profileResult, checkinResult, favoriteResult, achievementResult] = await Promise.all([
      api.get('/api/user/profile'),
      api.get('/api/social/checkins'),
      api.get('/api/social/favorites'),
      api.get('/api/social/achievements')
    ])
    const data = profileResult.profile || {}
    profile.value = {
      username: value(data, 'username', 'username'),
      nickname: value(data, 'nickname', 'nickname') || '',
      bio: value(data, 'bio', 'bio') || '',
      createdAt: value(data, 'createdAt', 'created_at')
    }
    checkins.value = checkinResult.birds || []
    favorites.value = favoriteResult.birds || []
    achievements.value = achievementResult.badges || []
  } catch (loadError) {
    error.value = loadError.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!session.ready) await session.refresh()
  await loadProfile()
})

async function saveProfile() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const result = await api.put('/api/user/profile', { nickname: profile.value.nickname, bio: profile.value.bio })
    success.value = result.message || '资料已保存。'
  } catch (saveError) {
    error.value = saveError.message
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  error.value = ''
  success.value = ''
  if (passwordForm.value.newPassword !== passwordForm.value.confirm) {
    error.value = '两次输入的新密码不一致。'
    return
  }
  changingPassword.value = true
  try {
    const result = await api.put('/api/user/password', { oldPassword: passwordForm.value.oldPassword, newPassword: passwordForm.value.newPassword })
    success.value = result.message || '密码已更新。'
    passwordForm.value = { oldPassword: '', newPassword: '', confirm: '' }
  } catch (passwordError) {
    error.value = passwordError.message
  } finally {
    changingPassword.value = false
  }
}
</script>

<template>
  <section class="page-banner profile-banner"><div class="page-width banner-content"><p class="eyebrow">YOUR FIELD PROFILE</p><h1>我的观鸟档案</h1><p>查看个人资料、观察记录与已收藏的鸟类。</p></div></section>
  <section class="page-width content-section profile-page">
    <div v-if="!session.ready || loading" class="loading-state"><LoaderCircle class="spin" :size="21" /> 正在载入档案…</div>
    <div v-else-if="!session.user" class="sign-in-panel"><span class="profile-icon"><UserRound :size="23" /></span><p class="eyebrow">PERSONAL FIELD NOTES</p><h2>登录后查看你的观鸟档案</h2><p>你的打卡、收藏和成就会汇总在这里。</p><button class="button button-primary" type="button" @click="session.openAuth('login')">登录账号</button></div>
    <template v-else>
      <p v-if="error" class="form-message is-error" role="alert">{{ error }}</p>
      <p v-if="success" class="inline-notice" role="status">{{ success }}</p>
      <div class="profile-overview">
        <section class="profile-identity">
          <span class="profile-avatar">{{ (profile.nickname || profile.username).slice(0, 1).toUpperCase() }}</span>
          <p class="eyebrow">OBSERVER</p>
          <h2>{{ profile.nickname || profile.username }}</h2>
          <span class="profile-handle">@{{ profile.username }}</span>
          <p class="profile-bio">{{ profile.bio || '还没有填写个人简介。' }}</p>
          <div v-if="profile.createdAt" class="profile-since"><CalendarDays :size="15" /> 加入于 {{ new Date(profile.createdAt).toLocaleDateString('zh-CN') }}</div>
        </section>
        <section class="profile-stats" aria-label="观察统计">
          <div><span><Bird :size="17" /> 已打卡</span><strong>{{ checkins.length }}</strong><small>种鸟类</small></div>
          <div><span><Heart :size="17" /> 已收藏</span><strong>{{ favorites.length }}</strong><small>个物种</small></div>
          <div><span><Award :size="17" /> 已获得</span><strong>{{ achievements.length }}</strong><small>枚徽章</small></div>
        </section>
      </div>

      <div class="profile-columns">
        <section class="profile-records">
          <div class="profile-tabs" role="tablist" aria-label="档案记录">
            <button type="button" role="tab" :aria-selected="activeTab === 'checkins'" :class="{ selected: activeTab === 'checkins' }" @click="activeTab = 'checkins'"><Bird :size="16" /> 打卡</button>
            <button type="button" role="tab" :aria-selected="activeTab === 'favorites'" :class="{ selected: activeTab === 'favorites' }" @click="activeTab = 'favorites'"><Heart :size="16" /> 收藏</button>
            <button type="button" role="tab" :aria-selected="activeTab === 'achievements'" :class="{ selected: activeTab === 'achievements' }" @click="activeTab = 'achievements'"><Award :size="16" /> 成就</button>
          </div>
          <div class="profile-record-list">
            <EmptyState v-if="!activeRecords.length" :title="activeTab === 'checkins' ? '还没有打卡记录' : activeTab === 'favorites' ? '还没有收藏物种' : '还没有获得徽章'" detail="浏览鸟类图鉴，开始积累你的观察档案。" />
            <div v-for="item in activeRecords" :key="item.id || item.name || item.bird_name" class="profile-record">
              <span class="record-mark"><Bird v-if="activeTab !== 'achievements'" :size="17" /><Award v-else :size="17" /></span>
              <div><strong>{{ activeTab === 'achievements' ? item.name : value(item, 'birdName', 'bird_name') }}</strong><small v-if="activeTab === 'achievements'">{{ value(item, 'earnedAt', 'earned_at') ? new Date(value(item, 'earnedAt', 'earned_at')).toLocaleDateString('zh-CN') : '已达成' }}</small><small v-else>{{ value(item, 'createdAt', 'created_at') ? new Date(value(item, 'createdAt', 'created_at')).toLocaleDateString('zh-CN') : '观察记录' }}</small></div>
            </div>
          </div>
        </section>

        <aside class="profile-edit-column">
          <form class="settings-section" @submit.prevent="saveProfile">
            <div class="settings-title"><UserRound :size="18" /><div><h2>个人资料</h2><p>更新你的公开昵称与简介</p></div></div>
            <label>昵称<input v-model="profile.nickname" maxlength="32" placeholder="输入昵称" /></label>
            <label>简介<textarea v-model="profile.bio" maxlength="500" rows="3" placeholder="分享你关注的自然主题"></textarea></label>
            <button class="button button-primary" type="submit" :disabled="saving"><LoaderCircle v-if="saving" class="spin" :size="16" /><Save v-else :size="16" /> 保存资料</button>
          </form>
          <form class="settings-section password-section" @submit.prevent="changePassword">
            <div class="settings-title"><LockKeyhole :size="18" /><div><h2>修改密码</h2><p>定期更新密码以保护账号</p></div></div>
            <label>当前密码<input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" required /></label>
            <label>新密码<input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" minlength="6" required /></label>
            <label>确认新密码<input v-model="passwordForm.confirm" type="password" autocomplete="new-password" minlength="6" required /></label>
            <button class="button button-outline" type="submit" :disabled="changingPassword"><LoaderCircle v-if="changingPassword" class="spin" :size="16" /><RefreshCw v-else :size="16" /> 更新密码</button>
          </form>
        </aside>
      </div>
      <RouterLink class="profile-diary-link" to="/diary"><NotebookPen :size="17" /> 前往观鸟日记 <ArrowRight :size="16" /></RouterLink>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowRight, CalendarDays, LoaderCircle, MapPin, NotebookPen, Plus, Send } from 'lucide-vue-next'
import EmptyState from '../components/EmptyState.vue'
import { api } from '../api.js'
import { useSessionStore } from '../stores/session.js'

const session = useSessionStore()
const entries = ref([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(true)
const submitting = ref(false)
const showForm = ref(false)
const error = ref('')
const notice = ref('')
const form = ref({ title: '', birdName: '', location: '', content: '' })
const canGoBack = computed(() => page.value > 1)
const canGoNext = computed(() => page.value < totalPages.value)

function field(item, camel, snake) {
  return item[camel] ?? item[snake] ?? ''
}

async function loadEntries(targetPage = page.value) {
  loading.value = true
  error.value = ''
  try {
    const result = await api.get(`/api/social/diaries?page=${targetPage}`)
    entries.value = result.diaries || []
    page.value = result.page || targetPage
    totalPages.value = Math.max(1, result.totalPages || 1)
  } catch (loadError) {
    error.value = loadError.message
  } finally {
    loading.value = false
  }
}

onMounted(() => loadEntries(1))

async function submitDiary() {
  if (!session.user) {
    session.openAuth('login')
    return
  }
  submitting.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await api.post('/api/social/diary', form.value)
    notice.value = result.message || '日记已发布。'
    form.value = { title: '', birdName: '', location: '', content: '' }
    showForm.value = false
    await loadEntries(1)
  } catch (submitError) {
    error.value = submitError.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page-banner diary-banner">
    <div class="page-width banner-content"><p class="eyebrow">FIELD JOURNAL / 02</p><h1>观鸟日记</h1><p>记录时间、地点与细节，让短暂相遇成为长期观察。</p></div>
  </section>
  <section class="page-width content-section diary-layout">
    <div class="diary-main">
      <div class="section-heading-row diary-heading">
        <div><p class="eyebrow">COMMUNITY JOURNAL</p><h2>最近的观察</h2><p class="section-subtitle">来自观鸟同行者的现场记录</p></div>
        <button class="button button-primary" type="button" @click="session.user ? showForm = !showForm : session.openAuth('login')"><Plus :size="17" /> 写一篇日记</button>
      </div>

      <form v-if="showForm" class="journal-form" @submit.prevent="submitDiary">
        <div class="form-grid">
          <label>标题<input v-model="form.title" maxlength="128" required placeholder="给这次观察起个标题" /></label>
          <label>观察鸟种<input v-model="form.birdName" maxlength="64" placeholder="例如：夜鹭" /></label>
          <label>观察地点<input v-model="form.location" maxlength="64" placeholder="公园、河岸或保护区" /></label>
        </div>
        <label>观察笔记<textarea v-model="form.content" maxlength="2000" rows="4" placeholder="天气、行为、环境变化……"></textarea></label>
        <div class="form-footer"><p v-if="error" class="form-message is-error" role="alert">{{ error }}</p><span class="char-count">{{ form.content.length }} / 2000</span><button class="button button-primary" type="submit" :disabled="submitting"><LoaderCircle v-if="submitting" class="spin" :size="16" /><Send v-else :size="16" /> 发布日记</button></div>
      </form>

      <p v-if="notice" class="inline-notice" role="status">{{ notice }}</p>
      <p v-if="error && !showForm" class="form-message is-error" role="alert">{{ error }}</p>
      <div v-if="loading" class="loading-state"><LoaderCircle class="spin" :size="21" /> 正在载入日记…</div>
      <EmptyState v-else-if="!entries.length" title="还没有公开日记" detail="登录后记录一次观察，和大家分享你的发现。" />
      <article v-for="entry in entries" v-else :key="entry.id" class="journal-entry">
        <div class="entry-date"><CalendarDays :size="17" /><span>{{ new Date(field(entry, 'createdAt', 'created_at')).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }) }}</span></div>
        <div class="entry-body">
          <div class="entry-meta"><span>{{ field(entry, 'nickname', 'nickname') || field(entry, 'username', 'username') }}</span><span v-if="field(entry, 'birdName', 'bird_name')" class="entry-bird">{{ field(entry, 'birdName', 'bird_name') }}</span></div>
          <h3>{{ entry.title }}</h3>
          <p class="entry-text">{{ entry.content || '这位观察者暂未添加笔记内容。' }}</p>
          <div v-if="field(entry, 'location', 'location')" class="entry-location"><MapPin :size="15" /> {{ field(entry, 'location', 'location') }}</div>
        </div>
      </article>

      <div v-if="!loading && totalPages > 1" class="pagination-bar">
        <button class="icon-button" type="button" :disabled="!canGoBack" aria-label="上一页" @click="loadEntries(page - 1)"><ArrowLeft :size="18" /></button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button class="icon-button" type="button" :disabled="!canGoNext" aria-label="下一页" @click="loadEntries(page + 1)"><ArrowRight :size="18" /></button>
      </div>
    </div>

    <aside class="journal-aside">
      <span class="aside-icon"><NotebookPen :size="21" /></span>
      <p class="eyebrow">KEEP A FIELD NOTE</p>
      <h2>好的观察，始于耐心。</h2>
      <p>记下日期、地点和行为线索。长期积累的记录，能帮助我们理解鸟类如何使用身边的栖息地。</p>
      <div class="aside-divider"></div>
      <a href="/html/Protection-Action/Publicize/tech-monitoring.html">了解科学监测 <ArrowRight :size="15" /></a>
    </aside>
  </section>
</template>

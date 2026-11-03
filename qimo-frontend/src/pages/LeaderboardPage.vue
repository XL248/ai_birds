<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowUp, Bird, LoaderCircle, Medal, Trophy } from 'lucide-vue-next'
import EmptyState from '../components/EmptyState.vue'
import { api } from '../api.js'

const rows = ref([])
const loading = ref(true)
const error = ref('')
const leaders = computed(() => rows.value.slice(0, 3))

onMounted(async () => {
  try {
    const result = await api.get('/api/social/leaderboard')
    rows.value = result.leaderboard || []
  } catch (loadError) {
    error.value = loadError.message
  } finally {
    loading.value = false
  }
})

function score(item) {
  return item.quizHighScore ?? item.quiz_high_score ?? 0
}
</script>

<template>
  <section class="page-banner leaderboard-banner">
    <div class="page-width banner-content"><p class="eyebrow">COMMUNITY / 03</p><h1>同行者榜</h1><p>每一次认真观察，都是对自然的长期关注。</p></div>
  </section>
  <section class="page-width content-section leaderboard-page">
    <div class="section-heading-row"><div><p class="eyebrow">OBSERVATION RANKING</p><h2>本地观察者</h2><p class="section-subtitle">按打卡种数、收藏数和答题成绩综合排序</p></div><span class="ranking-count"><Bird :size="17" /> {{ rows.length }} 位同行者</span></div>

    <div v-if="loading" class="loading-state"><LoaderCircle class="spin" :size="21" /> 正在载入排行榜…</div>
    <p v-else-if="error" class="form-message is-error" role="alert">{{ error }}</p>
    <EmptyState v-else-if="!rows.length" title="排行榜还没有记录" detail="登录并记录观鸟打卡，成为榜单上的第一位同行者。" />
    <template v-else>
      <div class="leader-strip">
        <article v-for="(person, index) in leaders" :key="person.username" class="leader-card" :class="`leader-place-${index + 1}`">
          <span class="leader-medal"><Trophy v-if="index === 0" :size="19" /><Medal v-else :size="19" /></span>
          <p class="leader-place">第 0{{ index + 1 }} 名</p>
          <div class="leader-avatar">{{ (person.nickname || person.username || '?').slice(0, 1) }}</div>
          <strong>{{ person.nickname || person.username }}</strong>
          <span class="leader-handle">@{{ person.username }}</span>
          <div class="leader-stats"><span><Bird :size="15" /> {{ person.checkin_count ?? person.checkinCount ?? 0 }} 种</span><span><ArrowUp :size="15" /> {{ score(person) }} 分</span></div>
        </article>
      </div>

      <div class="ranking-table-wrap">
        <table class="ranking-table">
          <thead><tr><th>名次</th><th>观察者</th><th>打卡鸟种</th><th>收藏</th><th>答题成绩</th></tr></thead>
          <tbody><tr v-for="(person, index) in rows" :key="person.username"><td class="rank-number">{{ String(index + 1).padStart(2, '0') }}</td><td><span class="table-avatar">{{ (person.nickname || person.username || '?').slice(0, 1) }}</span><span class="table-name">{{ person.nickname || person.username }}<small>@{{ person.username }}</small></span></td><td>{{ person.checkin_count ?? person.checkinCount ?? 0 }}</td><td>{{ person.fav_count ?? person.favCount ?? 0 }}</td><td>{{ score(person) }}</td></tr></tbody>
        </table>
      </div>
    </template>
  </section>
</template>

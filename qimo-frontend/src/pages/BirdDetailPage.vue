<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Heart, LoaderCircle, MapPin, MessageCircle, Send, ShieldCheck } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../api.js'
import { useSessionStore } from '../stores/session.js'

const route = useRoute()
const session = useSessionStore()
const species = {
  'night-heron': { name: '夜鹭', family: '鹭科', habitat: '湖泊、河流与湿地浅滩', image: '/image/ye1.gif', note: '夜鹭常在晨昏沿水边觅食，白天则隐蔽在树丛中休息。观察时保持距离，避免惊扰繁殖地。', article: '/html/Bird-Atlas/Bird-Diversity/wetland-birds-details/night-heron.html' },
  sparrow: { name: '树麻雀', family: '麻雀科', habitat: '村落、农田与城市绿地', image: '/image/0041.png', note: '树麻雀与人类生活空间相邻，是记录城市鸟类变化的常见观察对象。', article: '/html/Bird-Atlas/Bird-Diversity/urban-birds-details/sparrow.html' },
  'great-tit': { name: '大山雀', family: '山雀科', habitat: '林地、公园与庭院', image: '/image/屏幕截图%202026-07-01%20105711.png', note: '大山雀在枝叶间寻找昆虫。春季繁殖期可留意鸣唱，但不要靠近巢箱或巢位。', article: '/html/Bird-Atlas/Bird-Diversity/forest-birds-details/tit.html' },
  mallard: { name: '绿头鸭', family: '鸭科', habitat: '湖泊、河流与城市公园水域', image: '/image/0052.png', note: '绿头鸭常在水面活动。观察野生水鸟时不要投喂面包或追逐拍摄。', article: '/html/Bird-Atlas/Bird-Diversity/wetland-birds-details/duck.html' },
  'black-headed-gull': { name: '红嘴鸥', family: '鸥科', habitat: '湖泊、海岸与城市水域', image: '/image/0029.png', note: '红嘴鸥会随季节迁徙。记录日期和地点，有助于积累本地迁徙观察。', article: '/html/Bird-Atlas/Bird-Diversity/wetland-birds-details/gull.html' },
  magpie: { name: '喜鹊', family: '鸦科', habitat: '林缘、农田与城市绿地', image: '/image/0031.jpeg', note: '喜鹊善于利用多种环境。观察时可以记录巢址周边的植被和人类活动。', article: '/html/Bird-Atlas/Bird-Diversity/urban-birds-details/magpie.html' }
}
const bird = computed(() => species[route.params.slug] || species['night-heron'])
const status = ref({ checkedIn: false, favorited: false })
const comments = ref([])
const commentText = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const notice = ref('')

async function loadBird() {
  error.value = ''
  loading.value = true
  try {
    const [statusResult, commentResult] = await Promise.all([
      api.get(`/api/social/bird-status?birdName=${encodeURIComponent(bird.value.name)}`),
      api.get(`/api/social/comments?birdName=${encodeURIComponent(bird.value.name)}`)
    ])
    status.value = statusResult
    comments.value = commentResult.comments || []
  } catch (loadError) {
    error.value = loadError.message
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, loadBird)
onMounted(loadBird)

async function toggle(kind) {
  notice.value = ''
  if (!session.user) {
    session.openAuth('login')
    return
  }
  const key = kind === 'checkin' ? 'checkedIn' : 'favorited'
  const endpoint = kind === 'checkin' ? '/api/social/checkin' : '/api/social/favorite'
  try {
    if (status.value[key]) await api.delete(endpoint, { birdName: bird.value.name })
    else await api.post(endpoint, { birdName: bird.value.name })
    status.value[key] = !status.value[key]
    notice.value = kind === 'checkin' ? (status.value[key] ? '已记录这次观察。' : '已取消观察记录。') : (status.value[key] ? '已加入收藏。' : '已取消收藏。')
  } catch (actionError) {
    notice.value = actionError.message
  }
}

async function addComment() {
  if (!session.user) {
    session.openAuth('login')
    return
  }
  const content = commentText.value.trim()
  if (!content) return
  sending.value = true
  notice.value = ''
  try {
    await api.post('/api/social/comment', { birdName: bird.value.name, content })
    commentText.value = ''
    const result = await api.get(`/api/social/comments?birdName=${encodeURIComponent(bird.value.name)}`)
    comments.value = result.comments || []
  } catch (actionError) {
    notice.value = actionError.message
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="detail-hero">
    <img :src="bird.image" :alt="bird.name" />
    <div class="detail-hero-shade"></div>
    <div class="page-width detail-hero-copy">
      <RouterLink class="back-link" to="/birds"><ArrowLeft :size="16" /> 返回图鉴</RouterLink>
      <p class="eyebrow">{{ bird.family }} · FIELD NOTES</p>
      <h1>{{ bird.name }}</h1>
      <p><MapPin :size="16" /> {{ bird.habitat }}</p>
    </div>
  </section>
  <section class="page-width detail-content">
    <article class="detail-story">
      <p class="eyebrow">OBSERVATION GUIDE</p>
      <h2>留意它的生活痕迹</h2>
      <p>{{ bird.note }}</p>
      <a class="text-link" :href="bird.article">阅读完整物种专题 <ArrowLeft class="flip-horizontal" :size="16" /></a>
      <div class="notice-box"><ShieldCheck :size="18" /><span>文明观鸟：保持安静和距离，不追逐、不投喂、不破坏巢穴。</span></div>
    </article>

    <aside class="observation-panel">
      <p class="eyebrow">YOUR OBSERVATION</p>
      <h2>记录一次相遇</h2>
      <p>登录后将观察保存到个人档案。</p>
      <div class="observation-actions">
        <button class="button button-primary" type="button" :disabled="loading" @click="toggle('checkin')"><LoaderCircle v-if="loading" class="spin" :size="16" />{{ status.checkedIn ? '已记录观察' : '记录观察' }}</button>
        <button class="button button-outline" type="button" :aria-pressed="status.favorited" @click="toggle('favorite')"><Heart :size="16" :fill="status.favorited ? 'currentColor' : 'none'" />{{ status.favorited ? '已收藏' : '收藏物种' }}</button>
      </div>
      <p v-if="notice" class="form-message" role="status">{{ notice }}</p>
      <p v-if="error" class="form-message is-error" role="alert">{{ error }}</p>
    </aside>

    <section class="comments-section">
      <div class="section-heading-row"><div><p class="eyebrow">COMMUNITY NOTES</p><h2><MessageCircle :size="21" /> 观察交流 <span>{{ comments.length }}</span></h2></div></div>
      <form class="comment-compose" @submit.prevent="addComment">
        <textarea v-model="commentText" maxlength="500" rows="3" placeholder="分享观察时间、地点或行为线索" :aria-label="`为${bird.name}添加观察评论`"></textarea>
        <button class="button button-primary" type="submit" :disabled="sending || !commentText.trim()"><Send :size="16" /> 发布</button>
      </form>
      <div v-if="!comments.length" class="comments-empty">还没有交流记录，欢迎留下第一条观察。</div>
      <article v-for="comment in comments" :key="comment.id" class="comment-row">
        <span class="comment-avatar">{{ (comment.nickname || comment.username || '观').slice(0, 1) }}</span>
        <div><strong>{{ comment.nickname || comment.username }}</strong><p>{{ comment.content }}</p><time>{{ new Date(comment.created_at || comment.createdAt).toLocaleString('zh-CN') }}</time></div>
      </article>
    </section>
  </section>
</template>

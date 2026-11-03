<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, Bird, Search } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const search = ref('')
const category = ref('全部')
const birds = [
  { name: '夜鹭', family: '鹭科', habitat: '湿地', slug: 'night-heron', image: '/image/ye1.gif', note: '黄昏时常沿浅水岸边活动。' },
  { name: '树麻雀', family: '麻雀科', habitat: '城市', slug: 'sparrow', image: '/image/0041.png', note: '适应力强，常见于居民区与农田。' },
  { name: '大山雀', family: '山雀科', habitat: '森林', slug: 'great-tit', image: '/image/屏幕截图%202026-07-01%20105711.png', note: '活跃于林间枝叶，鸣声清亮。' },
  { name: '绿头鸭', family: '鸭科', habitat: '湿地', slug: 'mallard', image: '/image/0052.png', note: '常见水鸟，善于游泳与潜水觅食。' },
  { name: '红嘴鸥', family: '鸥科', habitat: '湿地', slug: 'black-headed-gull', image: '/image/0029.png', note: '随季节迁徙，在湖泊与海岸停留。' },
  { name: '喜鹊', family: '鸦科', habitat: '城市', slug: 'magpie', image: '/image/0031.jpeg', note: '在林缘、农田和城市绿地都能见到。' }
]
const categories = ['全部', '湿地', '森林', '城市']
const filteredBirds = computed(() => birds.filter((bird) => {
  const matchesSearch = `${bird.name}${bird.family}${bird.habitat}`.includes(search.value.trim())
  return matchesSearch && (category.value === '全部' || bird.habitat === category.value)
}))
</script>

<template>
  <section class="page-banner">
    <div class="page-width banner-content"><p class="eyebrow">FIELD GUIDE / 01</p><h1>鸟类图鉴</h1><p>从一片羽色、一声鸣叫，开始认识身边的鸟。</p></div>
  </section>
  <section class="page-width content-section">
    <div class="catalog-toolbar">
      <div class="filter-tabs" aria-label="按栖息环境筛选">
        <button v-for="item in categories" :key="item" type="button" :class="{ selected: category === item }" @click="category = item">{{ item }}</button>
      </div>
      <label class="search-field"><Search :size="17" /><input v-model="search" type="search" aria-label="搜索鸟类" placeholder="搜索鸟名、科属或栖息地" /></label>
    </div>

    <div class="bird-grid">
      <RouterLink v-for="bird in filteredBirds" :key="bird.slug" class="bird-card" :to="`/birds/${bird.slug}`">
        <div class="bird-card-image"><img :src="bird.image" :alt="bird.name" loading="lazy" /><span>{{ bird.habitat }}</span></div>
        <div class="bird-card-copy"><div><p>{{ bird.family }}</p><h2>{{ bird.name }}</h2><span>{{ bird.note }}</span></div><span class="round-arrow"><ArrowRight :size="17" /></span></div>
      </RouterLink>
    </div>
    <div v-if="!filteredBirds.length" class="empty-state"><span class="empty-mark"><Bird :size="20" /></span><strong>没有找到匹配的鸟类</strong><p>试试更短的关键词或切换栖息地。</p></div>

    <div class="legacy-reading-link"><div><p class="eyebrow">MORE TO EXPLORE</p><h2>继续阅读专题图鉴</h2><p>了解不同生态区域的鸟类多样性与保护价值。</p></div><div class="legacy-link-list"><a href="/html/Bird-Atlas/Bird-Diversity/forest-birds.html">森林鸟类专题 <ArrowRight :size="15" /></a><a href="/html/Bird-Atlas/Bird-Diversity/wetland-birds.html">湿地水鸟专题 <ArrowRight :size="15" /></a><a href="/html/Bird-Atlas/Bird-Diversity/urban-birds.html">城市鸟类专题 <ArrowRight :size="15" /></a></div></div>
  </section>
</template>

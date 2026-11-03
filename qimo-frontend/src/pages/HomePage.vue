<script setup>
import { ArrowRight, BookOpen, Leaf, NotebookPen, Trophy } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useSessionStore } from '../stores/session.js'

const session = useSessionStore()
const habitats = [
  { name: '森林', description: '林冠之间，听见山雀与啄木鸟的回声。', image: '/image/qxd_senlin.jpeg', href: '/html/habitat/forest.html' },
  { name: '湿地', description: '水岸与浅滩，是候鸟停歇的驿站。', image: '/image/qxd_shidi.png', href: '/html/habitat/wetland.html' },
  { name: '草原', description: '开阔草地中，观察迁徙与繁殖的季节。', image: '/image/qxd_caoyuan.jpeg', href: '/html/habitat/grassland.html' },
  { name: '荒漠', description: '适应干旱的生命，也有独特的飞行轨迹。', image: '/image/qxd_huangmo.jpeg', href: '/html/habitat/desert.html' }
]
</script>

<template>
  <section class="home-hero">
    <img class="hero-photo" src="/image/0001.jpeg" alt="林间停歇的鸟" />
    <div class="hero-scrim"></div>
    <div class="hero-copy page-width">
      <p class="eyebrow hero-eyebrow"><span></span> 观鸟记录 · 自然保护</p>
      <h1>羽翼守望者</h1>
      <p class="hero-description">从一次抬头开始，认识身边的鸟，留下每次相遇的记录。</p>
      <div class="hero-actions">
        <RouterLink class="button button-light" to="/birds">浏览鸟类图鉴 <ArrowRight :size="17" /></RouterLink>
        <button v-if="!session.user" class="button button-hero-ghost" type="button" @click="session.openAuth('register')">加入观鸟记录</button>
        <RouterLink v-else class="button button-hero-ghost" to="/profile">我的观鸟档案</RouterLink>
      </div>
    </div>
    <div class="hero-caption"><span>FIELD NOTE 001</span><span>从身边开始观察</span></div>
  </section>

  <section class="section-band home-intro">
    <div class="page-width intro-grid">
      <div>
        <p class="eyebrow">A FIELD GUIDE FOR EVERYONE</p>
        <h2>把观察，变成<br /><em>守护自然的行动</em></h2>
      </div>
      <p class="intro-copy">查阅鸟类与栖息地知识，记录你的观察足迹，并和更多同行者分享发现。每一条记录，都是理解本地生态的一小步。</p>
      <div class="intro-rule"></div>
    </div>
    <div class="page-width quick-links">
      <RouterLink to="/birds" class="quick-link"><span><BookOpen :size="19" /></span><div><strong>认识鸟类</strong><small>按生态类别探索图鉴</small></div><ArrowRight :size="17" /></RouterLink>
      <RouterLink to="/diary" class="quick-link"><span><NotebookPen :size="19" /></span><div><strong>记录观察</strong><small>留下地点与观察笔记</small></div><ArrowRight :size="17" /></RouterLink>
      <RouterLink to="/leaderboard" class="quick-link"><span><Trophy :size="19" /></span><div><strong>同行者榜</strong><small>看看社区里的新发现</small></div><ArrowRight :size="17" /></RouterLink>
    </div>
  </section>

  <section class="section-band habitat-section">
    <div class="page-width section-heading-row">
      <div><p class="eyebrow">HABITATS</p><h2>从栖息地认识鸟</h2></div>
      <a class="text-link" href="/html/habitat/wetland.html">浏览全部栖息地 <ArrowRight :size="16" /></a>
    </div>
    <div class="page-width habitat-grid">
      <a v-for="(habitat, index) in habitats" :key="habitat.name" class="habitat-tile" :href="habitat.href">
        <img :src="habitat.image" :alt="`${habitat.name}栖息地`" loading="lazy" />
        <span class="tile-index">0{{ index + 1 }}</span>
        <div class="tile-copy"><strong>{{ habitat.name }}</strong><span>{{ habitat.description }}</span></div>
      </a>
    </div>
  </section>

  <section class="conservation-band">
    <div class="page-width conservation-inner">
      <div class="conservation-mark"><Leaf :size="26" /></div>
      <div><p class="eyebrow">PROTECT THEIR HOME</p><h2>看见栖息地，也看见保护的理由</h2><p>从湿地修复到社区参与，了解每个行动如何影响鸟类的家园。</p></div>
      <a class="button button-outline" href="/html/Protection-Action/Habitat-Protection/protected-areas.html">了解保护行动 <ArrowRight :size="16" /></a>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSessionStore } from '../stores/session.js'

const session = useSessionStore()
const habitatTrack = ref(null)
const galleryTrack = ref(null)
const habitats = [
  { name: '森林', image: 'qxd_senlin.jpeg', description: '林鸟天堂 · 生物多样性占位', href: 'html/habitat/forest.html' },
  { name: '湿地', image: 'qxd_shidi.png', description: '水鸟栖息 · 生态净化占位', href: 'html/habitat/wetland.html' },
  { name: '城市', image: 'qxd_chengshi.jpeg', description: '人与鸟类共处 · 城市生态占位', href: 'html/habitat/city.html' },
  { name: '高山', image: 'qxd_gaoshan.jpg', description: '岩壁精灵 · 高海拔适应占位', href: 'html/habitat/mountain.html' },
  { name: '悬崖', image: 'qxd_xuanya.jpeg', description: '峭壁筑巢 · 猛禽领地占位', href: 'html/habitat/cliff.html' },
  { name: '荒漠', image: 'qxd_huangmo.jpeg', description: '沙洲飞羽 · 耐旱物种占位', href: 'html/habitat/desert.html' },
  { name: '戈壁', image: 'qxd_gebi.jpeg', description: '砾石栖居 · 顽强生命占位', href: 'html/habitat/gobi.html' },
  { name: '草原', image: 'qxd_caoyuan.jpeg', description: '旷野逐风 · 地栖鸟类占位', href: 'html/habitat/grassland.html' }
]
const gallery = [
  { name: '雕枭/雪鸮', image: 'rj_xiao.png', alt: '鸮' },
  { name: '珠颈斑鸠(燕?)', image: 'rj_banjiu.png', alt: '珠颈斑鸠' },
  { name: '红尾水鸲', image: 'rj_shuiqu.jpg', alt: '红尾水鸲' },
  { name: '夜鹭', image: 'rj_yelu.jpeg', alt: '夜鹭' },
  { name: '海鸥', image: 'rj_haiou.jpeg', alt: '海鸥' },
  { name: '伯劳', image: 'rj_bolao.jpg', alt: '伯劳' },
  { name: '白头鹎', image: 'rj_baitoubei.jpg', alt: '白头鹎' },
  { name: '黄腰柳莺', image: 'rj_liuying.jpg', alt: '黄腰柳莺' },
  { name: '喜鹊', image: 'rj_xique.jpg', alt: '喜鹊' },
  { name: '渡鸦', image: 'rj_duya.png', alt: '渡鸦' },
  { name: '红隼', image: 'rj_sun.jpg', alt: '红隼' }
]
const birdDiversity = [
  ['fa-tree', '森林鸟类', 'html/Bird-Atlas/Bird-Diversity/forest-birds.html'],
  ['fa-water', '湿地水鸟', 'html/Bird-Atlas/Bird-Diversity/wetland-birds.html'],
  ['fa-mountain', '猛禽与高山鸟', 'html/Bird-Atlas/Bird-Diversity/raptor-alpine-birds.html'],
  ['fa-city', '城市适应物种', 'html/Bird-Atlas/Bird-Diversity/urban-birds.html']
]
const ecologicalValues = [
  ['fa-seedling', '传粉', 'html/Bird-Atlas/Ecological-Value/eco-pollination.html'],
  ['fa-seedling', '种子扩散', 'html/Bird-Atlas/Ecological-Value/eco-seed-dispersal.html'],
  ['fa-bug', '虫害控制', 'html/Bird-Atlas/Ecological-Value/eco-pest-control.html']
]
const protectionLinks = [
  ['fa-tree', '森林修复', 'html/Protection-Action/Habitat-Protection/forest-restoration.html'],
  ['fa-water', '湿地恢复', 'html/Protection-Action/Habitat-Protection/wetland-restoration.html'],
  ['fa-mountain', '自然保护区', 'html/Protection-Action/Habitat-Protection/protected-areas.html']
]
const outreachLinks = [
  ['fa-gavel', '普法教育', 'html/Protection-Action/Publicize/legal-education.html'],
  ['fa-users', '社区参与', 'html/Protection-Action/Publicize/community-participation.html'],
  ['fa-satellite', '科技监测', 'html/Protection-Action/Publicize/tech-monitoring.html']
]
const habitatItems = [...habitats, ...habitats]
const galleryItems = [...gallery, ...gallery]
const featherContainer = ref(null)
let featherTimer
let resizeTimer

function setLoopDistance(trackRef, itemCount) {
  const track = trackRef.value
  if (!track || track.children.length <= itemCount) return
  const first = track.children[0]
  const last = track.children[itemCount - 1]
  const distance = last.offsetLeft + last.offsetWidth - first.offsetLeft
  track.style.setProperty('--loop-distance', `${distance}px`)
}

function createFeather() {
  const container = featherContainer.value
  if (!container) return
  const feather = document.createElement('div')
  const duration = Math.random() * 6 + 3
  const size = Math.floor(Math.random() * 8) + 3
  feather.className = 'feather-particle'
  Object.assign(feather.style, {
    left: `${Math.random() * window.innerWidth}px`,
    top: '-20px',
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`
  })
  container.append(feather)
  window.setTimeout(() => feather.remove(), duration * 1000)
}

function resizeLoops() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    setLoopDistance(habitatTrack, habitats.length)
    setLoopDistance(galleryTrack, gallery.length)
  }, 250)
}

function scrollToBirdGuide() {
  const target = document.getElementById('bird-guide')
  if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' })
}

onMounted(async () => {
  await nextTick()
  setLoopDistance(habitatTrack, habitats.length)
  setLoopDistance(galleryTrack, gallery.length)
  window.addEventListener('resize', resizeLoops)
  featherTimer = window.setInterval(createFeather, 400)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeLoops)
  window.clearInterval(featherTimer)
  window.clearTimeout(resizeTimer)
})
</script>

<template>
  <section id="hero" class="hero">
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-bg-deco"></div>
      <div class="hero-title">
        <h1>羽翼 · 自然之声</h1>
        <div class="hero-sub">🌿 守护每一片飞翔的羽毛 🌿</div>
      </div>
      <div class="hero-middle-img"><img src="/image/koshi.png" alt="恋恋" /></div>
      <div class="hero-placeholder"><i class="fas fa-dove"></i> 与鸟同行</div>
      <a class="scroll-hint" href="#bird-guide" @click.prevent="scrollToBirdGuide"><span>向下探索</span><i class="fas fa-chevron-down"></i></a>
    </div>
  </section>

  <section id="bird-guide" class="game-section">
    <div class="container">
      <div class="section-header">
        <h2><i class="fas fa-book-open"></i> 鸟类图鉴 · 天空的使者 <i class="fas fa-book-open"></i></h2>
        <div class="subtitle">全球超过一万种鸟类 · 生态平衡的守护者</div>
      </div>
      <div class="game-grid">
        <div class="game-media"><img src="/image/屏幕截图%202026-07-01%20095352.png" alt="鸟类摄影" style="width: 100%; border-radius: 12px" /></div>
        <div class="game-info">
          <div class="info-card">
            <h3><i class="fas fa-feather"></i> 鸟类多样性</h3>
            <ul class="feature-list"><li v-for="[icon, label, href] in birdDiversity" :key="href"><i class="fas" :class="icon"></i><a :href="href" style="color: inherit; text-decoration: none">{{ label }}</a></li></ul>
          </div>
          <div class="info-card">
            <h3><i class="fas fa-leaf"></i> 生态价值</h3>
            <ul class="feature-list"><li v-for="[icon, label, href] in ecologicalValues" :key="href"><i class="fas" :class="icon"></i><a :href="href" style="color: inherit; text-decoration: none">{{ label }}</a></li></ul>
          </div>
          <div class="btn-placeholder"><i class="fas fa-binoculars"></i> <a href="https://www.birdnet.cn/index.php?mobile=no">了解更多鸟类</a></div>
        </div>
      </div>
    </div>
  </section>

  <section id="conservation" class="game-section">
    <div class="container">
      <div class="section-header">
        <h2><i class="fas fa-hand-holding-heart"></i> 保护行动 · 守护鸟类家园 <i class="fas fa-hand-holding-heart"></i></h2>
        <div class="subtitle">每一份努力，都是对自然的承诺</div>
      </div>
      <div class="game-grid reverse-on-mobile">
        <div class="game-info">
          <div class="info-card">
            <h3><i class="fas fa-shield-alt"></i> 栖息地保护</h3>
            <ul class="feature-list"><li v-for="[icon, label, href] in protectionLinks" :key="href"><i class="fas" :class="icon"></i><a :href="href" style="color: inherit; text-decoration: none">{{ label }}</a></li></ul>
          </div>
          <div class="info-card">
            <h3><i class="fas fa-fist-raised"></i> 反盗猎 &amp; 宣传</h3>
            <ul class="feature-list"><li v-for="[icon, label, href] in outreachLinks" :key="href"><i class="fas" :class="icon"></i><a :href="href" style="color: inherit; text-decoration: none">{{ label }}</a></li></ul>
          </div>
          <button class="btn-placeholder" type="button" @click="session.openAuth('register')"><i class="fas fa-heart"></i> 加入守护者 (占位按钮)</button>
        </div>
        <div class="game-media"><img src="/image/shutiao.jpg" alt="保护行动" style="width: 100%; border-radius: 12px" /></div>
      </div>
    </div>
  </section>

  <section id="habitat" class="compare-section">
    <div class="container">
      <div class="section-header"><h2><i class="fas fa-globe-asia"></i> 栖息地 · 共同的家园</h2></div>
      <div class="habitat-slider" @mouseenter="habitatTrack?.classList.add('paused')" @mouseleave="habitatTrack?.classList.remove('paused')">
        <div ref="habitatTrack" class="habitat-track vue-loop-track">
          <a v-for="(habitat, index) in habitatItems" :key="`${habitat.name}-${index}`" :href="habitat.href" class="compare-card" :aria-hidden="index >= habitats.length">
            <div class="img-placeholder"><img :src="`/image/${habitat.image}`" :alt="`${habitat.name}栖息地`" /></div>
            <h3>{{ habitat.name }}</h3><div class="compare-placeholder">{{ habitat.description }}</div>
          </a>
        </div>
      </div>
    </div>
  </section>

  <section id="gallery" class="gallery-section">
    <div class="container">
      <div class="section-header"><h2><i class="fas fa-images"></i> 观鸟日记 · 自然瞬间</h2></div>
      <div class="gallery-slider" @mouseenter="galleryTrack?.classList.add('paused')" @mouseleave="galleryTrack?.classList.remove('paused')">
        <div ref="galleryTrack" class="gallery-track vue-loop-track">
          <div v-for="(item, index) in galleryItems" :key="`${item.name}-${index}`" class="gallery-item" :aria-hidden="index >= gallery.length">
            <div class="img-placeholder"><img :src="`/image/${item.image}`" :alt="item.alt" /></div><h3>{{ item.name }}</h3>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div ref="featherContainer" class="feather-particle-container"></div>
</template>

<style scoped>
.hero-middle-img img { margin-inline: auto; }
.vue-loop-track { animation: vue-loop 40s linear infinite; }
.vue-loop-track.paused { animation-play-state: paused; }
@keyframes vue-loop { to { transform: translateX(calc(-1 * var(--loop-distance, 100%))); } }
</style>

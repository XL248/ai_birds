<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Menu, X } from 'lucide-vue-next'
import AuthModal from './components/AuthModal.vue'
import { useSessionStore } from './stores/session.js'

const session = useSessionStore()
const route = useRoute()
const menuOpen = ref(false)
const userMenuOpen = ref(false)

onMounted(() => session.refresh())

function closeMenu() {
  menuOpen.value = false
  userMenuOpen.value = false
}

function sectionHref(id) {
  return route.path === '/' ? `#${id}` : `/index.html#${id}`
}

function navigateToSection(event, id) {
  if (route.path !== '/') return
  event.preventDefault()
  window.history.replaceState(null, '', `#${id}`)
  const target = document.getElementById(id)
  if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' })
}

async function logout() {
  await session.logout()
  closeMenu()
}
</script>

<template>
  <div class="app-shell">
    <header class="navbar">
      <div class="container nav-container">
        <RouterLink class="logo" to="/" @click="closeMenu"><i class="fas fa-feather-alt"></i> 羽翼守望者</RouterLink>
        <div class="nav-gif"><img src="/image/top_yelu.gif" alt="夜鹭" /></div>
        <nav aria-label="主导航">
          <ul class="nav-links" :class="{ active: menuOpen }">
            <li><a :href="sectionHref('hero')" @click="navigateToSection($event, 'hero'); closeMenu()">首页</a></li>
            <li><a :href="sectionHref('bird-guide')" @click="navigateToSection($event, 'bird-guide'); closeMenu()">鸟类图鉴</a></li>
            <li><a :href="sectionHref('conservation')" @click="navigateToSection($event, 'conservation'); closeMenu()">保护行动</a></li>
            <li><a :href="sectionHref('habitat')" @click="navigateToSection($event, 'habitat'); closeMenu()">栖息地</a></li>
            <li><a :href="sectionHref('gallery')" @click="navigateToSection($event, 'gallery'); closeMenu()">观鸟日记</a></li>
            <li class="nav-auth-area" :class="{ 'nav-auth-area-open': userMenuOpen }">
              <template v-if="session.user">
                <div class="nav-user-menu">
                  <button class="nav-user-name nav-dropdown-toggle" type="button" @click="userMenuOpen = !userMenuOpen"><i class="fas fa-feather-alt"></i> {{ session.user.username }} <i class="fas fa-caret-down"></i></button>
                  <div class="nav-user-dropdown" :class="{ open: userMenuOpen }">
                    <a href="/html/user/profile.html" @click="closeMenu"><i class="fas fa-user"></i>个人中心</a>
                    <a href="/html/user/diary.html" @click="closeMenu"><i class="fas fa-book-open"></i>观鸟日记</a>
                    <a href="/html/user/leaderboard.html" @click="closeMenu"><i class="fas fa-trophy"></i>排行榜</a>
                    <button class="nav-logout-btn" type="button" @click="logout"><i class="fas fa-sign-out-alt"></i>退出</button>
                  </div>
                </div>
              </template>
              <template v-else>
                <a href="#login" class="nav-login-btn" @click.prevent="session.openAuth('login')"><i class="fas fa-user"></i> 登录</a>
                <div class="nav-user-menu nav-guest-menu">
                  <button class="nav-user-name nav-dropdown-toggle" type="button" aria-label="更多社区页面" @click="userMenuOpen = !userMenuOpen"><i class="fas fa-ellipsis-h"></i></button>
                  <div class="nav-user-dropdown" :class="{ open: userMenuOpen }">
                    <a href="/html/user/leaderboard.html" @click="closeMenu"><i class="fas fa-trophy"></i>排行榜</a>
                    <a href="/html/user/diary.html" @click="closeMenu"><i class="fas fa-book-open"></i>观鸟日记</a>
                  </div>
                </div>
              </template>
            </li>
          </ul>
          <button class="menu-toggle" type="button" :aria-label="menuOpen ? '关闭导航' : '打开导航'" @click="menuOpen = !menuOpen">
            <X v-if="menuOpen" :size="22" />
            <Menu v-else :size="22" />
          </button>
        </nav>
      </div>
    </header>

    <main id="main-content">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <RouterLink class="footer-logo" to="/"><i class="fas fa-feather-alt"></i> 羽翼守望者</RouterLink>
          <div class="footer-text">
            <p>🌱 与自然共生 · 为鸟类护航 🌱</p>
            <p class="copyright">© 绿水青山，就是金山银山 | created by bxy，hqp，tsy</p>
          </div>
        </div>
      </div>
    </footer>

    <AuthModal />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Bird, BookOpen, ChevronDown, Feather, LogIn, LogOut, Menu, NotebookPen, Trophy, UserRound, X } from 'lucide-vue-next'
import AuthModal from './components/AuthModal.vue'
import { useSessionStore } from './stores/session.js'

const session = useSessionStore()
const route = useRoute()
const menuOpen = ref(false)

onMounted(() => session.refresh())

function closeMenu() {
  menuOpen.value = false
}

async function logout() {
  await session.logout()
  closeMenu()
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink class="brand" to="/" @click="closeMenu">
          <span class="brand-mark"><Feather :size="19" /></span>
          <span>羽翼守望者<small>WINGWATCH</small></span>
        </RouterLink>

        <button class="mobile-menu-button icon-button" type="button" :aria-label="menuOpen ? '关闭导航' : '打开导航'" @click="menuOpen = !menuOpen">
          <X v-if="menuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>

        <nav class="main-nav" :class="{ 'is-open': menuOpen }" aria-label="主导航">
          <RouterLink to="/birds" :class="{ active: route.path.startsWith('/birds') }" @click="closeMenu"><Bird :size="16" /> 鸟类图鉴</RouterLink>
          <RouterLink to="/diary" :class="{ active: route.path === '/diary' }" @click="closeMenu"><NotebookPen :size="16" /> 观鸟日记</RouterLink>
          <RouterLink to="/leaderboard" :class="{ active: route.path === '/leaderboard' }" @click="closeMenu"><Trophy :size="16" /> 排行榜</RouterLink>
          <a href="/html/Protection-Action/Habitat-Protection/protected-areas.html" @click="closeMenu"><BookOpen :size="16" /> 保护知识 <ChevronDown class="nav-external" :size="13" /></a>
          <RouterLink v-if="session.user" class="mobile-profile-link" to="/profile" @click="closeMenu"><UserRound :size="16" /> {{ session.user.username }}</RouterLink>
          <button v-if="session.user" class="mobile-profile-link" type="button" @click="logout"><LogOut :size="16" /> 退出登录</button>
          <button v-else class="mobile-profile-link" type="button" @click="session.openAuth('login'); closeMenu()"><LogIn :size="16" /> 登录 / 注册</button>
        </nav>

        <div class="header-actions">
          <RouterLink v-if="session.user" class="account-link" to="/profile" :title="session.user.username">
            <span class="account-avatar">{{ session.user.username.slice(0, 1).toUpperCase() }}</span>
            <span>{{ session.user.username }}</span>
          </RouterLink>
          <button v-if="session.user" class="icon-button logout-button" type="button" title="退出登录" @click="logout"><LogOut :size="17" /></button>
          <button v-else class="button button-small button-outline" type="button" @click="session.openAuth('login')">登录 <LogIn :size="15" /></button>
        </div>
      </div>
    </header>

    <main id="main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <RouterLink class="footer-brand" to="/"><Feather :size="17" /> 羽翼守望者</RouterLink>
      <span>记录每一次相遇，守护每一片栖息地。</span>
      <a href="/html/Protection-Action/Publicize/community-participation.html">参与保护行动</a>
    </footer>

    <AuthModal />
  </div>
</template>

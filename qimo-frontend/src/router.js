import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import BirdCatalogPage from './pages/BirdCatalogPage.vue'
import BirdDetailPage from './pages/BirdDetailPage.vue'
import DiaryPage from './pages/DiaryPage.vue'
import LeaderboardPage from './pages/LeaderboardPage.vue'
import ProfilePage from './pages/ProfilePage.vue'

export default createRouter({
  history: createWebHashHistory(),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', component: HomePage },
    { path: '/birds', component: BirdCatalogPage },
    { path: '/birds/:slug', component: BirdDetailPage },
    { path: '/diary', component: DiaryPage },
    { path: '/leaderboard', component: LeaderboardPage },
    { path: '/profile', component: ProfilePage },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

<script setup>
import { Bird } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: '暂时还没有记录' },
  detail: { type: String, default: '新的观察会显示在这里。' }
})
</script>

<template>
  <div class="empty-state">
    <span class="empty-mark"><Bird :size="21" /></span>
    <strong>{{ title }}</strong>
    <p>{{ detail }}</p>
  </div>
</template>

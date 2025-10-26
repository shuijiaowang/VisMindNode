<template>
  <!-- 目录容器 - 固定在右侧 -->
  <div class="directory-panel" :class="{ 'expanded': isExpanded }">
    <!-- 切换按钮 -->
    <div class="toggle-btn" @click="toggleExpand">
      <span>{{ isExpanded ? '←' : '→' }}</span>
    </div>

    <!-- 目录内容区 -->
    <DirectoryContent />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCanvasElementStore } from '@/stores/canvasElementStore.js'
import DirectoryContent from "@/components/directory/DirectoryContent.vue";

// 状态管理
const isExpanded = ref(true) // 默认展开
const elementStore = useCanvasElementStore()

// 切换显示/隐藏
const toggleExpand = () => {
  console.log('toggleExpand')
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.directory-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  display: flex;
  z-index:100; /* 低于工具栏(100)，高于画布内容 */
  transition: all 0.3s ease;
}

/* 修复收缩状态样式 - 提高选择器针对性 */
.directory-panel {
  &.expanded .directory-content {
    width: 300px;
    min-width: 300px; /* 确保展开时宽度稳定 */
  }
  &:not(.expanded) .directory-content {
    width: 0;
    min-width: 0; /* 关键：清除最小宽度限制 */
    overflow: hidden;
    padding: 0; /* 移除内边距避免残留 */
  }
}
/* 切换按钮 */
.toggle-btn {
  width: 24px;
  height: 40px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-right: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
  z-index: 1;
  margin-top: 20px;
}

.toggle-btn:hover {
  background-color: #f3f4f6;
}

</style>
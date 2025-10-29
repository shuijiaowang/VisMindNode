<!-- DirectoryContent.vue -->
<template>
  <div class="directory-content">
    <div class="directory-header">
      <h3>目录</h3>
      <button class="refresh-btn" @click="refresh">↻</button>
      <button class="add-btn" @click="addRootTitle">+ 新增顶级标题</button>
    </div>
    <div class="directory-list">
      <!-- 递归渲染顶级标题 -->
      <template v-for="id in directoryStore.selectedShowDirTitleIds" :key="id">
        <DirectoryTitleItem
            :id="id"
            :level="0"
            @toggle-expand="handleExpand"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { useCanvasElementStore } from '@/stores/canvasElementStore'
import DirectoryTitleItem from './DirectoryTitleItem.vue'
import {useCanvasDirectoryStore} from "@/stores/canvasDirectoryStore.js";

const elementStore = useCanvasElementStore()
const directoryStore =useCanvasDirectoryStore()

// 刷新目录
const refresh = () => {
  // 重新计算层级关系（可选：处理数据不一致的情况）
}

// 新增顶级标题
const addRootTitle = () => {
  elementStore.createTitle(100, 100, '新顶级标题')
}

// 处理展开/折叠事件
const handleExpand = (id, isExpanded) => {
  elementStore.updateElement(id, { isExpanded })
}
</script>

<style scoped>
/* 目录内容区 - 增加基础样式重置 */
.directory-content {
  background-color: #fff;
  border-left: 1px solid #e5e7eb;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  transition: width 0.3s ease, min-width 0.3s ease; /* 增加min-width过渡 */
  overflow-y: auto;
}

/* 目录头部 */
.directory-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.directory-header h3 {
  margin: 0;
  font-size: 16px;
  color: #374151;
}

.refresh-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background-color: #f3f4f6;
}

/* 目录列表容器 */
.directory-list {
  padding: 12px 0;
}
</style>
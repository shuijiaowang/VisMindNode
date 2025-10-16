<template>
  <div
      class="markdown-component"
      :style="{
      left: `${x}px`,
      top: `${y}px`,
      position: 'absolute',
      width: '400px',
      minHeight: '300px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }"
      @mousedown.stop
  >
    <div class="markdown-toolbar">
      <button @click="toggleEdit">{{ isEditing ? '预览' : '编辑' }}</button>
    </div>

    <div v-if="isEditing" class="editor-container">
      <textarea
          v-model="currentContent"
          class="markdown-editor"
          @blur="handleBlur"
          ref="editorRef"
      ></textarea>
    </div>

    <div v-else class="preview-container markdown-body">
      <div v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, onMounted, nextTick, computed } from 'vue'
import {marked} from 'marked'
import 'github-markdown-css'

const props = defineProps({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  content: { type: String, default: '' }
})

const emit = defineEmits(['update:content'])
const isEditing = ref(true)  // 默认进入编辑模式
const currentContent = ref(props.content)
const editorRef = ref(null)

// 渲染markdown内容
const renderedContent = computed(() => {
  return marked.parse(currentContent.value)
})

// 切换编辑/预览模式
const toggleEdit = () => {
  isEditing.value = !isEditing.value
  // 切换到编辑模式时自动聚焦
  if (isEditing.value) {
    nextTick(() => editorRef.value?.focus())
  }
}

// 失去焦点时更新内容
const handleBlur = () => {
  emit('update:content', currentContent.value)
}

// 组件挂载时聚焦编辑器
onMounted(() => {
  nextTick(() => editorRef.value?.focus())
})
</script>

<style scoped>
.markdown-toolbar {
  padding: 8px;
  border-bottom: 1px solid #eee;
  background: #f5f5f5;
}

.editor-container {
  height: calc(100% - 40px);
}

.markdown-editor {
  width: 100%;
  height: 100%;
  min-height: 260px;
  border: none;
  padding: 16px;
  resize: none;
  outline: none;
  font-family: monospace;
  font-size: 14px;
}

.preview-container {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

/* 解决样式穿透问题 */
::v-deep .markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}
</style>
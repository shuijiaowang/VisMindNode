<!-- ReusableTextarea.vue -->
<template>
  <textarea
      v-model="currentContent"
      @blur="handleBlur"
      @input="handleInput"
      @keydown.enter="onEnter"
      ref="textareaRef"
      class="text-editor"
      @mousedown.stop
      :placeholder="placeholder"
      :rows="computedRows"
      :style="mergedStyle"
      wrap="soft"
      autocomplete="off"
      spellcheck="false"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  // 内容双向绑定
  modelValue: {
    type: String,
    default: ''
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: '请输入内容'
  },
  // 最小宽度
  minWidth: {
    type: Number,
    default: 50
  },
  // 样式定制（支持颜色、字体大小等）
  style: {
    type: Object,
    default: () => ({
      // 预留默认样式配置
      color: '#333',
      fontSize: '16px'
    })
  },
  // 最小行数
  minRows: {
    type: Number,
    default: 1
  }
})
const elementStore=useCanvasElementStore()
const emit = defineEmits(['update:modelValue', 'input', 'blur'])

// 内部内容状态
const currentContent = ref(props.modelValue)
const textareaRef = ref(null)

// 计算行数（至少为最小行数）
const computedRows = computed(() => {
  return Math.max(
      props.minRows,
      currentContent.value ? currentContent.value.split('\n').length : props.minRows
  )
})

// 合并默认样式与外部传入样式
const mergedStyle = computed(() => ({
  ...props.style,
  // 确保基础样式不被覆盖
  whiteSpace: 'nowrap',
  overflow: 'visible'
}))

// 调整宽度逻辑
const adjustWidth = () => {
  if (!textareaRef.value) return
  // 临时设置为100%获取实际宽度
  textareaRef.value.style.width = '100%'
  // 计算实际宽度（加缓冲）
  const width = textareaRef.value.scrollWidth + 10
  // 应用计算后的宽度（不小于最小宽度）
  textareaRef.value.style.width = `${Math.max(width, props.minWidth)}px`
}

// 输入事件处理
const handleInput = (e) => {
  emit('input', e)
  nextTick(adjustWidth)
}

// 失焦事件处理
const handleBlur = (e) => {
  elementStore.elMap.get(props.id).content= currentContent.value
}
const onEnter = (e) => {
  //判断同时shift+enter
  if (e.shiftKey && e.key === 'Enter') {
    console.log('textarea:shift+Enter')
  }else if (e.key === 'Enter') {
    // e.preventDefault()
    console.log('textarea:Enter pressed')
  }
}
// 监听外部内容变化
watch(
    () => props.modelValue,
    (newVal) => {
      currentContent.value = newVal
      nextTick(adjustWidth);
    },
{ immediate: true } // 初始化时立即执行一次
)
// 监听内部内容变化调整宽度
watch(currentContent, () => {
  nextTick(adjustWidth)
})

// 组件挂载后初始化宽度
onMounted(() => {
  nextTick(adjustWidth)
})
</script>

<style scoped>
.text-editor {
  border: none;
  background: transparent;
  outline: none;
  resize: none;
  line-height: 1.5;
  padding: 4px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.text-editor::placeholder {
  color: #999;
  font-style: italic;
  opacity: 0.7;
}

.text-editor:focus {
  background-color: rgba(255, 255, 255, 0.95);
}
</style>
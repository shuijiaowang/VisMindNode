<template>
  <!-- 标题组件容器，使用绝对定位 -->
  <div
      class="title-component"
      :style="{
        transform: `translate(${x}px, ${y}px)`,
        fontSize: `${style.fontSize || 24}px`,
        color: style.color || '#333',
         backgroundColor: style.backgroundColor || 'transparent',
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab'
      }"
      :class="{ 'selected': isSelected }"
      @mousedown.stop="startDrag"

  >
    <!-- 可编辑的输入框，失去焦点时更新内容 -->
    <textarea
        v-model="currentContent"
        @blur="handleBlur"
        @input="adjustWidth"
        ref="textInput"
        class="text-input"
        @mousedown.stop
        :placeholder="content || '双击6'"
        :rows="Math.max(1, currentContent.split('\n').length)"
        :cols="currentContent.split('\n')[0].length + 2"
        wrap="off"
        autocomplete="off"
        spellcheck="false"
    />
  </div>
</template>

<script setup>
import {computed, defineEmits, defineProps, nextTick, onMounted, ref, watch} from 'vue'
import {useCanvasStore} from "@/stores/canvasStore.js";
const canvasStore = useCanvasStore()
import { useDraggable } from '@/composables/useDraggable.js'

// 接收从父组件传来的属性
const props = defineProps({
  // 标题的唯一标识
  id: {
    type: String,
    required: true
  },
  // X坐标
  x: {
    type: Number,
    required: true
  },
  // Y坐标
  y: {
    type: Number,
    required: true
  },
  // 标题内容
  content: {
    type: String,
    default: '双击编辑标题'
  },
  style: {
    type: Object,
    default: () => ({}) // 默认空对象
  }
})

// 本地内容变量，用于双向绑定
const currentContent = ref(props.content)
// 输入框引用，用于聚焦
const textInput = ref(null)
const isSelected = computed(() => {
  return canvasStore.selectedElementIds.has(props.id);
});

// 定义要触发的事件
const emit = defineEmits(['update:content'])

// 初始化拖拽逻辑（指定组件类型为title）
const { isDragging, startDrag } = useDraggable(
    'title',
    props.id,
    props.x,
    props.y
)
// 调整文本框宽度以适应内容
const adjustWidth = () => {
  if (textInput.value) {
    // 临时设置为auto获取实际宽度
    textInput.value.style.width = '100%'
    // 加上一些额外宽度作为缓冲
    const width = textInput.value.scrollWidth + 10
    // 确保不小于最小宽度
    textInput.value.style.width = `${Math.max(width, 50)}px`
  }
}

// 监听内容变化调整宽度
watch(currentContent, () => {
  nextTick(adjustWidth)
})

const handleBlur = () => {
  emit('update:content', currentContent.value)
}

// 组件挂载后初始化宽度
onMounted(() => {
  nextTick(adjustWidth)
})
</script>

<style scoped>
.title-component {
  padding: 8px;
  border-radius: 4px;
  border: #42b983  solid 1px;
  /*transition: all 0.2s; 会导致拖拽卡顿*/
}
.title-component:hover {
  border-color: #ddd;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 25px;
}

.title-component.dragging {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #42b983;
}
.text-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: inherit;
  color: inherit;
  resize: none;
  line-height: 1.5;
  padding: 4px 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  white-space: nowrap; /* 禁止自动换行 */
  overflow: visible; /* 允许内容溢出显示 */
}

.text-input::placeholder {
  color: #999;
  font-style: italic;
  opacity: 0.7;
}

.text-input:focus {
  background-color: rgba(255, 255, 255, 0.95);
}
</style>
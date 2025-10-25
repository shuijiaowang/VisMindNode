<template>
  <div
      class="text-component"
      :style="{
        transform: `translate(${x}px, ${y}px)`,
        fontSize: `${style.fontSize || '16px'}`,
        color: style.color || '#333',
        backgroundColor: style.backgroundColor || 'transparent',
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab'
      }"
      :class="{ 'selected': isSelected, 'dragging': isDragging }"
      @mousedown.stop="startDrag"
      @dblclick="handleDblClick"
  >
    <textarea
        v-model="currentContent"
        @blur="handleBlur"
        @input="adjustWidth"
        ref="textInput"
        class="text-input"
        @mousedown.stop
        :placeholder="content || '双击添加文本'"
        :rows="Math.max(1, currentContent.split('\n').length)"
        wrap="off"
    />
  </div>
</template>

<script setup>
// 保持原有逻辑不变
import {computed, ref, nextTick, watch, onMounted} from "vue";
import {useDraggable} from "@/composables/useDraggable.js";
import {useCanvasStore} from "@/stores/canvasStore.js";
const canvasStore = useCanvasStore()

const props = defineProps({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  content: { type: String, default: '' },
  style: { type: Object, default: () => ({}) }
})

const currentContent = ref(props.content)
const textInput = ref(null)
const isSelected = computed(() => canvasStore.selectedElementIds.has(props.id))
const emit = defineEmits(['update:content'])

const { isDragging, startDrag } = useDraggable(
    'text',
    props.id,
    props.x,
    props.y
)

// 调整文本框宽度以适应内容
const adjustWidth = () => {
  if (textInput.value) {
    // 临时设置为auto获取实际宽度
    textInput.value.style.width = 'auto'
    // 加上一些额外宽度作为缓冲
    const width = textInput.value.scrollWidth + 10
    // 确保不小于最小宽度
    textInput.value.style.width = `${Math.max(width, 100)}px`
  }
}

// 监听内容变化调整宽度
watch(currentContent, () => {
  nextTick(adjustWidth)
})

const handleBlur = () => {
  emit('update:content', currentContent.value)
}

const handleDblClick = () => {
  nextTick(() => {
    textInput.value?.focus()
    adjustWidth() // 聚焦时调整一次宽度
  })
}

// 组件挂载后初始化宽度
onMounted(() => {
  nextTick(adjustWidth)
})
</script>

<style scoped>
.text-component {
  padding: 25px 6px 6px 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
  width: auto; /* 让父容器宽度自适应内容 */
  min-width: 100px; /* 调整最小宽度为更合理的值 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  /* 移除overflow限制，允许内容撑开宽度 */
}

.text-component:hover {
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.text-component.selected {
  outline: 2px solid #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
  background-color: white;
}

.text-component.dragging {
  opacity: 0.85;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
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
  min-width: 100px; /* 最小宽度 */
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
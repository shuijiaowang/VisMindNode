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
      @click.stop="handleClick"
      @mousedown.stop
      @mousedown="startDrag"
      v-if="canvasStore.visibleTitleIds.includes(id)"

  >
    <!-- 拖拽手柄 -->
    <div class="drag-handle" @mousedown.stop="startDrag">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="9" x2="19" y2="9"></line>
        <line x1="5" y1="15" x2="19" y2="15"></line>
      </svg>
    </div>
    <!-- 可编辑的输入框，失去焦点时更新内容 -->
    <input
        v-model="currentContent"
        type="text"
        @blur="handleBlur"
        ref="titleInput"
        class="title-input"
        @mousedown.stop
        :placeholder="content || '双击编辑标题'"
    >
  </div>
</template>

<script setup>
import {computed, defineEmits, defineProps, nextTick, onMounted, ref} from 'vue'
import {useCanvasStore} from "@/stores/canvasStore.js";
const canvasStore = useCanvasStore()
import { useDraggable } from '@/composables/useDraggable.js'
const title = computed(() => canvasStore.titles.get(props.id));
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
const handleClick = (e) => {
  canvasStore.toggleElementSelection(props.id, e.ctrlKey || e.metaKey);
};

// 定义要触发的事件
const emit = defineEmits(['update:content'])

// 本地内容变量，用于双向绑定
const currentContent = ref(props.content)

// 输入框引用，用于聚焦
const titleInput = ref(null)

// 初始化拖拽逻辑（指定组件类型为title）
const { isDragging, startDrag, onDrag, endDrag } = useDraggable(
    'title',
    props.id,
    props.x,
    props.y
)

// 2. 新增：样式编辑方法（示例：点击标题显示样式面板） //这种可以单独在页面工具栏中进行修改？/可能还需要一个单独的输入框组件复用，负责输入文字
const showStylePanel = () => {
  // 实际项目中可替换为弹出样式编辑面板
  const newFontSize = prompt('设置字体大小(px)', props.style.fontSize)
  if (newFontSize) {
    // 调用store方法更新样式
    canvasStore.updateTitleStyle(props.id, { fontSize: Number(newFontSize) })
  }
}

// 当组件挂载后自动聚焦
onMounted(() => {
  // 确保DOM已渲染，再执行聚焦
  // nextTick(() => {
  //   if (titleInput.value) {
  //     titleInput.value.focus()
  //   }
  // })
})

// 失去焦点时更新内容
const handleBlur = () => {
  emit('update:content', currentContent.value)
}
</script>

<style scoped>
.title-component {
  padding: 8px;
  border-radius: 4px;
  /*transition: all 0.2s; 会导致拖拽卡顿*/
}
.title-component:hover {
  border-color: #ddd;
  background-color: rgba(255, 255, 255, 0.7);
}

.title-component.dragging {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #42b983;
}
.drag-handle {
  display: inline-block;
  margin-right: 8px;
  color: #999;
  cursor: move;
  vertical-align: middle;
  opacity: 0.7;
}

.title-input {
  border: none;
  background: transparent;
  outline: none;
  padding: 4px 8px;
  min-width: 200px;
  font-weight: bold;
  vertical-align: middle;
  border: #42b983 1px solid;
}

.title-input:focus {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 2px;
}
.title-component.selected {
  outline: 2px solid #42b983; /* Vue品牌色作为选中高亮 */
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.3);
}
</style>
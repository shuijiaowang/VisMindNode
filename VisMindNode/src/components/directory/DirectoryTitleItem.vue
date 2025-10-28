<!-- DirectoryTitleItem.vue -->
<template>
  <div class="directory-title-item"

  >
    <!-- 标题行（包含缩进、按钮、内容、操作按钮） -->
    <div class="title-row">
      <!-- 缩进线 -->
      <div class="indent-guide" :style="{ width: `${level * 24}px` }"></div>

      <!-- 新增：可点击和拖拽的圆点 -->
      <div
          class="drag-dot"
          @click.stop="handleDotClick"
          @dragstart.stop="handleDragStart"
          @dragend.stop="handleDragEnd"
          @dragover.stop="handleDragOver"
          @dragleave.stop="handleDragLeave"
          draggable="true"
      ></div>
      <!-- 展开/折叠按钮 -->
      <button
          v-if="hasChildren"
          class="expand-btn"
          @click.stop="toggleExpand"
      >
        {{ element.isExpanded ? '−' : '+' }}
      </button>

      <!-- 标题内容 -->
      <div
          class="title-content"
          :class="{ 'selected': isSelected }"
          @click.stop="handleClick"
          @dblclick.stop="handleDbClick"
      >
        <TextEditor
            :id="props.id"
            v-model="elementStore.elMap.get(props.id).content"
            @keyup.enter="handleEnter"
            ref="editInput"
            :minWidth="100"
            :minRows="1"
            :style="{ fontSize: '14px', color: '#333' }"
            placeholder="请输入标题"
        />
      </div>

      <!-- 功能按钮组 -->
      <div class="title-actions">
        <button @click.stop="addChild">+</button>
      </div>
    </div>

    <!-- 拖拽提示线 -->
    <div
        v-if="dragIndicator === 'top'"
        class="drag-indicator top"
    ></div>
    <div
        v-if="dragIndicator === 'bottom'"
        class="drag-indicator bottom"
    ></div>
    <div
        v-if="dragIndicator === 'child'"
        class="drag-indicator child"
    ></div>
    <!-- 子元素容器（必须在标题行下方，单独占一行） -->
    <div v-if="element.isExpanded && hasChildren" class="children-container">
      <DirectoryTitleItem
          v-for="childId in element.children"
          :key="childId"
          :id="childId"
          :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useCanvasElementStore } from '@/stores/canvasElementStore'
import { useCanvasViewStore } from '@/stores/canvasViewStore'
import TextEditor from '@/components/canvas/TextEditor.vue'
import {useCanvasStore} from "@/stores/canvasStore.js";  // 引入TextEditor组件

const props = defineProps({
  id: { type: String, required: true },
  level: { type: Number, default: 0 },
})

const elementStore = useCanvasElementStore()
const viewStore = useCanvasViewStore()
const canvasStore=useCanvasStore()
const element = computed(() => elementStore.elMap.get(props.id))
const hasChildren = computed(() => element.value?.children?.length > 0)
const editInput = ref(null)  // 指向TextEditor组件

// 选中状态（当前操作的标题）
const isSelected = computed(() =>
    elementStore.selectedDirTitleId === props.id
)

// 切换展开/折叠
const toggleExpand = () => {
  const newState = !element.value.isExpanded
  elementStore.updateElement(props.id, { isExpanded: newState })
  emit('toggle-expand', props.id, newState)
}

const handleClick = (e) => {
  const isCtrl = e.ctrlKey || e.metaKey
  //点击会跳转到画布
}

// 双击选中
const handleDbClick = () => {
  elementStore.selectedDirTitleId = props.id
}

const handleEnter=(e)=>{
  //如果是shift+enter，会是创建一个新的标题
  //但是textarea中两种回车都是换行
  console.log("item：回车事件")
}

// 新增子标题
const addChild = () => {
  const { x, y } = element.value
  // 在画布上创建子标题（位置基于父标题偏移）
  const childId = elementStore.createTitle(x + 40, y + 60, '新子标题')
  // 建立父子关系
  elementStore.addChild(props.id, childId)
}
// 圆点点击事件
const handleDotClick = (e) => {
  console.log('圆点被点击', '元素ID:', props.id)
  // 可添加自定义逻辑：如选中元素、显示上下文菜单等
}

// 新增：拖拽状态管理
const dragIndicator = ref(null) // 可能的值: 'top', 'bottom', 'child', null
const draggedItemId = ref(null)

// 拖拽开始事件
const handleDragStart = (e) => {
  e.stopPropagation();
  if(canvasStore.dragType!==null) return
  canvasStore.setDragType('directory'); // 标记为目录拖拽
  console.log('开始拖拽', '元素ID:', props.id)
  // 存储拖拽的元素ID，供拖拽结束时使用
  e.dataTransfer.setData('text/plain', props.id)
  // 可添加拖拽样式（如半透明）
  e.target.classList.add('dragging')
}
// 处理拖拽经过事件
const handleDragOver = (e) => {
  e.preventDefault() // 允许放置
  draggedItemId.value = e.dataTransfer.getData('text/plain')
  // 避免自己拖自己
  if (draggedItemId.value === props.id) {
    dragIndicator.value = null
    return
  }

  // 获取当前元素的位置信息
  const rect = e.currentTarget.getBoundingClientRect()
  const itemHeight = rect.height
  const relativeY = e.clientY - rect.top // 鼠标在当前项内的Y坐标

  // 计算位置比例（0-1）
  const positionRatio = relativeY / itemHeight

  // 判断提示类型
  if (positionRatio < 0.3) {
    // 上半部分 - 显示顶部提示线（插入到当前项上方，同级）
    dragIndicator.value = 'top'
  } else if (positionRatio > 0.7) {
    // 下半部分 - 显示底部提示线（插入到当前项下方，同级）
    dragIndicator.value = 'bottom'
  } else {
    // 中间部分 - 显示子项提示线（作为当前项的子项）
    dragIndicator.value = 'child'
  }
}
// 处理拖拽离开事件
const handleDragLeave = (e) => {
  // 检查鼠标是否真的离开当前元素
  const relatedTarget = e.relatedTarget
  if (!e.currentTarget.contains(relatedTarget)) {
    dragIndicator.value = null
  }
}

// 修改拖拽结束事件
const handleDragEnd = (e) => {
  if (canvasStore.dragType === 'directory') {
    canvasStore.setDragType(null); // 重置拖拽类型
  }
  console.log('结束拖拽', '元素ID:', props.id)
  e.target.classList.remove('dragging')

  // 如果有拖拽目标和提示位置，则执行相应操作
  if (draggedItemId.value && dragIndicator.value) {
    const targetId = props.id
    const sourceId = draggedItemId.value

    // 根据提示类型执行不同的移动操作
    switch(dragIndicator.value) {
      case 'top':
        elementStore.moveBefore(sourceId, targetId)
        break
      case 'bottom':
        elementStore.moveAfter(sourceId, targetId)
        break
      case 'child':
        elementStore.moveAsChild(sourceId, targetId)
        break
    }
  }
  // 重置拖拽状态
  dragIndicator.value = null
  draggedItemId.value = null
}

</script>

<style scoped>
/* 保持原有样式不变 */
.directory-title-item {
  display: flex;
  flex-direction: column; /* 垂直布局，子元素容器在下方 */
  padding: 2px 0; /* 仅上下留白，避免左右干扰 */
}
/* 标题行：水平排列（缩进 + 按钮 + 内容 + 操作） */
.title-row {
  display: flex;
  align-items: center;
  height: 32px; /* 固定行高，确保对齐 */
  gap: 4px; /* 内部元素间距统一 */
}
.indent-guide {
  height: 100%; /* 与行高一致 */
  border-left: 1px dashed #d0d0d0; /* 层级虚线 */
  margin-left: 4px;
}

/* 展开/折叠按钮：固定尺寸 */
.expand-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 标题内容：自适应宽度 */
.title-content {
  flex: 1; /* 占满剩余宽度 */
  padding: 4px 8px;
  border-radius: 4px;
  min-height: 24px;
}

.title-content.selected {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.title-content.active-parent {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
}

/* 操作按钮组：靠右显示 */
.title-actions {
  display: flex;
  gap: 4px;
  margin-right: 8px;
}
.title-actions button {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
}

.title-actions button:hover {
  background-color: #f0f0f0;
}
/* 子标题容器 */
/* 子元素容器：关键缩进样式 */
.children-container {
  margin-left: 24px; /* 固定缩进量（与 level * 24px 对应） */
  margin-top: 2px; /* 与父标题行保持微小间距 */
  width: calc(100% - 24px); /* 避免超出父容器 */
}

/* 圆点样式 */
.drag-dot {
  height: 8px;
  border-radius: 50%; /* 圆形 */
  background-color: #999; /* 默认灰色 */
  cursor: grab; /* 抓手图标，表示可拖拽 */
  margin: 0 4px; /* 与左右元素保持间距 */
  z-index: 10;
  width: 8px;
  min-width: 8px;
  cursor: default;
}

/* 鼠标悬停时变色 */
.drag-dot:hover {
  background-color: #666;
  cursor: default;
}

/* 拖拽过程中样式 */
.drag-dot.dragging {
  background-color: #333;
   /* 拖拽中图标 */
  opacity: 0.7;
}

/* 选中状态时圆点变色（与标题选中样式呼应） */
.title-content.selected + .expand-btn + .drag-dot,
.title-content.selected ~ .drag-dot {
  /* 若圆点在标题内容前，可调整选择器 */
  background-color: #1890ff; /* 与选中背景色呼应的蓝色 */
}
</style>
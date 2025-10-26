<!-- DirectoryTitleItem.vue -->
<template>
  <div class="directory-title-item">
    <!-- 缩进线（视觉层级标识） -->
    <div class="indent-guide" :style="{ width: `${level * 20}px` }"></div>

    <!-- 展开/折叠按钮 -->
    <button
        v-if="hasChildren"
        class="expand-btn"
        @click.stop="toggleExpand"
    >
      {{ element.isExpanded ? '−' : '+' }}
    </button>
<!--    添加一个圆点，可以拖拽和点击-->

    <!-- 标题内容（可编辑） -->
    <div
        class="title-content"
        :class="{
        'selected': isSelected,
        'active-parent': isActiveParent
      }"
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

    <!-- 递归渲染子标题 -->
<!--    <div v-if="element.isExpanded && hasChildren" class="children-container">-->
<!--      <DirectoryTitleItem-->
<!--          v-for="childId in element.children"-->
<!--          :key="childId"-->
<!--          :id="childId"-->
<!--          :level="level + 1"-->
<!--          @toggle-expand="handleExpand"-->
<!--      />-->
<!--    </div>-->
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useCanvasElementStore } from '@/stores/canvasElementStore'
import { useCanvasViewStore } from '@/stores/canvasViewStore'
import TextEditor from '@/components/canvas/TextEditor.vue'  // 引入TextEditor组件

const props = defineProps({
  id: { type: String, required: true },
  level: { type: Number, default: 0 },
})

const elementStore = useCanvasElementStore()
const viewStore = useCanvasViewStore()
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
  //先不写
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

defineEmits(['toggle-expand'])

</script>

<style scoped>
/* 保持原有样式不变 */
.directory-title-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
}

.indent-guide {
  height: 24px;
  display: inline-block;
}

.expand-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  padding: 0;
}

.title-content {
  flex: 1;
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

.title-actions {
  display: flex;
  gap: 4px;
}

.title-actions button {
  border: none;
  background: transparent;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-actions button:hover {
  background-color: #f5f5f5;
}

.children-container {
  margin-left: 20px;
}
</style>
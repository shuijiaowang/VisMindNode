<template>
  <!-- 标题组件容器，使用绝对定位 -->
  <div
      class="title-component"
      :style="{
      left: `${x}px`,  // 基于画布的X坐标
      top: `${y}px`,   // 基于画布的Y坐标
      fontSize: '24px',
      position: 'absolute',
      transform: 'translate(-50%, -50%)'  // 新增：让元素中心对准(x,y)
    }"
  >
    <!-- 可编辑的输入框，失去焦点时更新内容 -->
    <input
        v-model="currentContent"
        type="text"
        @blur="handleBlur"
        ref="titleInput"
    class="title-input"
    >
  </div>
</template>

<script setup>
import {ref, onMounted, defineProps, defineEmits, nextTick} from 'vue'

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
  }
})

// 定义要触发的事件
const emit = defineEmits(['update:content'])

// 本地内容变量，用于双向绑定
const currentContent = ref(props.content)

// 输入框引用，用于聚焦
const titleInput = ref(null)

// 当组件挂载后自动聚焦
onMounted(() => {
  // 确保DOM已渲染，再执行聚焦
  nextTick(() => {
    if (titleInput.value) {
      titleInput.value.focus()
    }
  })
})

// 失去焦点时更新内容
const handleBlur = () => {
  emit('update:content', currentContent.value)
}
</script>

<style scoped>
.title-input {
  border: none;
  background: transparent;
  font-size: 24px;
  outline: none;
  padding: 4px 8px;
  min-width: 200px;
}

.title-input:focus {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}
</style>
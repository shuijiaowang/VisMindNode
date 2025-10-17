<!-- CanvasContent.vue -->
<template>
  <div class="infinite-canvas"
       :style="{
         transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`,

       }"
       @dblclick="handleDblClick"
  >
    这是画布区域（可拖拽移动）
    <!-- 临时标记逻辑原点(0,0)位置 -->
    <div class="origin-marker">原点(0,0)</div>
    <!-- 未来可添加更多画布元素 -->
    <TitleComponent
        v-for="id in canvasStore.visibleTitleIds"
        :key="id"
        :id="id"
        :x="canvasStore.titles.find(t => t.id === id).x"
        :y="canvasStore.titles.find(t => t.id === id).y"
        :content="canvasStore.titles.find(t => t.id === id).content"
        @update:content="(content) => canvasStore.updateTitleContent(id, content)"
    />
    <!-- 新增：Markdown组件 -->
    <MarkdownComponent
        v-for="id in canvasStore.visibleMarkdownIds"
        :key="id"
        :id="id"
        :x="canvasStore.markdowns.find(m => m.id === id).x"
        :y="canvasStore.markdowns.find(m => m.id === id).y"
        :content="canvasStore.markdowns.find(m => m.id === id).content"
        @update:content="(content) => canvasStore.updateMarkdownContent(id, content)"
    />
<!--    当前是数组，遍历性能低？-->
  </div>
</template>

<script setup>
import {defineProps} from 'vue'
import {useCanvasStore} from "@/stores/canvasStore.js";
import TitleComponent from "@/components/TitleComponent.vue";
import MarkdownComponent from "@/components/MarkdownComponent.vue";

// 接收从父组件传入的偏移量和缩放值
const props = defineProps({
  offsetX: {
    type: Number,
    required: true
  },
  offsetY: {
    type: Number,
    required: true
  },
  scale: {
    type: Number,
    required: true
  }
})


const canvasStore = useCanvasStore();
// 处理双击事件
// 可以添加区分创建标题和markdown的逻辑，这里示例用ctrl+双击创建markdown
const handleDblClick = (e) => {
  if (1) {  // 按住ctrl键双击创建markdown
    console.log('创建markdown')
    canvasStore.createMarkdown(e.offsetX, e.offsetY);
  } else {  // 普通双击创建标题
    canvasStore.createTitle(e.offsetX, e.offsetY);
  }
};
</script>

<style scoped>
.infinite-canvas {
  min-width: 1000px;
  min-height: 1000px;
  border: 1px solid #ccc; /* 加个边框，更明显 */
  background-color: #fff;
  background-image: linear-gradient(#eee 1px, transparent 1px),
  linear-gradient(90deg, #eee 1px, transparent 1px);
  background-size: 20px 20px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 配合top:50%和left:50%实现居中 */
}

/* 原点标记（调试用） */
.origin-marker {
  position: absolute;
  width: 16px;
  height: 16px;
  background: red;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  z-index: 10; /* 显示在最上层 */
}
</style>
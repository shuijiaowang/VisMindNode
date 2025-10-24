<!-- CanvasContent.vue -->
<template>
  <div class="infinite-canvas"
       :style="{
         transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`,

       }"
       @dblclick="handleDblClick"
       @click="handleCanvasClick"
       @mousedown="startBoxSelect"
       @mouseleave="endBoxSelect"
  >
    这是画布区域（可拖拽移动）
    <!-- 临时标记逻辑原点(0,0)位置 -->
    <div class="origin-marker">原点(0,0)</div>
    <!-- 未来可添加更多画布元素 -->
    <TitleComponent
        v-for="id in elementStore.visibleTitleIds"
        :key="id"
        :id="id"
        :x="elementStore.elMap.get(id).x"
        :y="elementStore.elMap.get(id).y"
        :content="elementStore.elMap.get(id).content"
        :style="elementStore.elMap.get(id).style"
        @update:content="(content) => elementStore.elMap.get(id).content = content"
    />
    <!-- 新增：Markdown组件 -->
    <MarkdownComponent
        v-for="id in elementStore.visibleMarkdownIds"
        :key="id"
        :id="id"
        :x="elementStore.elMap.get(id).x"
        :y="elementStore.elMap.get(id).y"
        :content="elementStore.elMap.get(id).content"
        :style="elementStore.elMap.get(id).style"
        @update:content="(content) => elementStore.elMap.get(id).content = content"
    />
    <TextComponent
        v-for="id in elementStore.visibleTextIds"
        :key="id"
        :id="id"
        :x="elementStore.elMap.get(id).x"
        :y="elementStore.elMap.get(id).y"
        :content="elementStore.elMap.get(id).content"
        :style="elementStore.elMap.get(id).style"
        @update:content="(content) => elementStore.elMap.get(id).content = content"
    />

    <!-- 框选视觉反馈：修复视觉坐标计算 -->
    <!-- 框选视觉反馈：修复视觉坐标计算（结合画布偏移和缩放） -->
    <div
        class="box-selector"
        v-if="isBoxSelecting"
        :style="{
      // 核心修正：逻辑坐标转物理坐标时需叠加画布偏移量，并应用缩放
      left: `${(Math.min(boxRect.x1, boxRect.x2))}px`,
      top: `${(Math.min(boxRect.y1, boxRect.y2) )}px`,
      // 宽度和高度仅受缩放影响（逻辑尺寸×缩放比例）
      width: `${Math.abs(boxRect.x2 - boxRect.x1) }px`,
      height: `${Math.abs(boxRect.y2 - boxRect.y1) }px`,
    }"
    />
  </div>
</template>

<script setup>
import {defineProps, ref} from 'vue'
import {useCanvasStore} from "@/stores/canvasStore.js";
import TitleComponent from "@/components/TitleComponent.vue";
import MarkdownComponent from "@/components/MarkdownComponent.vue";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";
import TextComponent from "@/components/TextComponent.vue";
const canvasStore = useCanvasStore()
const elementStore=useCanvasElementStore()
const areaStore= useCanvasAreaStore()
const viewStore=useCanvasViewStore()
const mouseStore=  useCanvasMouseStore()
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
const handleDblClick = (e) => {
  if (1) {  // 按住ctrl键双击创建markdown
    console.log('创建markdown')
    console.log("这里是空",canvasStore.visibleMarkdownIds)
    console.log("这里有值",)
    canvasStore.createMarkdown(e.offsetX, e.offsetY);
  } else {  // 普通双击创建标题
    canvasStore.createTitle(e.offsetX, e.offsetY);
  }
};
// 处理点击事件
const handleCanvasClick = (e) => {
  if (canvasStore.isDragEvent) return
  // 只有点击画布空白区域才取消选中,操蛋，框选结束后又触发click事件给清空了
  if (e.target === e.currentTarget) {
    console.log('取消选中')
    canvasStore.clearAllSelections();
  }
};

const isBoxSelecting = ref(false);
const boxRect = ref({ x1: 0, y1: 0, x2: 0, y2: 0 });
// 开始框选
// 开始框选（修正初始坐标为逻辑坐标）
// 开始框选（修正坐标计算：加入offsetX/offsetY抵消画布平移）
const startBoxSelect = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.target === e.currentTarget) {

    e.preventDefault();
    e.stopPropagation();
    isBoxSelecting.value = true;

    // 直接使用仓库中的鼠标逻辑坐标作为起点（无需手动计算）
    boxRect.value = {
      x1: mouseStore.mousePositionInCanvas.x,
      y1: mouseStore.mousePositionInCanvas.y,
      x2: mouseStore.mousePositionInCanvas.x,
      y2: mouseStore.mousePositionInCanvas.y
    };

    console.log('开始框选√', boxRect.value)
    document.addEventListener('mousemove', onBoxSelectMove);
    document.addEventListener('mouseup', endBoxSelect);
  }
};

const onBoxSelectMove = (e) => {
  if (!isBoxSelecting.value) return;
  canvasStore.setIsDragEvent(true) //标记当前为拖拽事件
  console.log('框选中...',canvasStore.isDragEvent) //为什么是undefined

  // 直接复用仓库中的实时鼠标逻辑坐标（无需手动计算）
  boxRect.value.x2 = mouseStore.mousePositionInCanvas.x;
  boxRect.value.y2 = mouseStore.mousePositionInCanvas.y;
  console.log('框选中...', boxRect.value)
};
// 结束框选（保持逻辑不变，使用简化后的坐标）
const endBoxSelect = (e) => {
  if (!isBoxSelecting.value) return;

  document.removeEventListener('mousemove', onBoxSelectMove);
  document.removeEventListener('mouseup', endBoxSelect);
  isBoxSelecting.value = false;

  const rect = {
    minX: Math.min(boxRect.value.x1, boxRect.value.x2),
    maxX: Math.max(boxRect.value.x1, boxRect.value.x2),
    minY: Math.min(boxRect.value.y1, boxRect.value.y2),
    maxY: Math.max(boxRect.value.y1, boxRect.value.y2)
  };

  const selectedIds = [];
  // 检查标题元素
  // 从所有元素中筛选出在选框内的
  elementStore.elMap.forEach((element) => {
    // 只处理标题和markdown类型
    if (element.type === 'title' || element.type === 'markdown') {
      if (isElementInRect(element, rect)) {
        selectedIds.push(element.id);
      }
    }
  });
  // 更新选中状态
  if (selectedIds.length) {
    selectedIds.forEach(id=>elementStore.selectedElementIds.add(id))
  }
  setTimeout(() => {
    canvasStore.setIsDragEvent(false) // 重置store标记
  }, 100)
};

// 辅助函数：判断元素是否在选框内（保持范围判断）
const isElementInRect = (element, rect) => {
  // 元素与选框有重叠即视为选中
  return (
      element.x < rect.maxX &&
      element.x + (element.width || 0) > rect.minX &&
      element.y < rect.maxY &&
      element.y + (element.height || 0) > rect.minY
  );
};
</script>

<style scoped>
.infinite-canvas {
  min-width: 1000000px;
  min-height: 1000000px;
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
.box-selector {
  position: absolute;
  border: 2px dashed #4096ff;
  background-color: rgba(64, 150, 255, 0.1);
  pointer-events: none; /* 避免选框遮挡鼠标事件 */
  z-index: 1000; /* 确保在所有元素上方 */
}
</style>
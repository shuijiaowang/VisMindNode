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
        v-for="id in canvasStore.visibleTitleIds"
        :key="id"
        :id="id"
        :x="canvasStore.titles.get(id).x"
        :y="canvasStore.titles.get(id).y"
        :content="canvasStore.titles.get(id).content"
        :style="canvasStore.titles.get(id).style"
        @update:content="(content) => canvasStore.updateTitleContent(id, content)"
    />
    <!-- 新增：Markdown组件 -->
    <MarkdownComponent
        v-for="id in canvasStore.visibleMarkdownIds"
        :key="id"
        :id="id"
        :x="canvasStore.markdowns.get(id).x"
        :y="canvasStore.markdowns.get(id).y"
        :content="canvasStore.markdowns.get(id).content"
        :style="canvasStore.markdowns.get(id).style"
        @update:content="(content) => canvasStore.updateMarkdownContent(id, content)"
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
const handleCanvasClick = (e) => {
  // 只有点击画布空白区域才取消选中
  if (e.target === e.currentTarget) {
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
    e.stopPropagation(); //不是阻止冒泡了吗，为什么控制台会一直打印ctrl为什么不走这里？ d2914534-5559-47da-a134-0b5b174964a4
    isBoxSelecting.value = true;

    // 直接使用鼠标在画布上的偏移坐标
    boxRect.value = {
      x1: e.offsetX,
      y1: e.offsetY,
      x2: e.offsetX,
      y2: e.offsetY
    };

    console.log('开始框选√', boxRect.value)
    document.addEventListener('mousemove', onBoxSelectMove);
    document.addEventListener('mouseup', endBoxSelect);
  }
};

const onBoxSelectMove = (e) => {
  if (!isBoxSelecting.value) return;

  const canvasEl = document.querySelector('.infinite-canvas');
  if (!canvasEl) return;

  // 1. 获取画布元素的位置和尺寸（视口坐标系）
  const rect = canvasEl.getBoundingClientRect();
  // 2. 画布自身的逻辑尺寸（固定值，从canvasSize获取或直接读取）
  const canvasWidth = canvasEl.offsetWidth;
  const canvasHeight = canvasEl.offsetHeight;
  // 3. 画布的逻辑中心（固定不变，以画布自身中心为原点参考）
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  // 4. 计算鼠标在画布元素内的物理坐标（相对于画布左上角的屏幕坐标）
  const mouseXInElement = e.clientX - rect.left;
  const mouseYInElement = e.clientY - rect.top;

  // 5. 核心转换：物理坐标 -> 画布逻辑坐标
  // 公式参考：逻辑坐标 = 画布中心 + (物理坐标 - 画布视觉中心) / 缩放比例
  // 画布视觉中心 = 画布元素尺寸的一半（因为画布本身居中显示）
  const canvasVisualCenterX = rect.width / 2;
  const canvasVisualCenterY = rect.height / 2;

  const canvasX = canvasCenterX + (mouseXInElement - canvasVisualCenterX - canvasStore.offsetX) / canvasStore.scale;
  const canvasY = canvasCenterY + (mouseYInElement - canvasVisualCenterY - canvasStore.offsetY) / canvasStore.scale;

  // 更新框选终点坐标（逻辑坐标）
  boxRect.value.x2 = canvasX;
  boxRect.value.y2 = canvasY;
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
  canvasStore.titles.forEach((title) => {
    if (isElementInRect(title, rect)) {
      selectedIds.push(title.id);
    }
  });
  // 检查文档元素
  canvasStore.markdowns.forEach((markdown) => {
    if (isElementInRect(markdown, rect)) {
      selectedIds.push(markdown.id);
    }
  });
  // 更新选中状态
  if (selectedIds.length) {
    // console.log('ok,选中元素：', selectedIds)
    // if (e.ctrlKey || e.metaKey) {
    //   console.log('ok,ctrl+框选')
    //   selectedIds.forEach(id => canvasStore.toggleElementSelection(id, true));
    // } else {
    //   // canvasStore.clearAllSelections();
    //   selectedIds.forEach(id => canvasStore.toggleElementSelection(id, true));
    // }
    // 关键：批量处理，只创建一次新 Set
    const newSelected = new Set(canvasStore.selectedElementIds.value);

    if (e.ctrlKey || e.metaKey) {
      console.log('ok,ctrl+框选')
      // Ctrl 模式：添加所有框选元素
      selectedIds.forEach(id => newSelected.add(id));
    } else {
      // 非 Ctrl 模式：替换为框选元素
      newSelected.clear();
      selectedIds.forEach(id => newSelected.add(id));
    }

    // 只更新一次
    selectedElementIds.value = newSelected;
  }
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
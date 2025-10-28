<template>
  <!-- 最外层容器：负责监听拖拽事件和提供视图区域 -->
  <div class="canvas-view-wrapper"
       @mousedown="startDrag"
       @mousemove="onDrag"
       @mouseup="endDrag"
       @mouseleave="endDrag"
       @wheel.passive="handleZoom"
  >
    <!-- 无穷画布区域：基于逻辑原点定位，受偏移量控制 -->
    <CanvasContent
        :offsetX="offsetX"
        :offsetY="offsetY"
        :scale="scale"
    />
    <div class="toolbar">
      <BottomToolbar/>
    </div>
    <!-- 数据看板 -->
    <div class="log">
      <DataDashboard />
    </div>
    <DirectoryView/>

  </div>

</template>

<script setup>
// 导入必要的工具
import {onMounted, onUnmounted, ref, toRefs} from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'
import CanvasContent from "@/components/CanvasContent.vue";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";
import DataDashboard from "@/components/canvasExtras/DataDashboard.vue";
import BottomToolbar from "@/components/canvasExtras/BottomToolbar.vue";
import DirectoryView from "@/components/directory/DirectoryView.vue";

// 获取画布全局状态（偏移量和缩放）
const canvasStore = useCanvasStore()
const elementStore=useCanvasElementStore()
const areaStore= useCanvasAreaStore()
const viewStore=useCanvasViewStore()
const mouseStore=  useCanvasMouseStore()

const { offsetX, offsetY, scale } =toRefs(viewStore)


//-----------------------------拖拽位移事件处理----------------------------
//拖拽坐标管理
let dragX = 0, dragY = 0
const startPos = ref({ x: 0, y: 0 }) // 记录鼠标刚按下时的位置（用来计算移动了多少距离）

// 鼠标按下：开始拖拽
function startDrag(e) {
  if (e.target.classList.contains('infinite-canvas')){
    if (canvasStore.dragType !== null) return;
    canvasStore.setDragType('canvas'); // 标记为画布拖拽
    // 记录初始位置（减去当前偏移量，避免拖拽起点跳变）
    startPos.value.x = e.clientX - offsetX.value
    startPos.value.y = e.clientY - offsetY.value
  }
}

// 鼠标移动：更新偏移量（实现拖拽）
function onDrag(e) {
  // console.log("??????????,这里会一直执行")
  if (canvasStore.dragType === 'canvas') {
    // 计算新的偏移量（当前鼠标位置 - 初始位置）
    dragX = e.clientX - startPos.value.x
    dragY = e.clientY - startPos.value.y
    //帧节流更新
    requestAnimationFrame(updatePosition)
  }

}
function updatePosition() {
  offsetX.value = dragX
  offsetY.value = dragY
}
// 鼠标松开/离开：结束拖拽
function endDrag() {
  if (canvasStore.dragType === 'canvas') {
    canvasStore.setDragType(null); // 重置拖拽类型
  }
}
// ----------------------------鼠标滚轮缩放事件处理----------------------------
function handleZoom(e) {
  // e.preventDefault(); // 必须阻止默认行为，否则会影响拖拽？？好像没啥影响
  //现在还能边拖拽边缩放
  const zoomSpeed = 0.1;
  let newScale = scale.value;
  if (e.deltaY < 0) {
    newScale *= (1 + zoomSpeed);
  } else {
    newScale /= (1 + zoomSpeed);
  }
  const minScale = 0.1;
  const maxScale = 5;
  newScale = Math.min(Math.max(newScale, minScale), maxScale);

  const container = e.currentTarget;
  const rect = container.getBoundingClientRect();
  const mouseXInContainer = e.clientX - rect.left;
  const mouseYInContainer = e.clientY - rect.top;

  // 关键修正：用容器实际宽高计算中心（代替硬编码的300）
  const centerX = rect.width / 2;  // 容器真实宽度的一半
  const centerY = rect.height / 2; // 容器真实高度的一半
  const mouseXOnCanvasBefore = (mouseXInContainer - centerX - offsetX.value) / scale.value;
  const mouseYOnCanvasBefore = (mouseYInContainer - centerY - offsetY.value) / scale.value;
  scale.value = newScale;
  // 调整偏移量时也用真实中心
  offsetX.value = mouseXInContainer - centerX - mouseXOnCanvasBefore * newScale;
  offsetY.value = mouseYInContainer - centerY - mouseYOnCanvasBefore * newScale;
}
const handleKeyDown = (e) => {
  // 仅在按下Delete键且有选中元素时执行
  if (e.key === 'Delete' && canvasStore.selectedElementIds.size > 0) {
    elementStore.deleteSelectedElements();
  }
};
onMounted(() => {
  // 监听全局键盘事件
  window.addEventListener('keydown', handleKeyDown);
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

</script>

<style scoped>
/* 最外层容器：占满整个浏览器窗口 */
.canvas-view-wrapper {
  width: 100vw; /* 宽度=屏幕宽度 */
  height: 100vh; /* 高度=屏幕高度 */
  background-color: lightskyblue; /* 浅灰色背景，一眼就能看到 */
  overflow: hidden; /* 超出部分隐藏（以后平移会用到，先加上） */
  position: relative; /* 必须加这个，否则内部画布的位置会乱掉 */
  cursor: grab; /* 鼠标放上去显示“可抓取”的图标 */
  background-image: linear-gradient(#eee 1px, transparent 1px),
  linear-gradient(90deg, #eee 1px, transparent 1px);
  background-size: 30px 30px;
}

/* 拖拽时的鼠标样式 */
.canvas-view-wrapper:active {
  cursor: grabbing; /* 拖拽中手势 */
}

/* 内部画布区域：暂时给个固定大小，方便看到 */

.toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
/* 数据看板样式 */
.log {
  position: fixed;
  top: 10px; /* 位于工具栏上方 */
  left: 5%;
  z-index: 100;
}
</style>
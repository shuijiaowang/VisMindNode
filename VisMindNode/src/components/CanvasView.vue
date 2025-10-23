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
          <button @click="createNewTitle">新建标题</button>
          <button @click="createNewMarkdown">新建文档</button>
          <button @click="resetView">重置视图</button>
          <button @click="clearAllData">删除所有数据</button>
          <button @click="elementStore.generateTestComponents()">压力测试</button>
          <button @click="zoomIn">放大</button>
          <button @click="zoomOut">缩小</button>
          <span class="zoom-level">{{ (scale * 100).toFixed(0) }}%</span>
        </div>
        <!-- 数据看板 -->
        <div class="log">
          <div>偏移X: {{ viewStore.offsetX.toFixed(2) }}px</div>
          <div>偏移Y: {{ viewStore.offsetY.toFixed(2) }}px</div>
          <div>缩放: {{ (viewStore.scale * 100).toFixed(0) }}%</div>
          <div style="flex: 0 0 100%; height: 1px; background: #eee; margin: 5px 0;"></div>
          <div>视图中心X: {{ areaStore.windowCenterInCanvas.x.toFixed(2) }}</div>
          <div>视图中心Y: {{ areaStore.windowCenterInCanvas.y.toFixed(2) }}</div>
          <div>鼠标X: {{ mouseStore.mouseClientX.toFixed(2) }}</div>
          <div>鼠标Y: {{ mouseStore.mouseClientY.toFixed(2) }}</div>

          <div>鼠标在画布X: {{ mouseStore.mousePositionInCanvas?.x.toFixed(2) }}</div>
          <div>鼠标在画布Y: {{ mouseStore.mousePositionInCanvas?.y.toFixed(2) }}</div>

          <div style="flex: 0 0 100%; height: 1px; background: #eee; margin: 5px 0;"></div>
          <div>左边界: {{ areaStore.visibleAreaInCanvasBounds.minX.toFixed(2) }}</div>
          <div>右边界: {{ areaStore.visibleAreaInCanvasBounds.maxX.toFixed(2) }}</div>
          <div>上边界: {{ areaStore.visibleAreaInCanvasBounds.minY.toFixed(2) }}</div>
          <div>下边界: {{ areaStore.visibleAreaInCanvasBounds.maxY.toFixed(2) }}</div>
          <div style="flex: 0 0 100%; height: 1px; background: #eee; margin: 5px 0;"></div>
          <div v-if="areaStore.preloadAreaInCanvasBounds">临时的边界:{{areaStore.preloadAreaInCanvasBounds.minX.toFixed(2)}}, {{areaStore.preloadAreaInCanvasBounds.maxX.toFixed(2)}} , {{areaStore.preloadAreaInCanvasBounds.minY.toFixed(2)}} , {{areaStore.preloadAreaInCanvasBounds.maxY.toFixed(2)}}</div>
          <div>组件数量: {{ elementStore.elMap.size}}，视图范围内组件数量{{elementStore.visibleTitleIds.length+elementStore.visibleMarkdownIds.length}}</div>

        </div>

  </div>

</template>

<script setup>
// 导入必要的工具
import {nextTick, onMounted, onUnmounted, ref, toRefs} from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'
import CanvasContent from "@/components/CanvasContent.vue";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";

// 获取画布全局状态（偏移量和缩放）
const canvasStore = useCanvasStore()
const elementStore=useCanvasElementStore()
const areaStore= useCanvasAreaStore()
const viewStore=useCanvasViewStore()
const mouseStore=  useCanvasMouseStore()

const { offsetX, offsetY, scale } =toRefs(viewStore)


// 拖拽状态管理
const isDragging = ref(false) // 是否正在拖拽
let dragX = 0, dragY = 0
const startPos = ref({ x: 0, y: 0 }) // 记录鼠标刚按下时的位置（用来计算移动了多少距离）

// 鼠标按下：开始拖拽
function startDrag(e) {

  isDragging.value = true
  // 记录初始位置（减去当前偏移量，避免拖拽起点跳变）
  startPos.value.x = e.clientX - offsetX.value
  startPos.value.y = e.clientY - offsetY.value
}

// 鼠标移动：更新偏移量（实现拖拽）
function onDrag(e) {
  if (!isDragging.value) return // 非拖拽状态不处理
  // 计算新的偏移量（当前鼠标位置 - 初始位置）
  // 只记录位置变化，不直接更新状态
  dragX = e.clientX - startPos.value.x
  dragY = e.clientY - startPos.value.y
  // offsetX.value = e.clientX - startPos.value.x
  // offsetY.value = e.clientY - startPos.value.y
  // 请求下一帧更新
  requestAnimationFrame(updatePosition)
}
function updatePosition() {
  offsetX.value = dragX
  offsetY.value = dragY
}

// 鼠标松开/离开：结束拖拽
function endDrag() {
  isDragging.value = false
}
// 新增：处理鼠标滚轮缩放
function handleZoom(e) {
  // e.preventDefault(); // 必须阻止默认行为，否则会影响拖拽

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

  // 计算鼠标在缩放前的画布逻辑坐标
  const mouseXOnCanvasBefore = (mouseXInContainer - centerX - offsetX.value) / scale.value;
  const mouseYOnCanvasBefore = (mouseYInContainer - centerY - offsetY.value) / scale.value;

  scale.value = newScale;

  // 调整偏移量时也用真实中心
  offsetX.value = mouseXInContainer - centerX - mouseXOnCanvasBefore * newScale;
  offsetY.value = mouseYInContainer - centerY - mouseYOnCanvasBefore * newScale;
}

// 放大按钮功能
function zoomIn() {
  const zoomSpeed = 0.2
  scale.value = Math.min(scale.value * (1 + zoomSpeed), 5)
}

// 缩小按钮功能
function zoomOut() {
  const zoomSpeed = 0.2
  scale.value = Math.max(scale.value / (1 + zoomSpeed), 0.1)
}

// 重置视图（回到初始位置和缩放）
// 完善重置逻辑
const resetView = async () => {
  // 重置基础状态
  offsetX.value = 0
  offsetY.value = 0
  scale.value = 1

  // 等待DOM更新完成
  await nextTick()
}

// 新增方法
const createNewTitle = () => {
  canvasStore.createTitle(canvasStore.windowCenterInCanvas.x, canvasStore.windowCenterInCanvas.y)
}

const createNewMarkdown = () => {
  // 在视图中心创建markdown
  canvasStore.createMarkdown(canvasStore.windowCenterInCanvas.x, canvasStore.windowCenterInCanvas.y)
}

// 删除所有数据
function clearAllData() {
  canvasStore.clearAllData()
}

function showLog() {
  console.log(canvasStore.components)
}
onMounted(() => {
  // 监听全局键盘事件
  const handleKeyDown = (e) => {
    // 仅在按下Delete键且有选中元素时执行
    if (e.key === 'Delete' && canvasStore.selectedElementIds.size > 0) {
      elementStore.deleteSelectedElements();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });
})


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
  font-size: 13px;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar button {
  font-size: 13px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
  /*transition: background-color 0.2s;*/
}
.toolbar button:hover {
  background-color: #359e75;
}

.zoom-level {
  align-self: center;
  color: #666;
}
/* 数据看板样式 */
.log {
  position: fixed;
  top: 10px; /* 位于工具栏上方 */
  left: 5%;
  display: flex;
  flex-wrap: wrap; /* 允许换行，避免内容溢出 */
  row-gap: 1px; /* 上下方向间距（行与行之间） */
  column-gap: 20px; /* 左右方向间距（同一行元素之间） */
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-width: 90vw; /* 限制最大宽度，避免超出屏幕 */
  font-size: 13px;
  color: #333;
}
</style>
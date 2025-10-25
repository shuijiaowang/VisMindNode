

<template>
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
</template>
<script setup>
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasStore} from "@/stores/canvasStore.js";
const canvasStore = useCanvasStore()
const elementStore=useCanvasElementStore()
const areaStore= useCanvasAreaStore()
const viewStore=useCanvasViewStore()
const mouseStore=  useCanvasMouseStore()


</script>
<style scoped>
.log{
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
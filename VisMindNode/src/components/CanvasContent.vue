<!-- CanvasContent.vue -->
<template>
  <div class="infinite-canvas"
       :style="{
         transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
         transformOrigin: 'center center'
       }"
       @dblclick="handleDblClick"
  >
    这是画布区域（可拖拽移动）
    <!-- 临时标记逻辑原点(0,0)位置 -->
    <div class="origin-marker">原点(0,0)</div>
    <!-- 未来可添加更多画布元素 -->
    <TitleComponent
        v-for="title in canvasStore.titles"
        :key="title.id"
        :id="title.id"
        :x="title.x"
        :y="title.y"
        :content="title.content"
        @update:content="(content) => canvasStore.updateTitleContent(title.id, content)"
    />
  </div>
</template>

<script setup>
import {defineProps} from 'vue'
import {useCanvasStore} from "@/stores/canvasStore.js";
import TitleComponent from "@/components/TitleComponent.vue";

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
const handleDblClick = (e) => {
  // 获取画布父容器的位置和尺寸信息（用于坐标计算）
  const parentRect = e.currentTarget.parentNode.getBoundingClientRect();

  // 1. 计算鼠标在父容器中的坐标（相对于父容器左上角）
  const mouseXInParent = e.clientX - parentRect.left;
  const mouseYInParent = e.clientY - parentRect.top;

  // 2. 计算父容器的中心坐标（因为画布默认以父容器中心为基准定位）
  const parentCenterX = parentRect.width / 2;
  const parentCenterY = parentRect.height / 2;

  // 3. 计算鼠标相对于父容器中心的偏移量
  const relativeX = mouseXInParent - parentCenterX;
  const relativeY = mouseYInParent - parentCenterY;

  // 4. 考虑缩放影响，将坐标还原到缩放前的比例
  // 避免缩放为0的情况（实际使用中scale通常会有最小值限制）
  const scaledX = relativeX / props.scale;
  const scaledY = relativeY / props.scale;

  // 5. 计算最终相对于画布逻辑原点(0,0)的坐标
  const actualX = scaledX - props.offsetX;
  const actualY = scaledY - props.offsetY;

  // 创建标题组件
  canvasStore.createTitle(actualX, actualY);
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
  transform: translate(-50%, -50%); /* 让红点中心对准(0,0) */
  top: 50%;
  left: 50%;
  z-index: 10; /* 显示在最上层 */
}
</style>
// src/stores/canvasMouseStore.js
import {ref, onMounted, onUnmounted, computed, reactive, nextTick} from 'vue'
import { defineStore } from 'pinia'
import { useCanvasViewStore } from './canvasViewStore'
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";

export const useCanvasMouseStore = defineStore('canvasMouse', () => {
    const viewStore = useCanvasViewStore()
    const areaStore = useCanvasAreaStore()

    // 鼠标在视口中的坐标
    const mouseClientX = ref(0)
    const mouseClientY = ref(0)
    const canvasEl = ref(null)

    // 计算鼠标在画布中的逻辑坐标
    const mousePositionInCanvas = computed(() => {
        if (!canvasEl.value) return { x: 0, y: 0 }
        const rect = canvasEl.value.getBoundingClientRect()
        const canvasCenterX = rect.width / 2
        const canvasCenterY = rect.height / 2

        // 转换公式：画布逻辑坐标 = 窗口中心坐标 + (鼠标偏移 - 视图偏移) / 缩放
        const mouseOffsetX = mouseClientX.value - (rect.left + canvasCenterX)
        const mouseOffsetY = mouseClientY.value - (rect.top + canvasCenterY)
        return {
            x: areaStore.windowCenterInCanvas.x + mouseOffsetX / viewStore.scale,
            y: areaStore.windowCenterInCanvas.y + mouseOffsetY / viewStore.scale
        }
    })

    // 更新鼠标位置
    const updateMousePosition = (e) => {
        mouseClientX.value = e.clientX
        mouseClientY.value = e.clientY
        //console.log('鼠标移动，坐标更新：', mouseClientX.value, mouseClientY.value); // 这个是执行的
    }

    // 挂载/卸载时绑定事件
    onMounted(() => {
        nextTick(() => {
            canvasEl.value = document.querySelector('.canvas-view-wrapper')
            if (canvasEl.value) {
                canvasEl.value.addEventListener('mousemove', updateMousePosition)
                console.log('mousemove事件绑定成功', canvasEl.value)
            }
        })

    })

    onUnmounted(() => {
        if (canvasEl.value) {
            canvasEl.value.removeEventListener('mousemove', updateMousePosition)
        }
    })

    return {
        mouseClientX,
        mouseClientY,
        mousePositionInCanvas,
        updateMousePosition,
        // 提供设置canvas元素的方法
        // setCanvasEl: (el) => { canvasEl.value = el }
    }
})
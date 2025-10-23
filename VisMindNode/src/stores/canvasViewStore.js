// src/stores/canvasViewStore.js
import { ref, onMounted, onUnmounted } from 'vue'
import { defineStore } from 'pinia'

export const useCanvasViewStore = defineStore('canvasView', () => {
    // 核心视图状态,偏移量，缩放比例，画布自身尺寸，容器尺寸
    const offsetX = ref(0) // X轴偏移
    const offsetY = ref(0) // Y轴偏移
    const scale = ref(1)   // 缩放比例

    // 缓存画布的宽高，容器的宽高，用于计算，减少dom查询
    const canvasSize = ref({ width: 0, height: 0 })
    const containerSize = ref({ width: 0, height: 0 })
    // 单独缓存DOM尺寸，只在初始化和窗口变化时更新
    const updateElementSizes = () => {
        const canvas = document.querySelector('.infinite-canvas')
        const container = document.querySelector('.canvas-view-wrapper')
        if (canvas) {
            canvasSize.value.width = canvas.offsetWidth
            canvasSize.value.height = canvas.offsetHeight
        }
        if (container) {
            containerSize.value.width = container.offsetWidth || window.innerWidth
            containerSize.value.height = container.offsetHeight || window.innerHeight
        }
    }
    // 初始化时获取一次DOM元素
    onMounted(() => {
        updateElementSizes()
        // 监听窗口大小变化
        window.addEventListener('resize', updateElementSizes)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateElementSizes)
    })

    // 重置视图到初始状态（原点+1倍缩放）
    const resetView = () => {
        offsetX.value = 0
        offsetY.value = 0
        scale.value = 1
        updateElementSizes() // 重置后更新尺寸
    }

    return {
        offsetX,
        offsetY,
        scale,
        canvasSize,
        containerSize,
        updateElementSizes,
        resetView
    }
})
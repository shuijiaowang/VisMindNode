// src/stores/canvasViewStore.js
import { ref, onMounted, onUnmounted } from 'vue'
import { defineStore } from 'pinia'
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";

export const useCanvasViewStore = defineStore('canvasView', () => {

    const elementStore=useCanvasElementStore()
    // 核心视图状态,偏移量，缩放比例，画布自身尺寸，容器尺寸
    const offsetX = ref(0) // X轴偏移
    const offsetY = ref(0) // Y轴偏移
    const scale = ref(1)   // 缩放比例

    // 缓存画布的宽高，容器的宽高，用于计算，减少dom查询
    const canvasSize = ref({ width: 0, height: 0 }) //这个是画布的
    const containerSize = ref({ width: 0, height: 0 }) //这个是画布外的容器
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
    // 跳转到指定元素，在画布上居中显示
    const jumpToElement = (id, duration = 300) => {
        // 1. 获取目标元素
        const targetElement = elementStore.elMap.get(id)
        if (!targetElement) {
            console.warn(`元素 ${id} 不存在`)
            return
        }

        // 2. 计算元素中心点坐标
        const elementCenterX = targetElement.x + (targetElement.width || 0) / 2
        const elementCenterY = targetElement.y + (targetElement.height || 0) / 2
        console.log('元素中心点坐标：', elementCenterX, elementCenterY)

        // 3. 计算目标偏移量（使元素中心与窗口中心对齐）
        const containerCenterX = canvasSize.value.width / 2
        const containerCenterY = canvasSize.value.height / 2
        console.log('计算目标偏移量,怎么才tm 500？：', containerCenterX, containerCenterY)
        const targetOffsetX = (containerCenterX - elementCenterX) * scale.value
        const targetOffsetY = (containerCenterY - elementCenterY) * scale.value

        // 4. 平滑过渡到目标位置
        if (duration <= 0) {
            // 无动画直接跳转
            offsetX.value = targetOffsetX
            offsetY.value = targetOffsetY
            return
        }

        // 动画过渡（使用requestAnimationFrame实现平滑移动）
        const startX = offsetX.value
        const startY = offsetY.value
        const diffX = targetOffsetX - startX
        const diffY = targetOffsetY - startY
        const startTime = performance.now()

        const animate = (timestamp) => {
            const progress = Math.min((timestamp - startTime) / duration, 1)
            // 缓动函数（ease-out）
            const easeProgress = 1 - Math.pow(1 - progress, 3)

            offsetX.value = startX + diffX * easeProgress
            offsetY.value = startY + diffY * easeProgress

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }
        requestAnimationFrame(animate)
    }

    return {
        offsetX,
        offsetY,
        scale,
        canvasSize,
        containerSize,
        updateElementSizes,
        resetView,
        jumpToElement
    }
})
// src/stores/canvasAreaStore.js
import {ref, computed, watch, onUnmounted} from 'vue'
import { defineStore } from 'pinia'
import { useCanvasViewStore } from './canvasViewStore'
import { debounce } from 'lodash'

export const useCanvasAreaStore = defineStore('canvasArea', () => {
    const viewStore = useCanvasViewStore()

    //可视窗口所在的画布区域，默认为画布的宽高一半（-100vw/2,+100vw/2,-100vh/2,+100vh/2）,这是一个实时变化的值。
    const visibleAreaInCanvasBounds = ref({
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
    })

    // 预加载区域边界（带扩张范围），用于判断元素是否渲染（v-if）
    const preloadAreaInCanvasBounds = ref(null)
    const expandRange = 1000 // 预加载扩张范围

    //找到「窗口正中心」这个点，对应到「巨大画布」上的具体位置（画布自己的坐标系里的坐标），这个坐标将来会用来放新元素。
    const windowCenterInCanvas = computed(() => {
        const { width: canvasWidth, height: canvasHeight } = viewStore.canvasSize //画布的宽高
        if (!canvasWidth || !canvasHeight) return { x: 0, y: 0 }

        const canvasCenterX = canvasWidth / 2; // 画布自身中心X（固定逻辑值）
        const canvasCenterY = canvasHeight / 2; // 画布自身中心Y（固定逻辑值）

        // 核心修正：偏移量需除以缩放比例（因为缩放会放大偏移的视觉效果）
        return {
            x: canvasCenterX - (viewStore.offsetX / viewStore.scale),
            y: canvasCenterY - (viewStore.offsetY / viewStore.scale)
        }
    });

    // 计算可视区域和预加载区域（防抖处理），visibleAreaInCanvasBounds和preloadAreaInCanvasBounds
    const calculateVisibleArea = debounce(() => {
        const { width: canvasWidth, height: canvasHeight } = viewStore.canvasSize
        const { width: containerWidth, height: containerHeight } = viewStore.containerSize
        if (!canvasWidth || !containerWidth) return

        const canvasCenterX = canvasWidth / 2
        const canvasCenterY = canvasHeight / 2

        // 计算当前可见区域的原始范围（不含预加载），即visibleAreaInCanvasBounds的值
        const originalMinX = canvasCenterX - (containerWidth / 2 / viewStore.scale) - (viewStore.offsetX / viewStore.scale)
        const originalMaxX = canvasCenterX + (containerWidth / 2 / viewStore.scale) - (viewStore.offsetX / viewStore.scale)
        const originalMinY = canvasCenterY - (containerHeight / 2 / viewStore.scale) - (viewStore.offsetY / viewStore.scale)
        const originalMaxY = canvasCenterY + (containerHeight / 2 / viewStore.scale) - (viewStore.offsetY / viewStore.scale)

        visibleAreaInCanvasBounds.value = {
            minX: originalMinX,
            maxX: originalMaxX,
            minY: originalMinY,
            maxY: originalMaxY
        }

        // 计算预加载区域（带扩张）
        const expandBounds = {
            minX: originalMinX - expandRange,
            maxX: originalMaxX + expandRange,
            minY: originalMinY - expandRange,
            maxY: originalMaxY + expandRange
        }

        // 第一次，初始化或扩张预加载区域
        if (!preloadAreaInCanvasBounds.value) {
            preloadAreaInCanvasBounds.value = expandBounds
            return
        }
        // 第二次及以后计算：使用当前边界作为基础,如果visibleAreaInCanvasBounds的边界超出了当前边界，则更新当前边界
        let newBounds = { ...preloadAreaInCanvasBounds.value }
        let hasChange = false

        if (originalMinX < newBounds.minX) {
            newBounds.minX = expandBounds.minX
            hasChange = true
        }
        if (originalMaxX > newBounds.maxX) {
            newBounds.maxX = expandBounds.maxX
            hasChange = true
        }
        if (originalMinY < newBounds.minY) {
            newBounds.minY = expandBounds.minY
            hasChange = true
        }
        if (originalMaxY > newBounds.maxY) {
            newBounds.maxY = expandBounds.maxY
            hasChange = true
        }

        if (hasChange) {
            preloadAreaInCanvasBounds.value = newBounds
        }
    }, 50) // 防抖50ms

    // 定时收缩预加载区域（防内存溢出）
    let shrinkTimer = setInterval(() => {
        const currentVisible = visibleAreaInCanvasBounds.value
        preloadAreaInCanvasBounds.value = {
            minX: currentVisible.minX - expandRange,
            maxX: currentVisible.maxX + expandRange,
            minY: currentVisible.minY - expandRange,
            maxY: currentVisible.maxY + expandRange
        }
    }, 30 * 1000) // 30秒收缩一次，一次性收缩

    // 判断坐标是否在预加载区域内
    const isInVisibleArea = (x, y) => {
        if (!preloadAreaInCanvasBounds.value) return false
        const { minX, maxX, minY, maxY } = preloadAreaInCanvasBounds.value
        return x >= minX && x <= maxX && y >= minY && y <= maxY
    }

    // 监听视图变化（偏移/缩放/尺寸），自动更新区域
    watch(
        () => [viewStore.offsetX, viewStore.offsetY, viewStore.scale, viewStore.canvasSize, viewStore.containerSize],
        () => calculateVisibleArea(),
        { deep: true }
    )

    // // 4. 监听缩放和偏移变化，触发防抖更新
    // watch([offsetX, offsetY, scale], () => {
    //     updateVisibleArea()
    // }, {immediate: true}) // 初始化时立即计算一次

    onUnmounted(() => {
        clearInterval(shrinkTimer)
    })

    return {
        windowCenterInCanvas,
        visibleAreaInCanvasBounds,
        preloadAreaInCanvasBounds,
        calculateVisibleArea,
        isInVisibleArea
    }
})
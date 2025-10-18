// 拖拽逻辑复用函数
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore.js'

export function useDraggable(componentType, id, initialX, initialY) {
    // 获取全局状态
    const canvasStore = useCanvasStore()
    // 拖拽状态
    const isDragging = ref(false)
    // 鼠标相对于组件左上角的偏移量（解决拖拽起点跳变问题）
    let mouseOffsetX = 0
    let mouseOffsetY = 0
// 新增：获取当前最新位置的方法
    const getCurrentPosition = () => {
        if (componentType === 'title') {
            const title = canvasStore.titles.find(t => t.id === id)
            return title ? { x: title.x, y: title.y } : { x: initialX, y: initialY }
        } else if (componentType === 'markdown') {
            const markdown = canvasStore.markdowns.find(m => m.id === id)
            return markdown ? { x: markdown.x, y: markdown.y } : { x: initialX, y: initialY }
        }
        return { x: initialX, y: initialY }
    }
    // 开始拖拽（鼠标按下时）
    const startDrag = (e) => {
        // 阻止事件冒泡（避免触发画布本身的拖拽）
        e.stopPropagation()
        // 关键：阻止默认行为（如文本选择、输入框聚焦等）
        e.preventDefault()
        isDragging.value = true

        // 计算鼠标在组件内的相对位置
        // 组件当前位置是initialX/initialY，鼠标点击位置是e.clientX/e.clientY
        // 需要转换为画布坐标系（考虑画布的偏移和缩放）
        const canvas = document.querySelector('.infinite-canvas')
        const rect = canvas.getBoundingClientRect() // 画布在页面中的位置
        // 关键修改：使用当前最新位置而非初始位置
        const currentPos = getCurrentPosition()

        // 鼠标在画布坐标系中的位置 = (鼠标在页面中的位置 - 画布偏移) / 缩放比例
        const mouseXInCanvas = (e.clientX - rect.left - canvasStore.offsetX) / canvasStore.scale
        const mouseYInCanvas = (e.clientY - rect.top - canvasStore.offsetY) / canvasStore.scale

        // 计算偏移量：鼠标在组件内的点击位置 = 鼠标画布坐标 - 组件当前坐标
        // 重新计算偏移量
        mouseOffsetX = mouseXInCanvas - currentPos.x
        mouseOffsetY = mouseYInCanvas - currentPos.y
    }

    // 拖拽中（鼠标移动时）
    const onDrag = (e) => {
        if (!isDragging.value) return
        e.stopPropagation()

        // 实时计算新位置
        const canvas = document.querySelector('.infinite-canvas')
        const rect = canvas.getBoundingClientRect()
        const mouseXInCanvas = (e.clientX - rect.left - canvasStore.offsetX) / canvasStore.scale
        const mouseYInCanvas = (e.clientY - rect.top - canvasStore.offsetY) / canvasStore.scale

        // 新位置 = 鼠标当前画布坐标 - 初始偏移量（保持鼠标在组件内的相对位置不变）
        const newX = mouseXInCanvas - mouseOffsetX
        const newY = mouseYInCanvas - mouseOffsetY

        // 根据组件类型更新全局状态中的位置
        if (componentType === 'title') {
            canvasStore.updateTitlePosition(id, newX, newY)
        } else if (componentType === 'markdown') {
            canvasStore.updateMarkdownPosition(id, newX, newY)
        }
    }

    // 结束拖拽（鼠标松开时）
    const endDrag = (e) => {
        if (!isDragging.value) return
        e.stopPropagation()
        isDragging.value = false
    }

    // 返回供组件使用的方法和状态
    return {
        isDragging,
        startDrag,
        onDrag,
        endDrag
    }
}
// 拖拽逻辑复用函数
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore.js'

export function useDraggable(componentType, id, initialX, initialY) {
    // 获取全局状态
    const canvasStore = useCanvasStore()
    let canvasEl = null;
    let canvasRect = null;
    let startPositions = new Map() // 存储每个组件的初始位置

    // 拖拽状态
    const isDragging = ref(false)
    const isDragEvent = ref(false)  // 关键新增,// 新增：标记是否为拖拽事件（用于区分点击和拖拽）

    // 1. 先加一个“节流函数”：限制函数每秒最多执行N次
    function throttle(fn, delay = 16) { // 16ms ≈ 每秒60次，足够流畅
        let lastTime = 0
        return (...args) => {
            const now = Date.now()
            if (now - lastTime > delay) { // 两次执行间隔超过16ms才允许执行
                fn(...args)
                lastTime = now
            }
        }
    }
    // 开始拖拽（鼠标按下时）
    const startDrag = (e) => {
        // 阻止事件冒泡（避免触发画布本身的拖拽）
        e.stopPropagation()
        // 关键：阻止默认行为（如文本选择、输入框聚焦等）
        e.preventDefault()
        isDragging.value = true
        isDragEvent.value = true  // 开始拖拽时标记为拖拽事件
        // ... 现有逻辑 ...
        // 只在开始拖拽时查询一次画布信息
        canvasEl = document.querySelector('.infinite-canvas');
        canvasRect = canvasEl.getBoundingClientRect(); // 缓存画布在视口的位置

        // 计算鼠标在组件内的相对位置
        // 组件当前位置是initialX/initialY，鼠标点击位置是e.clientX/e.clientY
        // 需要转换为画布坐标系（考虑画布的偏移和缩放）
        // 记录每个选中组件的初始位置和鼠标偏移
        canvasStore.selectedElementIds.forEach(id => {
            const pos = canvasStore.getComponentPosition(id) // 需要实现该方法
            // 鼠标在画布坐标系中的位置 = (鼠标在页面中的位置 - 画布偏移) / 缩放比例
            const mouseXInCanvas = (e.clientX - canvasRect.left - canvasStore.offsetX) / canvasStore.scale
            const mouseYInCanvas = (e.clientY - canvasRect.top - canvasStore.offsetY) / canvasStore.scale

            startPositions.set(id, {
                initialX: pos.x,
                initialY: pos.y,
                // 计算偏移量：鼠标在组件内的点击位置 = 鼠标画布坐标 - 组件当前坐标
                // 重新计算偏移量
                offsetX: mouseXInCanvas - pos.x,
                offsetY: mouseYInCanvas - pos.y
            })
        })

        // 关键：将拖拽事件绑定到document，避免被高层级元素拦截
        document.addEventListener('mousemove', handleDragMove)
        document.addEventListener('mouseup', handleDragEnd)
    }

    // 拖拽中（提取为独立函数，绑定到document）
    const handleDragMove = throttle((e) => {
        if (!isDragging.value) return
        e.stopPropagation()
        e.preventDefault()

        const mouseXInCanvas = (e.clientX - canvasRect.left - canvasStore.offsetX) / canvasStore.scale;
        const mouseYInCanvas = (e.clientY - canvasRect.top - canvasStore.offsetY) / canvasStore.scale;

        // const newX = mouseXInCanvas - mouseOffsetX
        // const newY = mouseYInCanvas - mouseOffsetY
        //
        // if (componentType === 'title') {
        //     canvasStore.updateTitlePosition(id, newX, newY)
        // } else if (componentType === 'markdown') {
        //     canvasStore.updateMarkdownPosition(id, newX, newY)
        // }
        // 计算每个组件的位置变化
        canvasStore.selectedElementIds.forEach(id => {
            const startPos = startPositions.get(id)
            const newX = mouseXInCanvas - startPos.offsetX
            const newY = mouseYInCanvas - startPos.offsetY
            const deltaX = newX - startPos.initialX //这是啥
            const deltaY = newY - startPos.initialY

            canvasStore.updateComponentPosition(id, newX, newY) // 更新单个组件位置
        })

    })
    // 结束拖拽（提取为独立函数，绑定到document）
    const handleDragEnd = (e) => {
        if (!isDragging.value) return
        e.stopPropagation()
        e.preventDefault()

        isDragging.value = false
        // 解绑document事件，避免内存泄漏
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
        setTimeout(() => {
            isDragEvent.value = false
        }, 0)
    }
    // 拖拽中（鼠标移动时）
    // const onDrag = (e) => {
    //     if (!isDragging.value) return
    //     e.stopPropagation()
    //
    //     // 实时计算新位置
    //     // 复用缓存的画布信息，不再重复查询
    //     const mouseXInCanvas = (e.clientX - canvasRect.left - canvasStore.offsetX) / canvasStore.scale;
    //     const mouseYInCanvas = (e.clientY - canvasRect.top - canvasStore.offsetY) / canvasStore.scale;
    //
    //     // 新位置 = 鼠标当前画布坐标 - 初始偏移量（保持鼠标在组件内的相对位置不变）
    //     const newX = mouseXInCanvas - mouseOffsetX
    //     const newY = mouseYInCanvas - mouseOffsetY
    //
    //     // 根据组件类型更新全局状态中的位置
    //     if (componentType === 'title') {
    //         canvasStore.updateTitlePosition(id, newX, newY)
    //     } else if (componentType === 'markdown') {
    //         canvasStore.updateMarkdownPosition(id, newX, newY)
    //     }
    // }
    //
    // // 结束拖拽（鼠标松开时）
    // const endDrag = (e) => {
    //     if (!isDragging.value) return
    //     e.stopPropagation()
    //     isDragging.value = false
    // }

    // 返回供组件使用的方法和状态
    return {
        isDragging,
        startDrag,
        isDragEvent
        // onDrag,
        // endDrag
    }
}
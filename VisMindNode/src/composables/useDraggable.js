// 拖拽逻辑复用函数
import {onUnmounted, ref} from 'vue'
import { useCanvasStore } from '@/stores/canvasStore.js'
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";

export function useDraggable(componentType, id, initialX, initialY) {
    // 获取全局状态
    const canvasStore = useCanvasStore()
    const elementStore=useCanvasElementStore()
    const areaStore= useCanvasAreaStore()
    const viewStore=useCanvasViewStore()
    const mouseStore=  useCanvasMouseStore()

    let canvasEl = null;
    let canvasRect = null;
    let startPositions = new Map() // 存储每个组件的初始位置
    let startMousePos = null; // 记录鼠标按下时的初始位置（用于计算总位移）

    // 拖拽状态
    const isDragging = ref(false)  //是否正在拖拽中，用于move判断
    const isDragEvent = ref(false)  // 标记是否为拖拽事件（用于区分点击和拖拽）
    const isSelected = ref(false)
    const hasMoved = ref(false)

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
    // 处理选中逻辑
    const handleSelection = (e) => {
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        // Ctrl+点击时保留已有选中并添加当前元素
        if (isCtrlPressed) {
            console.log('Ctrl+点击')
            elementStore.toggleElementSelection(id, true)
        } else {
            // 非Ctrl点击时，若当前未选中则清空其他选中
            if (!elementStore.selectedElementIds.has(id)) {
                elementStore.clearAllSelections()
                elementStore.toggleElementSelection(id, false)
            }
        }
        isSelected.value = elementStore.selectedElementIds.has(id)
    }
    // 开始拖拽（鼠标按下时）
    const startDrag = (e) => {
        // 阻止事件冒泡（避免触发画布本身的拖拽）
        e.stopPropagation()
        // 关键：阻止默认行为（如文本选择、输入框聚焦等）
        e.preventDefault()

        hasMoved.value = false
        isDragging.value = true
        isDragEvent.value = false
        startMousePos = { x: e.clientX, y: e.clientY }

        // 立即处理选中逻辑，仅一次
        handleSelection(e)

        // 只在开始拖拽时查询一次画布信息
        canvasEl = document.querySelector('.infinite-canvas');
        canvasRect = canvasEl.getBoundingClientRect(); // 缓存画布在视口的位置
        if (!canvasRect) return; // 容错处理
        // 计算鼠标在组件内的相对位置
        // 组件当前位置是initialX/initialY，鼠标点击位置是e.clientX/e.clientY
        // 需要转换为画布坐标系（考虑画布的偏移和缩放）
        // 记录每个选中组件的初始位置和鼠标偏移
        elementStore.selectedElementIds.forEach(id => {
            const pos = elementStore.getComponentPosition(id) // 需要实现该方法
            // 鼠标在画布坐标系中的位置 = (鼠标在页面中的位置 - 画布偏移) / 缩放比例
            const mouseXInCanvas = (e.clientX - canvasRect.left - viewStore.offsetX) / viewStore.scale
            const mouseYInCanvas = (e.clientY - canvasRect.top - viewStore.offsetY) / viewStore.scale

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
        // 检测到移动，标记为拖拽事件
        // 计算总位移（与初始位置的距离）
        const totalX = Math.abs(e.clientX - startMousePos.x)
        const totalY = Math.abs(e.clientY - startMousePos.y)

        // 位移超过5px则判定为拖拽（避免微小抖动）
        if (totalX > 5 || totalY > 5) {
            hasMoved.value = true
            isDragEvent.value = true
        }
        if (!hasMoved.value) return; // 未达到拖拽阈值则不更新位置
        e.stopPropagation()
        e.preventDefault()

        const mouseXInCanvas = (e.clientX - canvasRect.left - viewStore.offsetX) / viewStore.scale;
        const mouseYInCanvas = (e.clientY - canvasRect.top - viewStore.offsetY) / viewStore.scale;

        // 计算每个组件的位置变化
        elementStore.selectedElementIds.forEach(id => {
            const startPos = startPositions.get(id)
            const newX = mouseXInCanvas - startPos.offsetX
            const newY = mouseYInCanvas - startPos.offsetY
            elementStore.updateComponentPosition(id, newX, newY) // 更新单个组件位置
        })

    })
    // 结束拖拽（提取为独立函数，绑定到document）
    const handleDragEnd = (e) => {
        if (!isDragging.value) return
        e.stopPropagation()
        e.preventDefault()
        console.log('结束拖拽')
        isDragging.value = false
        startMousePos = null; // 重置初始鼠标位置
        // 延迟重置状态
        setTimeout(() => {
            isDragEvent.value = false
            hasMoved.value = false
        }, 0)

        // 解绑document事件，避免内存泄漏
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
        setTimeout(() => {
            isDragEvent.value = false
        }, 0)
    }
    onUnmounted(() => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
    })

    // 返回供组件使用的方法和状态
    return {
        isDragging,
        startDrag,
        isDragEvent
        // onDrag,
        // endDrag
    }
}
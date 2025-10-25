// src/stores/canvasStore.js （新建这个文件，专门管理画布状态）
import {onMounted, ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";

import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {canvasDB} from "@/utils/indexedDB.js";
import {debounce} from "lodash";

export const useCanvasStore = defineStore('canvas', () => {

    const elementStore = useCanvasElementStore()
    const viewStore = useCanvasViewStore()
    // 保存数据到IndexedDB（防抖处理，避免频繁触发）
    const saveToDB = debounce(async () => {
        // 收集需要保存的数据
        const saveData = {
            elements: Array.from(elementStore.elMap.values()), // 所有元素
            rootIds: [...elementStore.rootIds], // 顶级元素ID
            viewState: {
                offsetX: viewStore.offsetX,
                offsetY: viewStore.offsetY,
                scale: viewStore.scale
            }
        }
        // 关键：使用JSON序列化/反序列化确保数据可被IndexedDB处理
        const serializableData = JSON.parse(JSON.stringify(saveData));
        await canvasDB.save(serializableData)
        console.log('数据已保存到IndexedDB')
    }, 500) // 500ms防抖

    // 从IndexedDB加载数据
    const loadFromDB = async () => {
        const savedData = await canvasDB.load()
        if (!savedData) return
        try {
            // 恢复元素
            elementStore.clearAllElements()
            savedData.elements.forEach(el => {
                elementStore.elMap.set(el.id, el)
                if (!el.parentId) elementStore.rootIds.push(el.id)
            })

            console.log("viewState", savedData.viewState)
            // 恢复视图状态
            viewStore.offsetX = savedData.viewState?.offsetX ?? 0
            viewStore.offsetY = savedData.viewState?.offsetY ?? 0
            viewStore.scale = savedData.viewState?.scale ?? 1
            console.log('数据已从IndexedDB加载')
        } catch (error) {
            console.error('数据恢复失败:', error)
            await canvasDB.clear() // 清除损坏数据
        }
    }

    // 清空所有数据（元素+视图+存储）
    const clearAllData = async () => {
        elementStore.clearAllElements()
        viewStore.resetView()
        await canvasDB.clear()
        console.log('所有数据已清空')
    }
    // 监听数据变化，自动保存
    watch(
        [
            () => elementStore.elMap, // 监听元素变化
            () => viewStore.offsetX,  // 监听视图偏移
            () => viewStore.offsetY,
            () => viewStore.scale
        ],
        saveToDB,
        { deep: true } // 深度监听Map和对象变化
    )

    const isDragEvent=ref(false) // 新增：标记是否为拖拽事件
    const setIsDragEvent=(status)=> {
        isDragEvent.value = status
    }

    onMounted(async () => {
        await canvasDB.init() // 初始化数据库
        await loadFromDB()
    })


    return {
        saveToDB,
        loadFromDB,
        clearAllData,
        generateTestComponents: async () => {
            await elementStore.generateTestComponents()
            saveToDB() // 生成后手动保存一次
        },
        setIsDragEvent,
        isDragEvent,

        batchUpdateComponentPositions: (updates) => elementStore.batchUpdateComponentPositions(updates),

        // 选中状态操作
        selectedElementIds: elementStore.selectedElementIds,
        toggleElementSelection: (id, isCtrlPressed) => elementStore.toggleElementSelection(id, isCtrlPressed),
        clearAllSelections: () => elementStore.clearAllSelections(),


    }
})
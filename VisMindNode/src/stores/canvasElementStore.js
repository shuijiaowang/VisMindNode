// src/stores/canvasElementStore.js
import {ref, computed, reactive} from 'vue'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { useCanvasAreaStore } from './canvasAreaStore'

export const useCanvasElementStore = defineStore('canvasElement', () => {
    const areaStore = useCanvasAreaStore()

    // 元素存储（Map结构，key为id）
    const  elMap = reactive(new Map()) // 所有元素
    let rootIds = reactive([]) // 顶级元素ID（parentId为null）
    const selectedElementIds = reactive(new Set()) // 选中的元素ID
    const selectedDirTitleId = ref(0) //当前目录选中的标题ID //新元素创建时会把它设置为父id
    const selectedShowDirTitleId=ref(0) //当前工作的标题ID //目录展示的父级id

    // 组件类型配置（核心：统一管理所有元素类型）
    const componentConfigs = {
        title: {
            type: 'title',
            defaultContent: '新标题',
            defaultStyle: { fontSize: 16, color: '#333' }
        },
        markdown: {
            type: 'markdown',
            defaultContent: '# 新文档',
            defaultStyle: { fontSize: 14, color: '#666' }
        },
        text: {
            type: 'text',
            defaultContent: '新文本',
            defaultStyle: { fontSize: 14, color: '#333' }
        }
        // 新增元素类型只需添加配置
    }
    // 创建元素（通用方法）
    // 创建元素（通用方法）
    const createElement = (options) => {


        const id = uuidv4()
        const element = {
            id,
            type: options.type,
            x: options.x,
            y: options.y,
            content: options.content || componentConfigs[options.type].defaultContent,
            parentId: options.parentId || null,
            children: [],
            zIndex: options.zIndex || 1,
            isLocked: false,
            isShow: true,
            createdAt: Date.now(),
            style: options.style || componentConfigs[options.type].defaultStyle
        }
        elMap.set(id, element)
        if (!element.parentId) rootIds.push(id)
        return id
    }
    //缺少，修改元素通用方法
    // 更新元素属性（通用修改方法）
    const updateElement = (id, updates) => {
        const element = elMap.get(id)
        if (element) {
            Object.assign(element, updates) // 使用Object.assign是什么
            elMap.set(id, element) // 触发响应式更新
        }
    }
    // 创建标题元素
    const createTitle = (x, y, content = '新标题') => {
        return createElement({
            type: 'title',
            x,
            y,
            content,
            style: { fontSize: 24, color: '#333' }
        })
    }
    // 创建Markdown元素
    const createMarkdown = (x, y, content = '# 新文档') => {
        return createElement({
            type: 'markdown',
            x,
            y,
            content,
            style: { fontSize: 14, color: '#666' }
        })
    }
    // 更新元素位置（复用updateElement）
    const updateComponentPosition = (id, x, y) => {
        updateElement(id, { x, y })
    }

    // 切换元素选中状态
    const toggleElementSelection=(id, isCtrlPressed) => {
        if (isCtrlPressed) {
            selectedElementIds.has(id) ? selectedElementIds.delete(id) : selectedElementIds.add(id)
        } else {
            selectedElementIds.clear()
            selectedElementIds.add(id)
        }
    }

    // 清空选中状态
    const clearAllSelections = () => {
        selectedElementIds.clear()
    }

    // 可见元素过滤（按预加载区域）
    const visibleElements = computed(() => {
        return Array.from(elMap.values()).filter(el =>
            areaStore.isInVisibleArea(el.x, el.y)
        );
    });

    // 按类型过滤可见元素ID //看不懂
    const visibleTypeIds = computed(() => {
        return Object.entries(componentConfigs).reduce((acc, [type]) => {
            acc[`visible${type.charAt(0).toUpperCase() + type.slice(1)}Ids`] =
                visibleElements.value
                    .filter(el => el.type === type)
                    .map(el => el.id)
            return acc
        }, {})
    })

    const titleIds = computed(() => {
        // 将 Map 的值转换为数组，再过滤出类型为 'title' 的元素，最后提取 id
        return Array.from(elMap.values())
            .filter(el => el.type === 'title')
            .map(el => el.id)
    })
    // 按类型过滤可见元素（标题/Markdown）
    const visibleTitleIds = computed(() => {
        return visibleElements.value
            .filter(el => el.type === 'title')
            .map(el => el.id)
    })

    const visibleMarkdownIds = computed(() => {
        return visibleElements.value
            .filter(el => el.type === 'markdown')
            .map(el => el.id)
    })
    const visibleTextIds=computed(() => {
        return visibleElements.value
            .filter(el => el.type === 'text')
            .map(el => el.id)
    })

    // 删除选中元素
    const deleteSelectedElements = () => {
        selectedElementIds.forEach(id => {
            elMap.delete(id)
            rootIds.splice(rootIds.indexOf(id), 1)
        })
        selectedElementIds.clear()
    }

    // 清空所有元素
    const clearAllElements = () => {
        elMap.clear()
        rootIds.length = 0
        selectedElementIds.clear()
    }
    const getComponentPosition = (id) => {
        const el = elMap.get(id);
        return el ? { x: el.x, y: el.y } : { x: 0, y: 0 };
    };
    // 补充批量更新位置方法（优化批量拖拽性能）
    const batchUpdateComponentPositions = (updates) => {
        updates.forEach(({ id, x, y }) => {
            updateElement(id, { x, y });
        });
    };

    // 生成测试数据
    const generateTestComponents = async (count = 500) => {
        const canvasEl = document.querySelector('.infinite-canvas')
        if (!canvasEl) return

        const { offsetWidth: canvasWidth, offsetHeight: canvasHeight } = canvasEl
        const centerX = canvasWidth / 2
        const centerY = canvasHeight / 2
        const range = 5000

        Object.values(componentConfigs).forEach(config => {
            for (let i = 0; i < count; i++) {
                const x = centerX + (Math.random() * range - range / 2)
                const y = centerY + (Math.random() * range - range / 2)
                createElement({
                    type: config.type,
                    x,
                    y,
                    content: `${config.defaultContent.replace('新', `测试${config.type} `)}${i + 1}`
                })
            }
        })
    }

    return {
        elMap,
        rootIds,
        selectedElementIds,
        visibleTitleIds,
        visibleMarkdownIds,
        visibleTextIds,
        createElement,
        createTitle,
        createMarkdown,
        updateComponentPosition,
        updateElement,
        toggleElementSelection,
        clearAllSelections,
        deleteSelectedElements,
        clearAllElements, //
        getComponentPosition, //
        batchUpdateComponentPositions, //
        generateTestComponents ,//
        selectedDirTitleId,
        selectedShowDirTitleId,
        titleIds,
    }
})
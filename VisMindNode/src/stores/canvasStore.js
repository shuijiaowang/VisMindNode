// src/stores/canvasStore.js （新建这个文件，专门管理画布状态）
import {computed, onMounted, reactive, ref, watch} from 'vue'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import {debounce} from "lodash";  // 这里的 v4 是 uuid 的一种生成算法

export const useCanvasStore = defineStore('canvas', () => {
    // 核心变量：视图中心相对于逻辑原点的偏移量（单位：px）
    // 初始值为 0，意味着：视图中心一开始就和逻辑原点(0,0)重合
    const offsetX = ref(0)  // X轴偏移：正数=视图向右移，负数=向左移
    const offsetY = ref(0)  // Y轴偏移：正数=视图向下移，负数=向上移

    // 缩放比例（后续会用到，先定义）
    const scale = ref(1)  // 1=原大小，2=放大2倍，0.5=缩小一半
    //找到「窗口正中心」这个点，对应到「巨大画布」上的具体位置（画布自己的坐标系里的坐标），这个坐标将来会用来放新元素。
    const windowCenterInCanvas  = computed(() => {
        const canvas = document.querySelector('.infinite-canvas');
        const canvasWidth = canvas?.offsetWidth
        const canvasHeight = canvas?.offsetHeight

        const canvasCenterX = canvasWidth / 2; // 画布自身中心X（固定逻辑值）
        const canvasCenterY = canvasHeight / 2; // 画布自身中心Y（固定逻辑值）

        // 核心修正：偏移量需除以缩放比例（因为缩放会放大偏移的视觉效果）
        return {
            x: canvasCenterX - (offsetX.value / scale.value), // 关键修正：offsetX先除以scale
            y: canvasCenterY - (offsetY.value / scale.value)
        };
    });

    // 1. 将可视区域计算从 computed 改为 ref，用于手动更新
    const visibleAreaInCanvasBounds = ref({
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
    })
    // 保存当前预加载的边界（外部变量/状态，确保持久化）
    let currentPreloadBounds = ref(null);
        // 2. 提取可视区域计算逻辑为独立函数
    const calculateVisibleArea = () => {
        const expandRange = 3000; // 扩张时的预加载范围
        const shrinkRange = expandRange / 2; // 收缩时的阈值（是扩张的一半）
        const canvas = document.querySelector('.infinite-canvas');
        const container = document.querySelector('.canvas-view-wrapper');

        if (!canvas || !container) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
        }

        const canvasWidth = canvas.offsetWidth;
        const canvasHeight = canvas.offsetHeight;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;

        const containerWidth = container.offsetWidth || window.innerWidth;
        const containerHeight = container.offsetHeight || window.innerHeight;

        // 计算当前可见区域的原始范围（不含预加载）
        const originalMinX = canvasCenterX - (containerWidth / 2 / scale.value) - (offsetX.value / scale.value);
        const originalMaxX = canvasCenterX + (containerWidth / 2 / scale.value) - (offsetX.value / scale.value);
        const originalMinY = canvasCenterY - (containerHeight / 2 / scale.value) - (offsetY.value / scale.value);
        const originalMaxY = canvasCenterY + (containerHeight / 2 / scale.value) - (offsetY.value / scale.value);

        // // 计算包含预加载范围的新边界
        // const newBounds = {
        //     minX: originalMinX - preloadRange,
        //     maxX: originalMaxX + preloadRange,
        //     minY: originalMinY - preloadRange,
        //     maxY: originalMaxY + preloadRange
        // };
        // 计算包含扩张范围的新边界
        const expandBounds = {
            minX: originalMinX - expandRange,
            maxX: originalMaxX + expandRange,
            minY: originalMinY - expandRange,
            maxY: originalMaxY + expandRange
        };

        // 计算包含收缩范围的新边界（用于判断是否需要收缩）
        const shrinkBounds = {
            minX: originalMinX - shrinkRange,
            maxX: originalMaxX + shrinkRange,
            minY: originalMinY - shrinkRange,
            maxY: originalMaxY + shrinkRange
        };
        // 第一次计算：直接初始化当前边界
        if (!currentPreloadBounds.value) {
            currentPreloadBounds.value = expandBounds;
            console.log('初始化边界', currentPreloadBounds.value)
            return expandBounds;
        }
        // 复制当前边界用于修改
        let newBounds = { ...currentPreloadBounds.value };
        let hasChange = false;
        // 检查新范围是否超出当前预加载边界
        // X轴左侧判断
        if (originalMinX < currentPreloadBounds.value.minX) {
            // 超出左边界，需要扩张
            newBounds.minX = expandBounds.minX;
            hasChange = true;
        } else if (shrinkBounds.minX > currentPreloadBounds.value.minX) {
            // 远离左边界超过收缩阈值，需要收缩
            newBounds.minX = shrinkBounds.minX;
            hasChange = true;
        }

        // X轴右侧判断
        if (originalMaxX > currentPreloadBounds.value.maxX) {
            // 超出右边界，需要扩张
            newBounds.maxX = expandBounds.maxX;
            hasChange = true;
        } else if (shrinkBounds.maxX < currentPreloadBounds.value.maxX) {
            // 远离右边界超过收缩阈值，需要收缩
            newBounds.maxX = shrinkBounds.maxX;
            hasChange = true;
        }

        // Y轴上侧判断
        if (originalMinY < currentPreloadBounds.value.minY) {
            // 超出上边界，需要扩张
            newBounds.minY = expandBounds.minY;
            hasChange = true;
        } else if (shrinkBounds.minY > currentPreloadBounds.value.minY) {
            // 远离上边界超过收缩阈值，需要收缩
            newBounds.minY = shrinkBounds.minY;
            hasChange = true;
        }

        // Y轴下侧判断
        if (originalMaxY > currentPreloadBounds.value.maxY) {
            // 超出下边界，需要扩张
            newBounds.maxY = expandBounds.maxY;
            hasChange = true;
        } else if (shrinkBounds.maxY < currentPreloadBounds.value.maxY) {
            // 远离下边界超过收缩阈值，需要收缩
            newBounds.maxY = shrinkBounds.maxY;
            hasChange = true;
        }
        // 核心修改：无变化时直接返回原边界，不执行更新
        if (!hasChange) {
            console.log('无变化，返回原边界', currentPreloadBounds.value)
            return currentPreloadBounds.value; // 直接返回当前值，不触发更新
        }

        // 有变化时才更新边界
        currentPreloadBounds.value = newBounds;
        console.log('更新边界', currentPreloadBounds.value)
        return newBounds;
    }
    // 可视区域边界（用于局部渲染）
    // 可视区域边界（用于局部渲染，包含预加载范围）
    // const visibleAreaInCanvasBounds = computed(() => {
    //     // 预加载扩展范围（向四周各扩展1000px逻辑坐标）
    //     const preloadRange = 1000;
    //
    //     // 使用缓存的DOM元素
    //     const canvas = canvasEl.value;
    //     const container = containerEl.value;
    //     if (!canvas || !container) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    //     // 1. 获取画布自身尺寸（用于计算画布中心）
    //     const canvasWidth = canvas?.offsetWidth;
    //     const canvasHeight = canvas?.offsetHeight;
    //     const canvasCenterX = canvasWidth / 2;
    //     const canvasCenterY = canvasHeight / 2;
    //
    //     // 2. 获取容器（可视窗口）尺寸
    //     const containerWidth = container?.offsetWidth || window.innerWidth;
    //     const containerHeight = container?.offsetHeight || window.innerHeight;
    //
    //     // 3. 计算原始可视区域边界（无预加载）
    //     const originalMinX = canvasCenterX - (containerWidth / 2 / scale.value) - (offsetX.value / scale.value);
    //     const originalMaxX = canvasCenterX + (containerWidth / 2 / scale.value) - (offsetX.value / scale.value);
    //     const originalMinY = canvasCenterY - (containerHeight / 2 / scale.value) - (offsetY.value / scale.value);
    //     const originalMaxY = canvasCenterY + (containerHeight / 2 / scale.value) - (offsetY.value / scale.value);
    //
    //     // 4. 扩展边界（加上预加载范围）
    //     return {
    //         minX: originalMinX - preloadRange,  // 向左扩展
    //         maxX: originalMaxX + preloadRange,  // 向右扩展
    //         minY: originalMinY - preloadRange,  // 向上扩展
    //         maxY: originalMaxY + preloadRange   // 向下扩展
    //     };
    // });
    //写一个判断，传入x,y,判断是否在可视区域内
    const isInVisibleArea = (x, y) => {
        return (
            x >= visibleAreaInCanvasBounds.value.minX &&
            x <= visibleAreaInCanvasBounds.value.maxX &&
            y >= visibleAreaInCanvasBounds.value.minY &&
            y <= visibleAreaInCanvasBounds.value.maxY
        );
    }

    // 在store中添加缓存变量
    const canvasEl = ref(null)
    const containerEl = ref(null)
// 初始化时获取一次DOM元素
    onMounted(() => {
        canvasEl.value = document.querySelector('.infinite-canvas')
        containerEl.value = document.querySelector('.canvas-view-wrapper')
    })


    // 在canvasStore中添加可见组件ID计算
    const visibleTitleIds = computed(() => {
        return titles.filter(title => isInVisibleArea(title.x, title.y)).map(title => title.id)
    })

    const visibleMarkdownIds = computed(() => {
        return markdowns.filter(markdown => isInVisibleArea(markdown.x, markdown.y)).map(markdown => markdown.id)
    })
    // 保存当前预加载的边界（外部变量/状态，确保持久化）
    // 3. 创建防抖函数（50ms内多次触发只执行一次）
    const updateVisibleArea = debounce(() => {
        visibleAreaInCanvasBounds.value = calculateVisibleArea() //如何返回的calculateVisibleArea()不发生变化的话，后面的还会触发吗
    }, 50)
    // 4. 监听缩放和偏移变化，触发防抖更新
    watch([offsetX, offsetY, scale], () => {
        updateVisibleArea()
    }, { immediate: true }) // 初始化时立即计算一次













    const titles=reactive([]) //标题组件
    const markdowns = reactive([])//markdown组件

    //统计组件数量
    const componentCount = computed(() => titles.length + markdowns.length)

    const createTitle=(x, y) =>{
        // 生成唯一ID
        const id = uuidv4()
        // 添加标题到数组
        titles.push({
            id,
            x,  // X坐标
            y,  // Y坐标
            content: '新标题'  // 默认内容
        })
        // 返回创建的标题，方便后续操作
        return titles.find(item => item.id === id)
    }
    // 新增：更新标题内容的方法
    const updateTitleContent=(id, content)=> {
        const title = titles.find(item => item.id === id)
        if (title) {
            title.content = content
        }
    }

    const createMarkdown = (x, y) => {
        const id = uuidv4()
        markdowns.push({
            id,
            x,
            y,
            content: '# 新文档\n\n这是一个markdown文档'  // 默认内容
        })
        return markdowns.find(item => item.id === id)
    }
    // 新增：更新markdown内容
    const updateMarkdownContent = (id, content) => {
        const markdown = markdowns.find(item => item.id === id)
        if (markdown) {
            markdown.content = content
        }
    }
    // 修改保存逻辑（添加markdowns）
    const saveToLocalStorage = () => {
        const data = {
            titles: [...titles],
            markdowns: [...markdowns],  // 新增
            offsetX: offsetX.value,
            offsetY: offsetY.value,
            scale: scale.value
        }
        localStorage.setItem('canvasState', JSON.stringify(data))
    }
    // 新增：清空所有数据的函数（用于测试）
    const clearAllData = () => {
        // 清空组件数组
        titles.length = 0
        markdowns.length = 0

        // 重置视图状态
        offsetX.value = 0
        offsetY.value = 0
        scale.value = 1

        // 清除本地存储
        localStorage.removeItem('canvasState')
    }
    // 修改加载逻辑（添加markdowns）
    const loadFromLocalStorage = () => {
        const savedData = localStorage.getItem('canvasState')
        if (savedData) {
            try {
                const {
                    titles: savedTitles,
                    markdowns: savedMarkdowns,  // 新增
                    offsetX: savedX,
                    offsetY: savedY,
                    scale: savedScale
                } = JSON.parse(savedData)

                // 恢复标题数据
                titles.length = 0
                savedTitles.forEach(title => titles.push(title))

                // 新增：恢复markdown数据
                markdowns.length = 0
                savedMarkdowns?.forEach(markdown => markdowns.push(markdown))

                // 恢复视图状态
                offsetX.value = savedX
                offsetY.value = savedY
                scale.value = savedScale
            } catch (error) {
                console.error('加载保存的数据失败:', error)
                localStorage.removeItem('canvasState')
            }
        }
    }

    // 新增：生成随机测试组件的方法
    const generateTestComponents = () => {
        // 清空现有组件
        // titles.length = 0
        // markdowns.length = 0

        const canvasEl = document.querySelector('.infinite-canvas');
        if (!canvasEl) {
            console.error('未找到画布元素，无法生成测试组件');
            return;
        }
        // 获取画布实际宽高（考虑到min-width/min-height的设置）
        const canvasWidth = canvasEl.offsetWidth;
        const canvasHeight = canvasEl.offsetHeight;

        // 计算画布中心坐标（基于画布左上角原点）
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        const r=10000
        // 生成500个标题组件（中心附近±1500px范围）
        for (let i = 0; i < 500; i++) {
            // 在中心坐标基础上生成±1500px的随机偏移
            const x = centerX + (Math.random() * r - r/2);
            const y = centerY + (Math.random() * r - r/2);
            createTitle(x, y).content = `测试标题 ${i + 1}`;
        }

        // 生成500个markdown组件（同上范围）
        for (let i = 0; i < 500; i++) {
            const x = centerX + (Math.random() * r - r/2);
            const y = centerY + (Math.random() * r - r/2);
            createMarkdown(x, y).content = `# 测试文档 ${i + 1}\n\n这是第${i + 1}个测试markdown文档`;
        }

        console.log('生成测试数据完成,当前：',titles.length,markdowns.length)
        // 保存生成的测试数据
        saveToLocalStorage()
    }

// 监听数据变化，自动保存
    watch([offsetX, offsetY, scale], saveToLocalStorage)
    watch(titles, saveToLocalStorage, { deep: true })  // 深度监听数组变化
    watch(markdowns, saveToLocalStorage, { deep: true })  // 新增


    // 初始化时加载数据
    loadFromLocalStorage()
    return {
        offsetX,
        offsetY,
        scale,
        windowCenterInCanvas,
        visibleAreaInCanvasBounds,
        titles,
        createTitle,
        updateTitleContent,
        saveToLocalStorage,  // 暴露保存方法（可选）
        markdowns,
        createMarkdown,
        updateMarkdownContent,
        clearAllData,
        generateTestComponents,
        isInVisibleArea,
        componentCount,
        visibleTitleIds,
        visibleMarkdownIds,
        currentPreloadBounds,
    }
})
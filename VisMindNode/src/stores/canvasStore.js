// src/stores/canvasStore.js （新建这个文件，专门管理画布状态）
import {computed, nextTick, onMounted, onUnmounted, reactive, ref, watch} from 'vue'
import {defineStore} from 'pinia'
import {v4 as uuidv4} from 'uuid'
import {debounce} from "lodash"; // 这里的 v4 是 uuid 的一种生成算法

export const useCanvasStore = defineStore('canvas', () => {
    //-------------------计算位移/缩放/坐标----------------
    // 核心变量：视图中心相对于逻辑原点的偏移量（单位：px）
    // 初始值为 0，意味着：视图中心一开始就和逻辑原点(0,0)重合
    const offsetX = ref(0)  // X轴偏移：正数=视图向右移，负数=向左移
    const offsetY = ref(0)  // Y轴偏移：正数=视图向下移，负数=向上移
    const scale = ref(1)  // // 缩放比例，1=原大小，2=放大2倍，0.5=缩小一半，主要用来缩放偏移量？
    //找到「窗口正中心」这个点，对应到「巨大画布」上的具体位置（画布自己的坐标系里的坐标），这个坐标将来会用来放新元素。
    const windowCenterInCanvas = computed(() => {
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
    //可视窗口所在的画布区域，默认为画布的宽高一半（-100vw/2,+100vw/2,-100vh/2,+100vh/2）,这是一个实时变化的值。
    const visibleAreaInCanvasBounds = ref({
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
    })
    // 保存当前预加载的边界，用于判断元素是否渲染（v-if），具有弹性，可是窗口的活动范围将不断拓展预加载的范围，值相对固定。
    let preloadAreaInCanvasBounds = ref(null);
    const expandRange = 1000; // 扩张时的预加载范围 //设置为多少比较合适呢?
    // 可视区域计算逻辑，同时更新visibleAreaInCanvasBounds和preloadAreaInCanvasBounds，添加防抖
    const calculateVisibleArea = () => {
        // 不再实时读取DOM，改用缓存值
        const { width: canvasWidth, height: canvasHeight } = canvasSize.value
        const { width: containerWidth, height: containerHeight } = containerSize.value

        if (!canvasWidth || !containerWidth) return

        // 后续计算逻辑保持不变，但使用缓存的尺寸值
        const canvasCenterX = canvasWidth / 2
        const canvasCenterY = canvasHeight / 2

        // 计算当前可见区域的原始范围（不含预加载），即visibleAreaInCanvasBounds的值
        const originalMinX = canvasCenterX - (containerWidth / 2 / scale.value) - (offsetX.value / scale.value);
        const originalMaxX = canvasCenterX + (containerWidth / 2 / scale.value) - (offsetX.value / scale.value);
        const originalMinY = canvasCenterY - (containerHeight / 2 / scale.value) - (offsetY.value / scale.value);
        const originalMaxY = canvasCenterY + (containerHeight / 2 / scale.value) - (offsetY.value / scale.value);
        visibleAreaInCanvasBounds.value = {
            minX: originalMinX,
            maxX: originalMaxX,
            minY: originalMinY,
            maxY: originalMaxY
        }

        // 计算包含扩张范围的新边界，第一次的preloadAreaInCanvasBounds的值
        const expandBounds = {
            minX: originalMinX - expandRange,
            maxX: originalMaxX + expandRange,
            minY: originalMinY - expandRange,
            maxY: originalMaxY + expandRange
        };

        // 第一次计算：直接初始化当前边界
        if (!preloadAreaInCanvasBounds.value) {
            preloadAreaInCanvasBounds.value = expandBounds;
            console.log('初始化边界', preloadAreaInCanvasBounds.value)
            return
        }

        // 第二次及以后计算：使用当前边界作为基础,如果visibleAreaInCanvasBounds的边界超出了当前边界，则更新当前边界
        // 复制当前边界用于修改
        let newBounds = {...preloadAreaInCanvasBounds.value};
        let hasChange = false;

        // 仅保留扩张逻辑（删除收缩判断）
        // X轴左侧扩张
        if (originalMinX < preloadAreaInCanvasBounds.value.minX) {
            newBounds.minX = expandBounds.minX;
            hasChange = true;
        }

        // X轴右侧扩张
        if (originalMaxX > preloadAreaInCanvasBounds.value.maxX) {
            newBounds.maxX = expandBounds.maxX;
            hasChange = true;
        }

        // Y轴上侧扩张
        if (originalMinY < preloadAreaInCanvasBounds.value.minY) {
            newBounds.minY = expandBounds.minY;
            hasChange = true;
        }

        // Y轴下侧扩张
        if (originalMaxY > preloadAreaInCanvasBounds.value.maxY) {
            newBounds.maxY = expandBounds.maxY;
            hasChange = true;
        }

        // 无变化时直接返回原边界
        if (!hasChange) {
            console.log('无变化，返回原边界', preloadAreaInCanvasBounds.value)
            return
        }

        // 有扩张时更新预加载边界
        preloadAreaInCanvasBounds.value = newBounds;
        console.log('更新边界（扩张）', preloadAreaInCanvasBounds.value)


    };
    // 用于回收预加载边界，防卡顿
    let shrinkTimer = setInterval(() => {
        const currentVisible = visibleAreaInCanvasBounds.value;
        preloadAreaInCanvasBounds.value = {
            minX: currentVisible.minX - expandRange,
            maxX: currentVisible.maxX + expandRange,
            minY: currentVisible.minY - expandRange,
            maxY: currentVisible.maxY + expandRange
        };
        console.log('每1分钟恢复默认边界', preloadAreaInCanvasBounds.value) //这个为什么是undefined
    }, 10* 1000); // 60秒 = 60*1000毫秒
    //写一个判断，传入x,y,判断是否在可视区域内
    const isInVisibleArea = (x, y) => {
        // 先判断预加载区域是否已初始化，未初始化时直接返回 false（或根据业务需求返回默认值）
        if (!preloadAreaInCanvasBounds.value) {
            return false; // 或者 throw new Error('预加载区域尚未初始化');
        }
        // 已初始化时再判断坐标是否在范围内
        return (
            x >= preloadAreaInCanvasBounds.value.minX &&
            x <= preloadAreaInCanvasBounds.value.maxX &&
            y >= preloadAreaInCanvasBounds.value.minY &&
            y <= preloadAreaInCanvasBounds.value.maxY
        );
    };

    //-----------------局部渲染---------------
    // 在store中添加缓存变量
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

    // 在canvasStore中添加可见组件ID计算
    const visibleTitleIds = computed(() => {
        // 遍历Map的values，过滤可见元素，返回id数组
        return Array.from(titles.values())
            .filter(title => isInVisibleArea(title.x, title.y))
            .map(title => title.id)
    })
    const visibleMarkdownIds = computed(() => {
        return Array.from(markdowns.values())
            .filter(markdown => isInVisibleArea(markdown.x, markdown.y))
            .map(markdown => markdown.id)
    })

    // 3. 创建防抖函数（50ms内多次触发只执行一次）
    const updateVisibleArea = debounce(() => {
        calculateVisibleArea() //如何返回的calculateVisibleArea()不发生变化的话，后面的还会触发吗
    }, 100)
    // 4. 监听缩放和偏移变化，触发防抖更新
    watch([offsetX, offsetY, scale], () => {
        updateVisibleArea()
    }, {immediate: true}) // 初始化时立即计算一次


    const titles = reactive(new Map()) // key: id, value: 标题组件对象
    const markdowns = reactive(new Map()) // key: id, value: markdown组件对象

    //统计组件数量
    const componentCount = computed(() => {
        return titles.size + markdowns.size // Map用size获取数量
    })
    const createTitle = (x, y) => {
        // 生成唯一ID
        const id = uuidv4()
        // 添加标题到数组
        const newTitle = {
            id,
            x,
            y,
            content: '新标题',
            // 补充数据结构设计中的必要字段
            type: 'title',
            style:null,
            parentId: null,
            children: [],
            zIndex: 1,
            isLocked: false,
            isShow: true,
            createdAt: Date.now()
        }
        titles.set(id, newTitle) // Map用set存储
        return newTitle // 直接返回新创建的对象
    }
    const createMarkdown = (x, y) => {
        const id = uuidv4()
        const newMarkdown = {
            id,
            x,
            y,
            content: '# 新文档\n\n这是一个markdown文档',
            // 补充数据结构设计中的必要字段
            type: 'markdown',
            parentId: null,
            children: [],
            zIndex: 1,
            isLocked: false,
            isShow: true,
            createdAt: Date.now()
        }
        markdowns.set(id, newMarkdown) // Map用set存储
        return newMarkdown
    }
    const updateTitleContent = (id, content) => {
        const title = titles.get(id) // Map用get查询
        if (title) {
            title.content = content
        }
    }
    const updateMarkdownContent = (id, content) => {
        const markdown = markdowns.get(id)
        if (markdown) {
            markdown.content = content
        }
    }
    //可以加个字段判断是否全删（包括children）
    const deleteTitle = (id) => {
        // 先删除子组件（如果有）
        const title = titles.get(id)
        if (title?.children?.length) {
            title.children.forEach(childId => {
                // 假设子组件可能是标题或markdown，这里需要根据实际类型处理
                if (titles.has(childId)) deleteTitle(childId)
                if (markdowns.has(childId)) deleteMarkdown(childId)
            })
        }
        titles.delete(id) // Map用delete删除
    }
    // 删除markdown组件
    const deleteMarkdown = (id) => {
        const markdown = markdowns.get(id)
        if (markdown?.children?.length) {
            markdown.children.forEach(childId => {
                if (titles.has(childId)) deleteTitle(childId)
                if (markdowns.has(childId)) deleteMarkdown(childId)
            })
        }
        markdowns.delete(id)
    }
    const deleteSelectedElements=() =>{
        console.log("删除失败了？")
        const idsToDelete = Array.from(selectedElementIds.value);
        idsToDelete.forEach(id => {
            console.log("删除id:",id)
            deleteElementRecursively(id);
        });
        clearAllSelections();
    }
    const getElementById = (id) => {
        // 先从标题中查找
        if (titles.has(id)) {
            return  titles.get(id)
        }

        // 再从markdown中查找
        if (markdowns.has(id)) {
            return markdowns.get(id)

        }
    }

    // 递归删除元素及其子元素
    const deleteElementRecursively=(id)=> {
        const element = getElementById(id); // 需要实现根据ID获取元素的方法
        if (!element) return;

        // 先删除子元素
        if (element.children && element.children.length) {
            element.children.forEach(childId => {
                deleteElementRecursively(childId);
            });
        }

        // 从对应集合中删除元素
        if (element.type === 'title') {
             titles.delete(id);
        } else if (element.type === 'markdown') {
             markdowns.delete(id);
        }

        // 更新父元素的children列表
        if (element.parentId) {
            const parent =  getElementById(element.parentId);
            if (parent && parent.children) {
                parent.children = parent.children.filter(childId => childId !== id);
            }
        }
    }
    // 修改保存逻辑（添加markdowns）
    const saveToLocalStorage = () => {
        const data = {
            // Map.values() 获取组件对象迭代器，转为数组后保存
            titles: Array.from(titles.values()),
            markdowns: Array.from(markdowns.values()),
            offsetX: offsetX.value,
            offsetY: offsetY.value,
            scale: scale.value
        };
        localStorage.setItem('canvasState', JSON.stringify(data));
    };
    // 新增：清空所有数据的函数（用于测试）
    const clearAllData = () => {
        // 清空 Map（Map 的清空方法是 clear()）
        titles.clear();
        markdowns.clear();

        // 重置视图状态（不变）
        offsetX.value = 0;
        offsetY.value = 0;
        scale.value = 1;

        // 清除本地存储（不变）
        localStorage.removeItem('canvasState');
    };
    // 修改加载逻辑（添加markdowns）
    const loadFromLocalStorage = () => {
        const savedData = localStorage.getItem('canvasState');
        if (savedData) {
            try {
                const {
                    titles: savedTitles,
                    markdowns: savedMarkdowns,
                    offsetX: savedX,
                    offsetY: savedY,
                    scale: savedScale
                } = JSON.parse(savedData);

                // 恢复标题数据（先清空再逐个添加到 Map）
                titles.clear();
                savedTitles.forEach(title => {
                    titles.set(title.id, title); // 以 id 为 key 存入 Map
                });

                // 恢复 markdown 数据（同上）
                markdowns.clear();
                savedMarkdowns?.forEach(markdown => {
                    markdowns.set(markdown.id, markdown);
                });

                // 恢复视图状态（不变）
                offsetX.value = savedX;
                offsetY.value = savedY;
                scale.value = savedScale;
            } catch (error) {
                console.error('加载保存的数据失败:', error);
                localStorage.removeItem('canvasState');
            }
        }
    };

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

        const r = 50000
        // 生成500个标题组件（中心附近±1500px范围）
        for (let i = 0; i < 500; i++) {
            // 在中心坐标基础上生成±1500px的随机偏移
            const x = centerX + (Math.random() * r - r / 2);
            const y = centerY + (Math.random() * r - r / 2);
            createTitle(x, y).content = `测试标题 ${i + 1}`;
        }

        // 生成500个markdown组件（同上范围）
        for (let i = 0; i < 500; i++) {
            const x = centerX + (Math.random() * r - r / 2);
            const y = centerY + (Math.random() * r - r / 2);
            createMarkdown(x, y).content = `# 测试文档 ${i + 1}\n\n这是第${i + 1}个测试markdown文档`;
        }

        console.log('生成测试数据完成,当前：', titles.size, markdowns.size)
        // 保存生成的测试数据
        saveToLocalStorage()
    }
    // 在 store 的 actions 中
    async function resetCanvasView() {
        offsetX.value = 0;
        offsetY.value = 0;
        scale.value = 1;

        // 等待Vue完成DOM更新
        await nextTick();

        // 在DOM稳定后，基于干净的状态和稳定的DOM尺寸，强制进行一次彻底的重新计算
        // 这里的 calculateAndCacheDimensions 是一个读取DOM并缓存尺寸的函数
        calculateAndCacheDimensions();
        // 这里的 recomputeVisibleArea 是一个使用缓存尺寸进行纯计算的函数
        recomputeVisibleArea();
    }

    // const updateTitlePosition = (id, x, y) => {
    //     const title = titles.get(id)
    //     if (title) {
    //         title.x = x
    //         title.y = y
    //     }
    // }

    //这样确实快了很多，但还是会卡顿
    const updateTitlePosition = (id, x, y) => {
        const title = titles.get(id)
        if (!title) return

        title.x = x
        title.y = y

        // 触发 reactive(Map) 的更新
        titles.set(id, title)
    }
    const updateMarkdownPosition = (id, x, y) => {
        // 1. 从 reactive(Map) 中直接获取元素（不用 .value）
        const markdown = markdowns.get(id)
        if (!markdown) return // 没找到元素就退出

        // 2. 修改位置
        markdown.x = x
        markdown.y = y

        // 3. 关键：用 set 重新赋值，触发 reactive 的响应式更新
        // 因为 reactive(Map) 会监听 set 操作，而直接改属性（markdown.x）可能不触发
        markdowns.set(id, markdown)
    }


    //------------批量-----------
    const selectedElementIds = ref(new Set()) // 存储选中的组件ID
    //查看位置
    // 获取组件位置
    const getComponentPosition = (id) => {
        // 先从标题中查找
        if (titles.has(id)) {
            const title = titles.get(id)
            return { x: title.x, y: title.y }
        }

        // 再从markdown中查找
        if (markdowns.has(id)) {
            const markdown = markdowns.get(id)
            return { x: markdown.x, y: markdown.y }
        }

        // 未找到返回默认位置
        return { x: 0, y: 0 }
    }
    const updateComponentPosition = (id, newX, newY) => {
        // 更新标题位置
        if (titles.has(id)) {
            const title = titles.get(id);
            if (!title) return false;

            title.x = newX;
            title.y = newY;

            // 触发 reactive(Map) 的更新
            titles.set(id, title);
            return true;
        }

        // 更新markdown位置
        if (markdowns.has(id)) {
            const markdown = markdowns.get(id);
            if (!markdown) return false;

            markdown.x = newX;
            markdown.y = newY;

            // 关键：用 set 重新赋值，触发 reactive 的响应式更新
            markdowns.set(id, markdown);
            return true;
        }

        // 未找到返回false
        return false;
    }

    const toggleElementSelection = (id, isCtrlPressed) => {
        if (isCtrlPressed) {
            // Ctrl+点击：切换选中状态
            if (selectedElementIds.value.has(id)) {
                selectedElementIds.value.delete(id);
            } else {
                console.log('ctrl为什么不走这里？', id)
                selectedElementIds.value.add(id);
            }
        } else {
            // 普通点击：替换选中状态
            console.log('普通点击，保留当前')
            selectedElementIds.value.clear();
            selectedElementIds.value.add(id);
        }
    };

    const clearAllSelections = () => {
        selectedElementIds.value.clear();
    };



// 监听数据变化，自动保存
    watch([offsetX, offsetY, scale], saveToLocalStorage)
    watch(titles, saveToLocalStorage, {deep: true})  // 深度监听数组变化
    watch(markdowns, saveToLocalStorage, {deep: true})  // 新增

    onUnmounted(() => {
        clearInterval(shrinkTimer);
    });
    // 初始化时加载数据
    loadFromLocalStorage()
    return {
        offsetX, // X偏移
        offsetY, // Y偏移
        scale, // 缩放比例
        windowCenterInCanvas, // 窗口中心点在画布中的坐标
        visibleAreaInCanvasBounds, // 可见区域在画布中的边界
        titles, // 标题列表
        markdowns, // markdown列表
        createTitle,
        updateTitleContent,
        createMarkdown,
        updateMarkdownContent,
        saveToLocalStorage,  // 暴露保存方法（可选）
        clearAllData, //清空数据
        generateTestComponents, // 生成测试组件
        isInVisibleArea, // 判断组件是否在可见区域
        componentCount,  // 组件数量
        visibleTitleIds, // 可见标题IDs
        visibleMarkdownIds, // 可见markdownIDs
        preloadAreaInCanvasBounds, // 预加载区域在画布中的边界
        resetCanvasView, // 重置画布视图
        updateMarkdownPosition,
        updateTitlePosition,
        getComponentPosition,
        updateComponentPosition,
        selectedElementIds,
        toggleElementSelection,
        clearAllSelections,
        deleteSelectedElements,
    }
})
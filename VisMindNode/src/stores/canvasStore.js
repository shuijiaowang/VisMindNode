// src/stores/canvasStore.js （新建这个文件，专门管理画布状态）
import {reactive, ref} from 'vue'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'  // 这里的 v4 是 uuid 的一种生成算法

export const useCanvasStore = defineStore('canvas', () => {
    // 核心变量：视图中心相对于逻辑原点的偏移量（单位：px）
    // 初始值为 0，意味着：视图中心一开始就和逻辑原点(0,0)重合
    const offsetX = ref(0)  // X轴偏移：正数=视图向右移，负数=向左移
    const offsetY = ref(0)  // Y轴偏移：正数=视图向下移，负数=向上移

    // 缩放比例（后续会用到，先定义）
    const scale = ref(1)  // 1=原大小，2=放大2倍，0.5=缩小一半

    const titles=reactive([])

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
    return {
        offsetX,
        offsetY,
        scale,
        titles,
        createTitle,
        updateTitleContent
    }
})
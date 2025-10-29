import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {computed, ref} from "vue";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import { defineStore } from 'pinia'
export const useCanvasDirectoryStore = defineStore('canvasDirectory', ()=>{
    const areaStore = useCanvasAreaStore()
    const elementStore=useCanvasElementStore()
    const selectedDirTitleId = ref(null) //当前目录选中的标题ID //新元素创建时会把它设置为父id,默认为null
    const selectedShowDirTitleId=ref(null) //当前工作的标题ID //目录展示的父级id

    //筛选出所有父节点id=0的所有元素？还是创建一个id为0的父元素，子节点都放到这个虚拟父节点的children中？
    // 获取当前选中目录的直接子元素ID（仅第一层）
    const selectedShowDirTitleIds = computed(() => {
        //判断，如果selectedDirTitleId==null，返回rootids
        //如果不是，返回它的children
        return selectedShowDirTitleId.value === null ? elementStore.rootIds : elementStore.elMap.get(selectedShowDirTitleId.value)?.children
    });


    //三种情况，一种是插入到目标节点的前面，一种是插入到目标节点后面，一种是插入到目标节点的子节点中
    //前两者只是修改父节点的children的顺序
    //第三种是从父节点中移除插入到目标节点的子节点中

    // 工具函数：从原父节点移除元素（复用逻辑）
    const removeFromOldParent = (sourceId) => {
        const source = elementStore.elMap.get(sourceId);
        if (!source) return; // 无效元素直接返回

        const oldParentId = source.parentId;
        // 从原父节点的children中移除
        if (oldParentId) {
            const oldParent = elementStore.elMap.get(oldParentId);
            if (oldParent?.children) {
                oldParent.children = oldParent.children.filter(id => id !== sourceId);
            }
        } else {
            // 顶级节点从rootIds中移除
            elementStore.rootIds = elementStore.rootIds.filter(id => id !== sourceId);
        }
    };

    // 1. 插入到目标节点前面（同级）
    const moveBefore = (sourceId, targetId) => {
        // 边界校验
        if (sourceId === targetId) return; // 不能自己移动到自己前面
        const source = elementStore.elMap.get(sourceId);
        const target = elementStore.elMap.get(targetId);
        if (!source || !target) return; // 元素不存在

        // 步骤1：从原父节点移除
        removeFromOldParent(sourceId);

        // 步骤2：插入到目标节点前面（同目标节点的父级）
        const targetParentId = target.parentId;
        const newParent = targetParentId ? elementStore.elMap.get(targetParentId) : null;

        // 更新source的parentId为目标节点的父级（保持同级）
        source.parentId = targetParentId;

        if (newParent) {
            // 目标节点有父级：插入到目标节点在父级children中的索引位置
            const targetIndex = newParent.children.indexOf(targetId);
            if (targetIndex !== -1) {
                newParent.children.splice(targetIndex, 0, sourceId);
            }
        } else {
            // 目标节点是顶级节点：插入到rootIds中目标节点的索引位置
            const targetIndex = elementStore.rootIds.indexOf(targetId);
            if (targetIndex !== -1) {
                elementStore.rootIds.splice(targetIndex, 0, sourceId);
            }
        }
    };

// 2. 插入到目标节点后面（同级）
    const moveAfter = (sourceId, targetId) => {
        // 边界校验
        if (sourceId === targetId) return;
        const source = elementStore.elMap.get(sourceId);
        const target = elementStore.elMap.get(targetId);
        if (!source || !target) return;

        // 步骤1：从原父节点移除
        removeFromOldParent(sourceId);

        // 步骤2：插入到目标节点后面（同目标节点的父级）
        const targetParentId = target.parentId;
        const newParent = targetParentId ? elementStore.elMap.get(targetParentId) : null;

        // 更新source的parentId为目标节点的父级（保持同级）
        source.parentId = targetParentId;

        if (newParent) {
            // 目标节点有父级：插入到目标节点索引+1的位置
            const targetIndex = newParent.children.indexOf(targetId);
            if (targetIndex !== -1) {
                newParent.children.splice(targetIndex + 1, 0, sourceId);
            }
        } else {
            // 目标节点是顶级节点：插入到rootIds中目标节点索引+1的位置
            const targetIndex = elementStore.rootIds.indexOf(targetId);
            if (targetIndex !== -1) {
                elementStore.rootIds.splice(targetIndex + 1, 0, sourceId);
            }
        }
    };

// 3. 插入到目标节点中（作为子节点）
    const moveAsChild = (sourceId, targetId) => {
        // 边界校验
        if (sourceId === targetId) return; // 不能自己作为自己的子节点
        const source = elementStore.elMap.get(sourceId);
        const target = elementStore.elMap.get(targetId);
        if (!source || !target) return;

        // 禁止循环嵌套（避免父节点成为子节点的子节点）
        let current = target;
        while (current) {
            if (current.id === sourceId) return; // 目标节点是源节点的子节点，禁止嵌套
            current = current.parentId ? elementStore.elMap.get(current.parentId) : null;
        }

        // 步骤1：从原父节点移除
        removeFromOldParent(sourceId);

        // 步骤2：添加到目标节点的children中
        if (!target.children) target.children = [];
        target.children.push(sourceId);
        // 更新source的parentId为目标节点ID
        source.parentId = targetId;
        // 确保目标节点展开，显示子节点
        target.isExpanded = true;
    };

    return {
        selectedDirTitleId,
        selectedShowDirTitleId,
        selectedShowDirTitleIds,
        moveBefore,
        moveAfter,
        moveAsChild
    }
})

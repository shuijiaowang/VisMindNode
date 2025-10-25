

<template>
  <div class="toolbar">
    <button @click="createNewTitle">新建标题</button>
    <button @click="createNewMarkdown">新建文档</button>
    <button @click="createNewText">新建文本</button>
    <button @click="resetView">重置视图</button>
    <button @click="clearAllData">删除所有数据</button>
    <button @click="elementStore.generateTestComponents()">压力测试</button>
    <button @click="exportData">导出数据</button>
    <input
        type="file"
        id="importFile"
        accept=".json"
        style="display: none"
        @change="handleImport"
    >
    <button @click="triggerImport">导入数据</button>
    <button @click="zoomIn">放大</button>
    <button @click="zoomOut">缩小</button>
    <span class="zoom-level">{{ (viewStore.scale * 100).toFixed(0) }}%</span>
  </div>
</template>
<script setup >
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasStore} from "@/stores/canvasStore.js";
import {nextTick} from "vue";
import {canvasDB} from "@/utils/indexedDB.js";
const canvasStore = useCanvasStore()
const elementStore=useCanvasElementStore()
const areaStore= useCanvasAreaStore()
const viewStore=useCanvasViewStore()
const mouseStore=  useCanvasMouseStore()

// 放大按钮功能
function zoomIn() {
  const zoomSpeed = 0.2
  viewStore.scale = Math.min(viewStore.scale * (1 + zoomSpeed), 5)
}

// 缩小按钮功能
function zoomOut() {
  const zoomSpeed = 0.2
  viewStore.scale = Math.max(viewStore.scale / (1 + zoomSpeed), 0.1)
}

// 重置视图（回到初始位置和缩放）
// 完善重置逻辑
const resetView = async () => {
  // 重置基础状态
  viewStore.offsetX = 0
  viewStore.offsetY = 0
  viewStore.scale = 1

  // 等待DOM更新完成
  await nextTick()
}

// 新增方法
const createNewTitle = () => {
  elementStore.createTitle(areaStore.windowCenterInCanvas.x, areaStore.windowCenterInCanvas.y)
}

const createNewMarkdown = () => {
  // 在视图中心创建markdown
  elementStore.createMarkdown(areaStore.windowCenterInCanvas.x, areaStore.windowCenterInCanvas.y)
}
const createNewText = () => {
  const options={
    type: 'text',
    content: '请输入内容',
    x: areaStore.windowCenterInCanvas.x,
    y: areaStore.windowCenterInCanvas.y,
  }
  elementStore.createElement(options)
}

// 删除所有数据
function clearAllData() {
  canvasStore.clearAllData()
}
// 导出数据
const exportData = async () => {
  try {
    const data = await canvasDB.exportData();
    if (!data) {
      alert("没有可导出的数据");
      return;
    }

    // 转换为JSON字符串
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement("a");
    a.href = url;
    a.download = `canvas-backup-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();

    // 清理资源
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("导出失败:", error);
    alert("导出数据失败，请查看控制台");
  }
};

// 触发导入文件选择
const triggerImport = () => {
  document.getElementById("importFile").click();
};

// 处理导入数据
const handleImport = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 读取文件内容
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        // 验证导入数据格式
        if (!importedData.elements || !importedData.viewState) {
          throw new Error("无效的导入文件格式");
        }

        // 清空现有数据
        elementStore.clearAllElements();
        viewStore.resetView();

        // 导入元素数据
        importedData.elements.forEach(el => {
          elementStore.elMap.set(el.id, el);
          if (!el.parentId) elementStore.rootIds.push(el.id);
        });

        // 导入视图状态
        viewStore.offsetX = importedData.viewState.offsetX ?? 0;
        viewStore.offsetY = importedData.viewState.offsetY ?? 0;
        viewStore.scale = importedData.viewState.scale ?? 1;

        // 保存到数据库
        await canvasDB.save(importedData);
        alert("数据导入成功");
      } catch (err) {
        console.error("解析导入数据失败:", err);
        alert("导入失败：" + err.message);
      }
    };
    reader.readAsText(file);
  } finally {
    // 重置文件输入，允许重复选择同一文件
    e.target.value = "";
  }
};
</script>
<style scoped>
.toolbar {
  font-size: 13px;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.toolbar button {
  font-size: 13px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
  /*transition: background-color 0.2s;*/
}
.toolbar button:hover {
  background-color: #359e75;
}

.zoom-level {
  align-self: center;
  color: #666;
}
</style>
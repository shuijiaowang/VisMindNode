<template>
  <div
      class="text-component"
      :style="{
        transform: `translate(${x}px, ${y}px)`,
        fontSize: `${style.fontSize || '16px'}`,
        color: style.color || '#333',
        backgroundColor: style.backgroundColor || 'transparent',
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab'
      }"
      :class="{ 'selected': isSelected, 'dragging': isDragging }"
      @mousedown.stop="startDrag"
      @dblclick="handleDblClick"
  >
    <TextEditor
        :id="props.id"
        v-model="props.content"
        placeholder="请输入标题"
        :minWidth="100"
        :style="{ fontSize:`${style.fontSize || '18px'}`, color: 'black' }"
    />
  </div>
</template>

<script setup>
// 保持原有逻辑不变
import {computed, ref,defineEmits, nextTick, watch, onMounted} from "vue";
import {useDraggable} from "@/composables/useDraggable.js";
import {useCanvasStore} from "@/stores/canvasStore.js";
import TextEditor from "@/components/canvas/TextEditor.vue";
const canvasStore = useCanvasStore()

const props = defineProps({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  content: { type: String, default: '' },
  style: { type: Object, default: () => ({}) }
})

const isSelected = computed(() => canvasStore.selectedElementIds.has(props.id))
const { isDragging, startDrag } = useDraggable(
    'text',
    props.id,
    props.x,
    props.y
)
</script>

<style scoped>
.text-component {
  padding: 8px 10px;
  border-radius: 6px;
  transition: all 0.15s ease;
  width: auto; /* 让父容器宽度自适应内容 */
  min-width: 100px; /* 调整最小宽度为更合理的值 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: #c0c0c0 1px solid;
  /* 移除overflow限制，允许内容撑开宽度 */
}

.text-component:hover {
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 25px; /*悬浮，扩大，方便选中拖拽等*/
}

.text-component.selected {
  outline: 2px solid #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
  background-color: white;
}

.text-component.dragging {
  opacity: 0.85;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
</style>
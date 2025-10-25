<!-- DirectoryTitleItem.vue -->
<template>
  <div
      class="directory-title-item"
      :style="{ paddingLeft: `${level * 20}px` }"
  >
  <span @dblclick="handleJump">{{ element.content }}</span>
  <input
      v-if="isEditing"
      v-model="editContent"
      @blur="handleSaveEdit"
  >
  </div>
</template>

<script setup>
const props = defineProps({
  id: { type: String, required: true }, // 对应elementStore中的标题id
  level: { type: Number, default: 0 } // 层级深度，用于计算缩进
})

// 直接从全局存储获取数据
const elementStore = useCanvasElementStore()
const element = computed(() => elementStore.elMap.get(props.id))
</script>
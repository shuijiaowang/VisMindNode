<script setup>

import CanvasView from "@/components/CanvasView.vue";
import {useCanvasMouseStore} from "@/stores/canvasMouseStore.js";
import {useCanvasViewStore} from "@/stores/canvasViewStore.js";
import {useCanvasAreaStore} from "@/stores/canvasAreaStore.js";
import {useCanvasElementStore} from "@/stores/canvasElementStore.js";
import {useCanvasStore} from "@/stores/canvasStore.js";
const canvasStore = useCanvasStore()
const elementStore=useCanvasElementStore()
const areaStore= useCanvasAreaStore()
const viewStore=useCanvasViewStore()
const mouseStore=  useCanvasMouseStore()

</script>

<template>
  <CanvasView/>
</template>

<style >
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body {
  height: 100%;
  width: 100%;
}
#app {
  height: 100%;
  width: 100%;
}
</style>

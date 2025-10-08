<template>
  <div id="cy"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import cytoscape from 'cytoscape'

onMounted(() => {
  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [
      { data: { id: 'a', label: '节点A' }, position: { x: 100, y: 100 }},
      { data: { id: 'b', label: '节点B' }, position: { x: 200, y: 200 }},
      { data: { id: 'ab', source: 'a', target: 'b' }},
      { data: { id: 'ac', source: 'a', target: 'c' }},
      { data: { id: 'c', label: '节点C' }, position: { x: 300, y: 360 }}
    ],
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#fff',
          'border-color': '#999',
          'border-width': 2,
          'shape': 'rectangle',
          'width': 80,
          'height': 40,
          'label': 'data(label)',
          'text-halign': 'center',
          'text-valign': 'center',
          'color': '#333',
          'font-size': 16,
          'border-radius': 6,
          'box-shadow': '3px 3px 5px rgba(0,0,0,0.2)'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 1,
          'line-color': '#ccc',
          'target-arrow-color': '#ccc',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: { name: 'preset' }
  })
  cy.boxSelectionEnabled(true); // 开启框选 //需要快捷键ctrl？
  cy.on('boxselect', (evt) => {
    console.log('选中的节点:', evt.targets.nodes());
  });

  // 双击编辑节点
  cy.on('dblclick', 'node', (evt) => {
    const node = evt.target;
    const pos = node.position();

    const input = document.createElement('input');
    input.value = node.data('label') || '';
    input.style.position = 'absolute';
    input.style.left = (pos.x - 40) + 'px';
    input.style.top = (pos.y - 20) + 'px';
    input.style.width = '80px';
    input.style.height = '40px';
    input.style.zIndex = 1000;
    document.body.appendChild(input);
    input.focus();

    input.addEventListener('blur', () => {
      node.data('label', input.value);
      document.body.removeChild(input);
    });
  });
})
</script>

<style scoped>
#cy {
  width: 1200px;
  height: 100vh;
  border: 1px solid #ccc;
}
</style>
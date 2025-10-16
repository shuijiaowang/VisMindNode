/**
 * 画布元素通用数据结构
 * @typedef {Object} Element
 * @property {string} id - 唯一标识（uuid）
 * @property {'title' | 'markdown' | 'list' | 'card'} type - 元素类型
 * @property {number} x - 元素左上角X坐标（相对于画布原点）
 * @property {number} y - 元素左上角Y坐标（相对于画布原点）
 * @property {number} [width] - 元素宽度（可选，部分元素自动计算）
 * @property {number} [height] - 元素高度（可选，部分元素自动计算）
 * @property {string} content - 内容（标题文本/markdown源码等）
 * @property {Object} [style] - 样式配置
 * @property {number} [style.fontSize] - 字体大小
 * @property {string} [style.color] - 文字颜色
 * @property {string} [style.backgroundColor] - 背景色
 * @property {string|null} parentId - 父元素ID（顶级元素为null）
 * @property {string[]} children - 子元素ID数组（维护层级）
 * @property {number} zIndex - 层级优先级（越大越靠上）
 * @property {boolean} isLocked - 是否锁定（禁止拖拽/编辑）
 * @property {boolean} isShow - 是否常驻显示（子元素是否常展开）
 * @property {number} createdAt - 创建时间戳
 */

// 示例对象
const elementExample = {
    id: 'uuid-123',
    type: 'title',
    x: 100,
    y: 200,
    content: '示例标题',
    parentId: null,
    children: ['uuid-456'],
    zIndex: 1,
    isLocked: false,
    isShow: true,
    createdAt: Date.now()
};


/**
 * 画布全局状态
 * @typedef {Object} CanvasState
 * @property {number} offsetX - 画布X轴偏移量
 * @property {number} offsetY - 画布Y轴偏移量
 * @property {number} scale - 缩放比例（0.1~5）
 * @property {Object} windowCenterInCanvas - 基于画布坐标，窗口正中心在画布中的坐标
 * @property {number} windowCenterInCanvas.x
 * @property {number} windowCenterInCanvas.y
 * @property {Object} visibleAreaInCanvasBounds -
 * @property {number} visibleAreaInCanvasBounds.minX - 左边界
 * @property {number} visibleAreaInCanvasBounds.maxX - 右边界
 * @property {number} visibleAreaInCanvasBounds.minY - 上边界
 * @property {number} visibleAreaInCanvasBounds.maxY - 下边界
 * @property {Map<string, Element>} elMap - 元素ID到元素的映射（Map结构）
 * @property {string[]} rootIds - 顶级元素ID数组（parentId为null）
 * @property {string[]} selectedElementIds - 当前选中的元素ID集合
 * @property {string|null} activeElementId - 正在编辑的元素ID
 * @property {Object} history - 历史记录
 * @property {CanvasAction[]} history.ctrlZStack - 撤销栈
 * @property {CanvasAction[]} history.ctrlYStack - 重做栈
 * @property {number} history.maxHistoryLength - 最大历史记录数
 */

/**
 * 操作历史单元
 * @typedef {Object} CanvasAction
 * @property {'create' | 'update' | 'delete' | 'move' | 'scale'} type - 操作类型
 * @property {number} timestamp - 操作时间戳
 * @property {*} data - 操作数据（根据类型存储不同内容）
 */
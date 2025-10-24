// src/utils/indexedDB.js
export const canvasDB = {
    dbName: 'canvasDatabase',
    storeName: 'canvasState',
    version: 1,
    db: null,

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            // 数据库升级时创建存储对象
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    // 创建存储对象，以固定key存储唯一状态
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => {
                console.error('IndexedDB初始化失败:', e);
                reject(e);
            };
        });
    },

    // 保存数据（覆盖式保存）
    async save(data) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            // 存储唯一键为'canvasState'的记录
            store.put({ id: 'canvasState', ...data });

            transaction.oncomplete = resolve;
            transaction.onerror = reject;
        });
    },

    // 加载数据
    async load() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get('canvasState');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = reject;
        });
    },

    // 清空数据
    async clear() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            store.delete('canvasState');

            transaction.oncomplete = resolve;
            transaction.onerror = reject;
        });
    },
    // 导出数据
    async exportData() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get('canvasState');

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = reject;
        });
    }
};
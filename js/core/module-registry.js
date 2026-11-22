/**
 * 华夏器道 · 插件化模块注册中心 (AppRegistry)
 * 职责：管理模块生命周期 (phase 1/2/3)、全局公开 API 命名空间、主题/语言分发及统一检索聚合。
 */
(function (global) {
    'use strict';

    const modules = new Map();
    const bootOrder = [];
    const bootedIds = new Set();

    global.HuaxiaApp = global.HuaxiaApp || {
        bus: global.AppBus,
        store: global.AppStore,
        modules: {}
    };

    function register(def) {
        if (!def || !def.id) {
            console.warn('[AppRegistry] 忽略无效模块定义:', def);
            return null;
        }
        if (modules.has(def.id)) {
            return modules.get(def.id);
        }
        const entry = {
            id: def.id,
            phase: def.phase || 3,
            init: typeof def.init === 'function' ? def.init : null,
            onLangChange: typeof def.onLangChange === 'function' ? def.onLangChange : null,
            onThemeChange: typeof def.onThemeChange === 'function' ? def.onThemeChange : null,
            getSearchItems: typeof def.getSearchItems === 'function' ? def.getSearchItems : null,
            publicApi: def.publicApi || {}
        };
        modules.set(entry.id, entry);
        bootOrder.push(entry);
        global.HuaxiaApp.modules[entry.id] = entry.publicApi;

        // 若提供了兼容全局方法名，统一绑定至 window
        if (def.globalBindings && typeof def.globalBindings === 'object') {
            Object.keys(def.globalBindings).forEach((name) => {
                global[name] = def.globalBindings[name];
            });
        }
        return entry;
    }

    function bootPhase(phase) {
        for (let i = 0; i < bootOrder.length; i++) {
            const entry = bootOrder[i];
            if (entry.phase !== phase || bootedIds.has(entry.id)) continue;
            bootedIds.add(entry.id);
            if (entry.init) {
                try {
                    entry.init({
                        bus: global.AppBus,
                        store: global.AppStore,
                        registry: global.AppRegistry
                    });
                } catch (err) {
                    console.warn(`[AppRegistry] 模块 ${entry.id} (phase ${phase}) 初始化异常:`, err);
                }
            }
        }
    }

    function get(id) {
        const entry = modules.get(id);
        return entry ? entry.publicApi : null;
    }

    function list() {
        return Array.from(modules.keys());
    }

    function collectSearchItems(lang) {
        const items = [];
        for (let i = 0; i < bootOrder.length; i++) {
            const entry = bootOrder[i];
            if (!entry.getSearchItems) continue;
            try {
                const res = entry.getSearchItems(lang || (global.AppStore ? global.AppStore.get('lang') : 'zh'));
                if (Array.isArray(res)) {
                    for (let j = 0; j < res.length; j++) items.push(res[j]);
                }
            } catch (err) {
                console.warn(`[AppRegistry] 收集检索项失败 (${entry.id}):`, err);
            }
        }
        return items;
    }

    if (global.AppBus) {
        global.AppBus.on('lang:changed', (payload) => {
            const lang = (payload && payload.lang) || (global.AppStore ? global.AppStore.get('lang') : 'zh');
            bootOrder.forEach((entry) => {
                if (entry.onLangChange) {
                    try { entry.onLangChange(lang); } catch (err) { console.warn(`[AppRegistry] onLangChange(${entry.id}):`, err); }
                }
            });
        });
        global.AppBus.on('theme:changed', (payload) => {
            const theme = (payload && payload.theme) || (global.AppStore ? global.AppStore.get('theme') : 'light');
            bootOrder.forEach((entry) => {
                if (entry.onThemeChange) {
                    try { entry.onThemeChange(theme); } catch (err) { console.warn(`[AppRegistry] onThemeChange(${entry.id}):`, err); }
                }
            });
        });
    }

    global.AppRegistry = {
        register,
        bootPhase,
        get,
        list,
        collectSearchItems
    };
    global.HuaxiaApp.registry = global.AppRegistry;
})(window);

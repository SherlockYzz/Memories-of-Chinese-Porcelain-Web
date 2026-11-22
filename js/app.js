/**
 * 华夏器道 · 天青泥火 — 微内核启动引导器 (App Bootstrap)
 * 所有业务功能已解耦至 js/core/* 与 js/modules/*，本文件仅负责按三阶段调度 AppRegistry.bootPhase()。
 */
(function (global) {
    'use strict';

    function bootApplication() {
        if (!global.AppRegistry) return;

        // 阶段一：首屏导航、主题、WebGL/2D 背景与 3D 展馆初始化
        global.AppRegistry.bootPhase(1);
        try {
            if (typeof global.initThreeJS === 'function') global.initThreeJS();
        } catch (err) {
            console.warn('[华夏器道-引导] 3D 展馆初始化异常:', err);
        }

        const langToggleBtn = document.getElementById('lang-toggle');
        if (langToggleBtn && typeof global.toggleLanguage === 'function') {
            langToggleBtn.addEventListener('click', global.toggleLanguage);
        }

        // 阶段二：次屏主画廊、通史、窑系图谱与点茶渲染
        requestAnimationFrame(() => {
            global.AppRegistry.bootPhase(2);
            if (typeof global.initPotteryWorkshop === 'function') {
                try { global.initPotteryWorkshop(); } catch (e) {}
            }
        });

        // 阶段三：长页面深度研学实验室、快捷键、命令面板与新增扩展插件
        setTimeout(() => {
            global.AppRegistry.bootPhase(3);
            if (typeof global.initAiRecognition === 'function') {
                try { global.initAiRecognition(); } catch (e) {}
            }
        }, 80);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootApplication);
    } else {
        bootApplication();
    }
})(window);

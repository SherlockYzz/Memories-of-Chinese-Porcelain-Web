/**
 * 模块：昼夜主题管理器 (theme-manager)
 * 职责：管理【晴窗抚古(light)】与【夜宴观瓷(dark)】主题切换、持久化与状态同步，通过 AppBus 广播 theme:changed。
 */
(function (global) {
    'use strict';

    function setMuseumTheme(theme, showToastMsg = true, silentBoot = false) {
        const nextTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        if (global.AppStore) global.AppStore.set('theme', nextTheme);

        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            themeMeta.setAttribute('content', nextTheme === 'dark' ? '#080C10' : '#F4EFE6');
        }

        const navIcon = document.getElementById('theme-toggle-icon');
        const navLabel = document.getElementById('theme-toggle-label');
        const stageBtnDay = document.getElementById('stage-btn-day');
        const stageBtnNight = document.getElementById('stage-btn-night');
        const floatIcon = document.getElementById('floating-theme-icon');
        const floatTitle = document.getElementById('floating-theme-title');
        const floatSub = document.getElementById('floating-theme-sub');

        if (nextTheme === 'dark') {
            if (navIcon) navIcon.className = 'fa-solid fa-sun text-amber-400 text-xs';
            if (navLabel) navLabel.textContent = '晴窗抚古';
            if (stageBtnDay) {
                stageBtnDay.classList.remove('active-theme-pill');
                stageBtnDay.classList.add('text-text-muted');
            }
            if (stageBtnNight) {
                stageBtnNight.classList.add('active-theme-pill');
                stageBtnNight.classList.remove('text-text-muted');
            }
            if (floatIcon) floatIcon.className = 'fa-solid fa-sun text-amber-400';
            if (floatTitle) { floatTitle.textContent = '切至白昼晴窗'; floatTitle.className = 'font-bold text-tianqing-deep'; }
            if (floatSub) floatSub.textContent = '当前：暗夜夜宴';

            if (showToastMsg && global.ToastService) {
                global.ToastService.show('🌙 已切换至【夜宴观瓷 · 故宫夜巡】暗夜沉浸主题！浑天流金星轨与烛光已亮起');
            }
            if (typeof global.switchRealisticSceneEnv === 'function') {
                global.switchRealisticSceneEnv('palace', false);
            }
        } else {
            if (navIcon) navIcon.className = 'fa-solid fa-moon text-tianqing-deep text-xs';
            if (navLabel) navLabel.textContent = '夜宴观瓷';
            if (stageBtnDay) {
                stageBtnDay.classList.add('active-theme-pill');
                stageBtnDay.classList.remove('text-text-muted');
            }
            if (stageBtnNight) {
                stageBtnNight.classList.remove('active-theme-pill');
                stageBtnNight.classList.add('text-text-muted');
            }
            if (floatIcon) floatIcon.className = 'fa-solid fa-moon text-blue-400';
            if (floatTitle) { floatTitle.textContent = '切至暗夜夜宴'; floatTitle.className = 'font-bold text-amber-500'; }
            if (floatSub) floatSub.textContent = '当前：白昼晴窗';

            if (showToastMsg && global.ToastService) {
                global.ToastService.show('☀️ 已切换至【晴窗抚古 · 澄心堂】宋韵白昼宣纸雅集主题！温润天光映照青瓷玉质');
            }
            if (typeof global.switchRealisticSceneEnv === 'function') {
                global.switchRealisticSceneEnv('studio', false);
            }
        }

        if (global.AppBus) {
            global.AppBus.emit('theme:changed', { theme: nextTheme, silent: !!silentBoot });
            if (!silentBoot) {
                global.AppBus.emit('ambient:shockwave', {
                    x: global.innerWidth * 0.5,
                    y: global.innerHeight * 0.5
                });
            }
        }
        if (typeof global.applyDomTranslations === 'function' && global.AppStore && global.AppStore.get('lang') === 'en') {
            global.applyDomTranslations('en');
        }
    }

    function toggleMuseumTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        setMuseumTheme(current === 'light' ? 'dark' : 'light', true, false);
    }

    global.AppRegistry.register({
        id: 'theme-manager',
        phase: 1,
        init: function ({ store }) {
            const initialTheme = (store && store.get('theme')) || document.documentElement.getAttribute('data-theme') || 'light';
            setMuseumTheme(initialTheme, false, true);
        },
        publicApi: { setMuseumTheme, toggleMuseumTheme },
        globalBindings: { setMuseumTheme, toggleMuseumTheme }
    });
})(window);

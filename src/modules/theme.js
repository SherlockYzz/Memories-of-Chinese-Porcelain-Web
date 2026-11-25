/**
 * 模块：主题切换 (theme)
 * 浅色（宣纸）/ 深色（夜展）。写 <html data-theme>、持久化到 store，并广播 theme:changed；
 * 其他模块（背景、三维展馆）自行订阅该事件，本模块不直接调用它们。
 */
import { defineModule, store, bus, toast, legacy, $$ } from '@core';

const THEME_COLOR = { light: '#F4EFE6', dark: '#080C10' };

function syncControls(theme) {
    const dark = theme === 'dark';
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    const label = document.getElementById('theme-toggle-label');
    if (label) label.textContent = dark ? '切换到浅色主题' : '切换到深色主题';
    $$('[data-theme-option]').forEach((btn) => {
        const active = btn.getAttribute('data-theme-option') === theme;
        btn.classList.toggle('active-theme-pill', active);
        btn.classList.toggle('text-text-muted', !active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function setTheme(theme, { announce = true, silent = false } = {}) {
    const next = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    store.set('theme', next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[next]);
    syncControls(next);
    if (announce) toast.show(next === 'dark' ? '已切换到深色主题（夜展）' : '已切换到浅色主题（宣纸）');
    // 三维展馆的环境随主题切换（旧脚本尚未改为订阅事件，先经 legacy 桥转发）。
    legacy.call('switchRealisticSceneEnv', next === 'dark' ? 'palace' : 'studio', false);
    bus.emit('theme:changed', { theme: next, silent });
    if (!silent) bus.emit('bg:pulse', { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 });
}

function toggleTheme() {
    setTheme(store.get('theme') === 'light' ? 'dark' : 'light');
}

export default defineModule({
    id: 'theme',
    phase: 1,
    init() {
        setTheme(store.get('theme') || document.documentElement.getAttribute('data-theme') || 'light', { announce: false, silent: true });
    },
    actions: {
        toggleMuseumTheme: toggleTheme,
        setMuseumTheme: (_ctx, theme) => setTheme(theme)
    },
    api: { setTheme, toggleTheme }
});

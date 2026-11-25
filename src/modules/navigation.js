/**
 * 模块：导航 (navigation)
 * - 顶栏的“幕”菜单与移动端抽屉都由 content/navigation.json 渲染；
 * - 负责滚动高亮（当前板块 / 当前幕）、阅读进度条、回到顶部按钮；
 * - 当前板块变化时广播 section:changed（背景、护照、导览都订阅它），并写入 store.activeSection。
 */
import { defineModule, data, store, bus, modal, toast, registry, i18n, html, setHTML, $, $$ } from '@core';

const pick = (obj) => (obj && (obj[i18n.currentLang()] || obj.zh)) || '';

let sectionEls = [];
let flatSections = [];
let progressBar = null;
let openAct = null;

function allSections() {
    const out = [{ id: 'hero', act: null }];
    data.get('navigation').acts.forEach((act) => act.sections.forEach((s) => out.push({ ...s, act: act.id })));
    return out;
}

/** 只渲染页面上真实存在的板块，避免出现点了没反应的入口。 */
function existing(sections) {
    return sections.filter((s) => document.getElementById(s.id));
}

function renderActs() {
    const host = $('[data-nav-acts]');
    if (!host) return;
    const acts = data.get('navigation').acts;
    setHTML(
        host,
        html`${acts.map((act) => html`
        <div class="nav-act" data-act="${act.id}">
            <button type="button" class="nav-act__btn" role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="nav-panel-${act.id}" data-action="toggleNavAct('${act.id}')">
                <span class="nav-act__seal" aria-hidden="true">${act.seal}</span>
                <span class="nav-act__title">${pick(act.title)}</span>
                <i class="fa-solid fa-chevron-down nav-act__caret" aria-hidden="true"></i>
            </button>
            <div class="nav-act__panel" id="nav-panel-${act.id}" role="menu" aria-label="${pick(act.title)}">
                <p class="nav-act__desc">${pick(act.desc)}</p>
                ${existing(act.sections).map((s) => html`
                <a class="nav-act__link" role="menuitem" href="#${s.id}" data-nav-link="${s.id}">
                    <i class="fa-solid ${s.icon}" aria-hidden="true"></i>
                    <span><strong>${pick(s.title)}</strong><small>${pick(s.desc)}</small></span>
                </a>`)}
            </div>
        </div>`)}`
    );
}

function renderDrawer() {
    const host = $('[data-drawer-nav]');
    if (!host) return;
    const acts = data.get('navigation').acts;
    setHTML(
        host,
        html`${acts.map((act) => html`
        <section class="mobile-menu__group" aria-label="${pick(act.title)}">
            <h3 class="mobile-menu__group-title"><span class="nav-act__seal" aria-hidden="true">${act.seal}</span>${pick(act.title)}<small>${pick(act.desc)}</small></h3>
            ${existing(act.sections).map((s) => html`
            <a href="#${s.id}" class="mobile-menu__link" data-nav-link="${s.id}" data-action="closeNavDrawer">
                <i class="fa-solid ${s.icon}" aria-hidden="true"></i><span>${pick(s.title)}</span>
            </a>`)}
        </section>`)}`
    );
}

function setOpenAct(id) {
    openAct = id;
    $$('.nav-act').forEach((el) => {
        const on = el.getAttribute('data-act') === id;
        el.classList.toggle('is-open', on);
        const btn = el.querySelector('.nav-act__btn');
        if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
}

function setMoreOpen(open) {
    const wrap = $('[data-nav-more]');
    if (!wrap) return;
    wrap.classList.toggle('is-open', open);
    const btn = wrap.querySelector('[aria-controls="nav-more-panel"]');
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function openDrawer() {
    const drawer = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    const burger = document.getElementById('hamburger');
    if (!drawer) return;
    if (overlay) overlay.classList.add('active');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    modal.open(drawer, '#mobile-close');
}

function closeDrawer() {
    const drawer = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    const burger = document.getElementById('hamburger');
    if (!drawer || !drawer.classList.contains('active')) return;
    if (overlay) overlay.classList.remove('active');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    modal.close(drawer);
}

function syncBgToggle(enabled) {
    const btn = document.getElementById('bg-motion-toggle');
    const icon = document.getElementById('bg-motion-icon');
    if (btn) btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    if (icon) icon.className = enabled ? 'fa-solid fa-wand-magic-sparkles' : 'fa-solid fa-pause';
}

function toggleBackgroundMotion() {
    const bg = registry.api('webgl-bg');
    if (!bg) return;
    const next = !bg.isEnabled();
    bg.setEnabled(next);
    syncBgToggle(next);
    toast.show(next ? '已开启 3D 背景动效' : '已暂停 3D 背景动效');
}

/* ---------- 滚动：当前板块、进度条、顶栏阴影 ---------- */

function collectSections() {
    flatSections = existing(allSections());
    sectionEls = flatSections.map((s) => document.getElementById(s.id));
}

function currentSectionIndex() {
    const line = window.innerHeight * 0.38;
    let idx = 0;
    for (let i = 0; i < sectionEls.length; i++) {
        if (sectionEls[i].getBoundingClientRect().top <= line) idx = i;
    }
    return idx;
}

let lastIdx = -1;
function onScrollFrame() {
    const y = window.scrollY;
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', y > 50);
    const top = document.getElementById('back-to-top');
    if (top) top.classList.toggle('visible', y > 400);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;

    if (!sectionEls.length) return;
    const idx = currentSectionIndex();
    if (idx === lastIdx) return;
    lastIdx = idx;
    const sec = flatSections[idx];
    store.set('activeSection', sec.id);
    $$('[data-nav-link]').forEach((a) => {
        const on = a.getAttribute('data-nav-link') === sec.id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
    });
    $$('.nav-act').forEach((el) => el.classList.toggle('is-current', el.getAttribute('data-act') === sec.act));
    bus.emit('section:changed', { id: sec.id, index: idx, act: sec.act, total: flatSections.length });
}

function render() {
    renderActs();
    renderDrawer();
    lastIdx = -1;
    onScrollFrame();
}

export default defineModule({
    id: 'navigation',
    phase: 1,
    init(ctx) {
        collectSections();
        progressBar = document.createElement('div');
        progressBar.id = 'read-progress';
        progressBar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(progressBar);
        ctx.onDispose(() => progressBar && progressBar.remove());

        render();
        syncBgToggle(store.get('bgEnabled') !== false);

        let ticking = false;
        ctx.listen(window, 'scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                onScrollFrame();
            });
        }, { passive: true });
        ctx.listen(window, 'resize', () => onScrollFrame(), { passive: true });

        // 菜单：悬停展开（仅指针设备）、点外部或按 Esc 收起、选中链接后收起。
        const acts = $('[data-nav-acts]');
        if (acts && matchMedia('(hover: hover)').matches) {
            ctx.listen(acts, 'pointerover', (e) => {
                const act = e.target.closest('.nav-act');
                if (act) setOpenAct(act.getAttribute('data-act'));
            });
            ctx.listen(acts, 'pointerleave', () => setOpenAct(null));
        }
        ctx.listen(document, 'click', (e) => {
            if (openAct && !e.target.closest('.nav-act__btn')) setOpenAct(null);
            if (!e.target.closest('[data-nav-more]')) setMoreOpen(false);
        });
        ctx.listen(document, 'keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (openAct) setOpenAct(null);
            setMoreOpen(false);
        });
        ctx.listen(document, 'focusin', (e) => {
            if (openAct && !e.target.closest('.nav-act')) setOpenAct(null);
        });

        modal.registerCloser('mobile-menu', closeDrawer);
        // 后加载的板块（懒加载模块插入的 section）就绪后重新收集。
        ctx.subscribe('sections:changed', () => {
            collectSections();
            render();
        });
    },
    destroy() {
        setHTML($('[data-nav-acts]'), '');
        setHTML($('[data-drawer-nav]'), '');
        sectionEls = [];
        flatSections = [];
        progressBar = null;
    },
    onLangChange: render,
    actions: {
        toggleNavAct: (_ctx, id) => setOpenAct(openAct === id ? null : id),
        toggleNavMore: () => setMoreOpen(!$('[data-nav-more]').classList.contains('is-open')),
        openNavDrawer: openDrawer,
        closeNavDrawer: closeDrawer,
        toggleBackgroundMotion,
        toggleWebGLBackgroundMotion: toggleBackgroundMotion
    },
    api: { sections: () => flatSections.slice(), closeDrawer, current: () => (lastIdx >= 0 ? flatSections[lastIdx] : null) }
});

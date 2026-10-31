/**
 * ============================================================================
 * 天青泥火 · ui-enhance.js (v7.0 微交互 & 视口增强层)
 * 加载位置：index.html 中 app.js 之后（最后一个 <script>）。
 * 不修改任何现有函数 / DOM ID，仅追加：
 *   1. 稳定视口高度 --vh（忽略移动端地址栏伸缩的小幅 resize）
 *   2. 朱砂印泥毛边 SVG 滤镜注入
 *   3. 按键「墨点涟漪」+ 触感震动
 *   4. 器型按钮 → 3D 瓷器叩击微震
 *   5. feature-card 釉光跟随鼠标
 *   6. 滚动入场 (IntersectionObserver)
 * ============================================================================
 */
(function () {
    'use strict';
    const root = document.documentElement;
    const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const safe = (fn) => { try { fn(); } catch (e) { console.warn('[ui-enhance]', e); } };

    /* 1. 稳定视口高度 ——————————————————————————————
     * 地址栏伸缩只改变 innerHeight（≤ ~120px）、不改变 innerWidth：
     * 仅在宽度变化、方向变化或高度变化 > 160px 时才更新 --vh，避免画面跳动。 */
    safe(function stableViewport() {
        let w = 0, h = 0;
        const apply = (force) => {
            const nw = window.innerWidth, nh = window.innerHeight;
            if (force || nw !== w || Math.abs(nh - h) > 160) {
                w = nw; h = nh;
                root.style.setProperty('--vh', (nh * 0.01) + 'px');
                root.style.setProperty('--vh-safe', nh + 'px');
            }
        };
        apply(true);
        window.addEventListener('resize', () => apply(false), { passive: true });
        window.addEventListener('orientationchange', () => setTimeout(() => apply(true), 280), { passive: true });
        // 支持 dvh 的浏览器直接使用 dvh，此变量作为旧 iOS 回退
        if (window.CSS && CSS.supports && CSS.supports('height', '100dvh')) root.style.removeProperty('--vh-safe');
    });

    /* 2. 朱砂印泥毛边滤镜 —————————————————————————— */
    safe(function injectSealFilter() {
        if (document.getElementById('ink-rough-defs')) return;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('id', 'ink-rough-defs');
        svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        svg.innerHTML = '<filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">' +
            '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>';
        document.body.appendChild(svg);
    });

    /* 3. 墨点涟漪 + 触感 ———————————————————————————— */
    safe(function ripples() {
        const SEL = '.mode-switch-btn, .scene-env-btn, .ambient-btn, .archive-dynasty-btn, .brush-style-btn, .history-node-btn, .craft-chapter-btn, .model-btn-scroll button, .canvas-quick-toolbar button';
        document.addEventListener('pointerdown', (e) => {
            const el = e.target.closest && e.target.closest(SEL);
            if (!el || el.disabled) return;
            if (navigator.vibrate && e.pointerType === 'touch') navigator.vibrate(8);   // 安卓轻触感；iOS 忽略
            if (REDUCED) return;
            const cs = getComputedStyle(el);
            if (cs.position === 'static') el.style.position = 'relative';
            if (cs.overflow === 'visible') el.style.overflow = 'hidden';
            const r = el.getBoundingClientRect();
            const d = Math.max(r.width, r.height) * 2.2;
            const s = document.createElement('span');
            s.className = 'ink-ripple';
            s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
            el.appendChild(s);
            s.addEventListener('animationend', () => s.remove(), { once: true });
        }, { passive: true });
    });

    /* 4. 器型按钮 → 3D 瓷器微震 ————————————————— */
    safe(function porcelainTremor() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest) return;
            if (e.target.closest('.model-btn-scroll button, [id^="model-btn-"]')) {
                // vesselVibration 是 three-scene.js 的全局 let，同为经典脚本可直接访问
                setTimeout(() => { try { if (typeof vesselVibration !== 'undefined') vesselVibration = 0.5; } catch (_) { } }, 60);
            }
        }, { passive: true });
    });

    /* 5. 釉光跟随 ————————————————————————————————— */
    safe(function glazeGlow() {
        if (!window.matchMedia || !matchMedia('(hover: hover)').matches) return;
        let raf = 0, ev = null;
        document.addEventListener('pointermove', (e) => {
            const card = e.target.closest && e.target.closest('.feature-card');
            if (!card) return;
            ev = { card, x: e.clientX, y: e.clientY };
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                const r = ev.card.getBoundingClientRect();
                ev.card.style.setProperty('--mx', (ev.x - r.left) + 'px');
                ev.card.style.setProperty('--my', (ev.y - r.top) + 'px');
            });
        }, { passive: true });
    });

    /* 6. 滚动入场 ————————————————————————————————— */
    safe(function reveal() {
        if (!('IntersectionObserver' in window)) return;
        const targets = document.querySelectorAll('section .feature-card, section > div > h2, section h2, .archive-card, .kiln-spot-card');
        if (!targets.length) return;
        root.classList.add('js-reveal');
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => {
                if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        targets.forEach((el, i) => {
            el.classList.add('reveal-on-scroll');
            el.style.setProperty('--reveal-delay', ((i % 4) * 0.06) + 's');
            io.observe(el);
        });
        // 安全网：2.5s 后仍未入场的元素强制显示，防止极端情况下内容不可见
        setTimeout(() => document.querySelectorAll('.reveal-on-scroll:not(.in-view)').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 1.2) el.classList.add('in-view');
        }), 2500);
    });
})();

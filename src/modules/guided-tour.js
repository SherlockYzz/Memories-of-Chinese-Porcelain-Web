/**
 * 模块：3 分钟导览 (guided-tour)
 * 按 content/navigation.json 的 tour.steps 自动滚动到各板块、触发演示动作并显示字幕。
 * 任何手动滚轮 / 触摸 / 键盘翻页都会暂停导览，不与用户抢控制权。
 */
import { defineModule, data, actions, i18n, toast, prefersReducedMotion, $ } from '@core';

const pick = (obj) => (obj && (obj[i18n.currentLang()] || obj.zh)) || '';

let steps = [];
let index = -1;
let timer = 0;
let paused = false;
let startedAt = 0;
let remaining = 0;
let autoScrolling = false;

const bar = () => document.getElementById('tour-bar');

function usableSteps() {
    return data.get('navigation').tour.steps.filter((s) => document.getElementById(s.section));
}

function setProgress(ratio) {
    const el = $('[data-tour-progress]');
    if (el) el.style.transform = `scaleX(${ratio})`;
}

function show(i) {
    clearTimeout(timer);
    index = i;
    if (index >= steps.length) return finish();
    const step = steps[index];
    const target = document.getElementById(step.section);
    autoScrolling = true;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => (autoScrolling = false), 1200);
    $('[data-tour-step]').textContent = `${index + 1} / ${steps.length}`;
    $('[data-tour-caption]').textContent = pick(step.caption);
    setProgress(index / steps.length);
    if (step.action) setTimeout(() => !paused && runExpr(step.action), 900);
    remaining = step.seconds * 1000;
    schedule();
}

function runExpr(expr) {
    const m = /^([\w$]+)\((.*)\)$/.exec(expr.trim());
    if (!m) return;
    const args = m[2].trim() ? JSON.parse('[' + m[2].replace(/'/g, '"') + ']') : [];
    actions.run(m[1], ...args);
}

function schedule() {
    clearTimeout(timer);
    if (paused) return;
    startedAt = Date.now();
    timer = setTimeout(() => show(index + 1), remaining);
}

function setPaused(next) {
    if (index < 0) return;
    paused = next;
    const btn = $('[data-tour-pause] i');
    if (btn) btn.className = paused ? 'fa-solid fa-play' : 'fa-solid fa-pause';
    if (paused) {
        clearTimeout(timer);
        remaining = Math.max(1500, remaining - (Date.now() - startedAt));
    } else schedule();
}

function start() {
    steps = usableSteps();
    if (!steps.length) return;
    paused = false;
    const el = bar();
    if (el) el.hidden = false;
    document.documentElement.setAttribute('data-touring', '');
    show(0);
}

function stop() {
    clearTimeout(timer);
    index = -1;
    const el = bar();
    if (el) el.hidden = true;
    document.documentElement.removeAttribute('data-touring');
}

function finish() {
    stop();
    toast.show('导览结束。可以从顶栏任意一幕继续细看。');
}

function onUserScrollIntent() {
    if (index >= 0 && !paused && !autoScrolling) setPaused(true);
}

export default defineModule({
    id: 'guided-tour',
    phase: 3,
    init(ctx) {
        ctx.listen(window, 'wheel', onUserScrollIntent, { passive: true });
        ctx.listen(window, 'touchmove', onUserScrollIntent, { passive: true });
        ctx.listen(window, 'keydown', (e) => {
            if (index < 0) return;
            if (e.key === 'Escape') stop();
            else if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', ' ', 'Home', 'End'].includes(e.key)) onUserScrollIntent();
        });
        ctx.onDispose(stop);
    },
    onLangChange() {
        if (index >= 0) $('[data-tour-caption]').textContent = pick(steps[index].caption);
    },
    actions: {
        startGuidedTour: start,
        stopGuidedTour: stop,
        tourNext: () => index >= 0 && show(Math.min(index + 1, steps.length)),
        tourPrev: () => index >= 0 && show(Math.max(index - 1, 0)),
        tourTogglePause: () => setPaused(!paused)
    },
    api: { start, stop, isRunning: () => index >= 0 }
});

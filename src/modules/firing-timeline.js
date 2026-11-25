/**
 * 模块：1300℃ 烧成全过程温度时间轴 (firing-timeline)
 * 挂载于 #firing-timeline-mount（造物工坊下方），拖动温度条展示 25℃–1300℃ 八个物相与呈色阶段。
 */
import { defineModule, data, html, setHTML } from '@core';

let cfg = null;
let currentStageIdx = 6; // 默认停在 1250℃ 还原显色阶段

function updateView(idx) {
    if (!cfg || !cfg.stages.length) return;
    currentStageIdx = Math.max(0, Math.min(cfg.stages.length - 1, idx));
    const st = cfg.stages[currentStageIdx];

    const slider = document.getElementById('firing-temp-slider');
    if (slider) slider.value = String(currentStageIdx);

    const badge = document.getElementById('firing-stage-label');
    const phaseEl = document.getElementById('firing-phase-title');
    const descEl = document.getElementById('firing-stage-desc');
    const claySwatch = document.getElementById('firing-clay-swatch');
    const glazeSwatch = document.getElementById('firing-glaze-swatch');
    if (badge) badge.textContent = st.label;
    if (phaseEl) phaseEl.textContent = st.phase;
    if (descEl) descEl.textContent = st.desc;
    if (claySwatch) claySwatch.style.backgroundColor = st.clayColor;
    if (glazeSwatch) glazeSwatch.style.backgroundColor = st.glazeColor;

    document.querySelectorAll('.firing-step-btn').forEach((btn, i) => {
        btn.classList.toggle('is-active', i === currentStageIdx);
        btn.setAttribute('aria-pressed', i === currentStageIdx ? 'true' : 'false');
    });
}

function render() {
    const mount = document.getElementById('firing-timeline-mount');
    if (!mount) return;
    cfg = data.get('firing-timeline');
    setHTML(
        mount,
        html`
        <div class="feature-card p-6 sm:p-8 text-left space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-light">
                <div>
                    <span class="badge bg-tianqing-deep text-white text-[11px] mb-1">热工物相演变</span>
                    <h3 class="text-lg sm:text-xl font-serif-cn font-semibold text-text-title">${cfg.title}</h3>
                </div>
                <span id="firing-stage-label" class="font-mono text-sm font-bold text-amber-500"></span>
            </div>

            <div>
                <input id="firing-temp-slider" type="range" min="0" max="${cfg.stages.length - 1}" step="1" value="${currentStageIdx}"
                       data-action-input="selectFiringStage($number)" aria-label="窑炉温度阶段滑块" class="w-full mb-3">
                <div class="firing-steps">
                    ${cfg.stages.map((s, i) => html`
                        <button type="button" class="firing-step-btn" data-action="selectFiringStage(${i})">
                            <div class="font-mono font-bold">${s.temp}℃</div>
                            <div class="truncate">${s.phase}</div>
                        </button>
                    `)}
                </div>
            </div>

            <div class="grid sm:grid-cols-12 gap-5 items-center p-4 rounded-xl bg-bg-main border border-border-light">
                <div class="sm:col-span-4 flex items-center justify-center gap-4">
                    <div class="text-center">
                        <div id="firing-clay-swatch" class="w-16 h-16 rounded-full border-2 border-white/40 shadow-inner mx-auto"></div>
                        <span class="text-[11px] text-text-muted mt-1.5 block font-serif-cn">胎骨变化</span>
                    </div>
                    <div class="text-center">
                        <div id="firing-glaze-swatch" class="w-16 h-16 rounded-full border-2 border-amber-400/50 shadow-inner mx-auto"></div>
                        <span class="text-[11px] text-text-muted mt-1.5 block font-serif-cn">釉层呈色</span>
                    </div>
                </div>
                <div class="sm:col-span-8 space-y-1.5">
                    <h4 id="firing-phase-title" class="text-base font-serif-cn font-semibold text-tianqing-deep"></h4>
                    <p id="firing-stage-desc" class="text-xs sm:text-sm text-text-body leading-relaxed"></p>
                    <p class="text-[11px] text-text-muted pt-1">${cfg.source}</p>
                </div>
            </div>
        </div>`
    );
    updateView(currentStageIdx);
}

export default defineModule({
    id: 'firing-timeline',
    phase: 3,
    init: render,
    destroy() {
        const mount = document.getElementById('firing-timeline-mount');
        if (mount) setHTML(mount, '');
    },
    actions: {
        selectFiringStage(_ctx, idx) {
            updateView(Number(idx) || 0);
        }
    }
});

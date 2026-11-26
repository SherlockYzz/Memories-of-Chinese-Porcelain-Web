/**
 * 模块：研学护照与成就系统 (passport)
 * 自动记录四幕（识/造/境/问）研学印章，支持个性化题名并导出高清《宋瓷研学证书》PNG。
 */
import { defineModule, data, storage, bus, toast, html, setHTML } from '@core';

const STORAGE_KEY = 'tq_passport_v2';
let earned = new Set();
let scholarName = '博古研学者';

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.stamps)) earned = new Set(parsed.stamps);
            if (parsed.name) scholarName = String(parsed.name);
        }
    } catch {}
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ stamps: Array.from(earned), name: scholarName }));
    } catch {}
}

function earn(id, quiet = false) {
    if (!id || earned.has(id)) return;
    earned.add(id);
    saveState();
    render();
    if (!quiet) {
        const cfg = data.get('passport');
        const st = (cfg.stamps || []).find((s) => s.id === id);
        if (st) toast.show(`研学护照已盖章：【${st.seal} · ${st.title}】`);
    }
}

function exportPassportCertificate() {
    const cfg = data.get('passport');
    const stamps = cfg.stamps || [];
    const c = document.createElement('canvas');
    c.width = 1040;
    c.height = 640;
    const ctx = c.getContext('2d');

    // 宣纸底色与双线框
    ctx.fillStyle = '#F4F1E8';
    ctx.fillRect(0, 0, 1040, 640);
    ctx.strokeStyle = '#224E59';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 992, 592);
    ctx.strokeStyle = '#C8A25A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34, 34, 972, 572);

    ctx.fillStyle = '#142029';
    ctx.font = 'bold 34px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('天青泥火 · 华夏古瓷三维研学证书', 520, 105);

    ctx.fillStyle = '#3A7684';
    ctx.font = '16px "Noto Serif SC", serif';
    ctx.fillText('FROM CLAY TO FIRE, FROM VESSEL TO CONNOISSEURSHIP', 520, 140);

    ctx.fillStyle = '#142029';
    ctx.font = 'bold 24px "Noto Serif SC", serif';
    ctx.fillText(`兹证明 ${scholarName || '博古研学者'} 完成研学护照课程`, 520, 210);

    ctx.fillStyle = '#3E4E5C';
    ctx.font = '17px "Noto Serif SC", serif';
    ctx.fillText(`已收集四幕研学印章：${earned.size} / ${stamps.length} 枚`, 520, 250);

    // 绘制 8 枚印章
    const startX = 150;
    const stepX = 105;
    stamps.forEach((s, i) => {
        const x = startX + i * stepX;
        const y = 345;
        const ok = earned.has(s.id);
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = ok ? '#A8322D' : 'rgba(110, 128, 143, 0.25)';
        ctx.fillRect(-32, -32, 64, 64);
        ctx.strokeStyle = ok ? '#F4F1E8' : '#6E808F';
        ctx.lineWidth = 2;
        ctx.strokeRect(-27, -27, 54, 54);
        ctx.fillStyle = ok ? '#FFFFFF' : '#6E808F';
        ctx.font = 'bold 18px "Noto Serif SC", serif';
        ctx.fillText(s.seal, 0, 7);
        ctx.fillStyle = '#3E4E5C';
        ctx.font = '12px sans-serif';
        ctx.fillText(s.title, 0, 56);
        ctx.restore();
    });

    ctx.fillStyle = '#6E808F';
    ctx.font = '14px "Noto Serif SC", serif';
    ctx.fillText(`签发日期：${new Date().toLocaleDateString()} · 天青泥火数字研学空间`, 520, 535);

    const a = document.createElement('a');
    a.download = `天青泥火_研学证书_${scholarName || '研学者'}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
    toast.show('已生成并下载《天青泥火·研学证书》');
}

function render() {
    const mount = document.getElementById('passport-mount');
    if (!mount) return;
    const cfg = data.get('passport');
    const stamps = cfg.stamps || [];
    const pct = stamps.length ? Math.round((earned.size / stamps.length) * 100) : 0;

    setHTML(
        mount,
        html`
        <div class="feature-card p-6 sm:p-8 space-y-6 text-left">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-light">
                <div class="space-y-1 flex-1">
                    <div class="flex items-center justify-between text-xs font-serif-cn">
                        <span class="font-semibold text-text-title">研学印章收集进度</span>
                        <span class="font-mono text-tianqing-deep font-bold">${earned.size} / ${stamps.length} (${pct}%)</span>
                    </div>
                    <div class="w-full h-2.5 rounded-full bg-bg-main border border-border-light overflow-hidden">
                        <div class="h-full bg-tianqing-deep transition-all" style="width:${pct}%"></div>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <input id="passport-scholar-name" type="text" value="${scholarName}" maxlength="16"
                           data-action-input="setPassportName($value)" aria-label="研学者姓名"
                           class="px-3 py-1.5 rounded-full bg-bg-main border border-border-light text-xs text-text-title w-36" placeholder="输入研学者姓名">
                    <button type="button" class="btn btn--primary text-xs" data-action="exportPassportCert()">
                        <i class="fa-solid fa-certificate" aria-hidden="true"></i>
                        <span>生成研学证书</span>
                    </button>
                </div>
            </div>

            <div class="passport-stamps">
                ${stamps.map((s) => {
                    const ok = earned.has(s.id);
                    return html`
                    <div class="passport-stamp ${ok ? 'is-earned' : ''}">
                        <span class="text-[10px] font-mono text-text-muted">${s.act}幕</span>
                        <div class="passport-seal-mark" aria-hidden="true">${s.seal}</div>
                        <h4 class="text-sm font-serif-cn font-semibold text-text-title">${s.title}</h4>
                        <p class="text-[11px] text-text-muted leading-snug">${s.desc}</p>
                        <span class="text-[10px] ${ok ? 'text-tianqing-deep font-medium' : 'text-text-caption'}">${ok ? '已获印章' : '待解锁'}</span>
                    </div>`;
                })}
            </div>

            <div class="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border-light">
                <span>提示：浏览对应板块或完成互动实验自动盖章，记录存于本机浏览器。</span>
                <button type="button" class="underline hover:text-text-title" data-action="resetPassport()">重置印章记录</button>
            </div>
        </div>`
    );
}

export default defineModule({
    id: 'passport',
    phase: 3,
    init(ctx) {
        loadState();
        render();

        // 所有研学印章均需用户真实交互触发，杜绝首次打开或顺手滑动就自动解锁
        ctx.subscribe('model:selected', (p) => {
            if (p && typeof p.index === 'number' && p.index !== 0) earn('gallery');
        });
        ctx.listen(document, 'click', (ev) => {
            const t = ev.target;
            if (!t || !t.closest) return;
            if (!earned.has('gallery') && t.closest('[id="3d-gallery"] button')) {
                earn('gallery');
            } else if (!earned.has('archive') && t.closest('#archive button, #archive .archive-card')) {
                earn('archive');
            } else if (!earned.has('texture') && t.closest('#ai-recognition button, #ai-recognition label')) {
                earn('texture');
            }
        }, { passive: true });
        ctx.subscribe('study:glaze-complete', () => earn('glaze'));
        ctx.subscribe('study:crackle-complete', () => earn('crackle'));
        ctx.subscribe('study:kintsugi-complete', () => earn('kintsugi'));
        ctx.subscribe('study:tea-complete', () => earn('tea'));
        ctx.subscribe('study:quiz-complete', () => earn('quiz'));
    },
    destroy() {
        const mount = document.getElementById('passport-mount');
        if (mount) setHTML(mount, '');
    },
    actions: {
        openPassport() {
            const el = document.getElementById('passport');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        },
        setPassportName(_ctx, name) {
            scholarName = String(name || '').trim() || '博古研学者';
            saveState();
        },
        exportPassportCert: exportPassportCertificate,
        resetPassport() {
            earned = new Set();
            saveState();
            render();
            toast.show('已重置研学护照印章记录');
        }
    }
});

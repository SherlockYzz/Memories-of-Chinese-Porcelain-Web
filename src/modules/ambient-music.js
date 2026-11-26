/**
 * 模块：天青雅乐 · 古琴鉴赏背景音乐与智能自动开关控制器 (ambient-music)
 * - 默认开启偏好（记忆至 localStorage），首次交互（或浏览器允许时）柔和淡入播放《醉渔唱晚》《阳关三叠》
 * - 智能自动开关：播放视频、语音解说、切至后台时自动淡出暂停避让，结束后自动淡入恢复
 * - 采用 fetch -> Blob URL 单次缓存播放，避免 Range 请求中断，零首屏带宽抢占
 */
import { defineModule, bus, storage, toast, i18n, tr, $ } from '@core';

const PREF_KEY = 'tq_bgm_auto_v1';

const TRACKS = [
    {
        id: 'zuiyu',
        file: 'audio/guqin-zuiyu.mp3',
        title: '醉渔唱晚',
        enTitle: 'Drunken Fisherman Singing at Dusk',
        source: '《天闻阁琴谱》· 古琴'
    },
    {
        id: 'yangguan',
        file: 'audio/guqin-yangguan.mp3',
        title: '阳关三叠',
        enTitle: 'Three Refrains on Yang Pass',
        source: '《琴学入门》· 古琴'
    }
];

const blobCache = new Map();

let audioEl = null;
let trackIndex = 0;
let userEnabled = true; // 默认开启自动背景音乐
let isPlaying = false;
let isLoading = false;
let hasStartedOnce = false;
let fadeTimer = null;
let autoBindRemoved = false;
let dockEl = null;
const duckReasons = new Set();

const TARGET_VOLUME = 0.28;

function isEn() {
    return i18n.currentLang() === 'en';
}

function readPref() {
    const saved = storage.getRaw(PREF_KEY);
    return saved !== 'off';
}

function savePref(on) {
    storage.setRaw(PREF_KEY, on ? 'on' : 'off');
}

function currentTrack() {
    return TRACKS[trackIndex] || TRACKS[0];
}

function clearFade() {
    if (fadeTimer) {
        clearInterval(fadeTimer);
        fadeTimer = null;
    }
}

function fadeTo(targetVol, durationMs, onDone) {
    clearFade();
    if (!audioEl) {
        if (onDone) onDone();
        return;
    }
    const startVol = audioEl.volume || 0;
    const steps = Math.max(4, Math.round(durationMs / 45));
    let cur = 0;
    fadeTimer = setInterval(() => {
        cur++;
        const ratio = Math.min(1, cur / steps);
        if (audioEl) {
            audioEl.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * ratio));
        }
        if (ratio >= 1) {
            clearFade();
            if (onDone) onDone();
        }
    }, 45);
}

function fetchTrackBlobUrl(file) {
    if (!blobCache.has(file)) {
        const p = fetch(file)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then((blob) => URL.createObjectURL(blob))
            .catch((err) => {
                blobCache.delete(file);
                throw err;
            });
        blobCache.set(file, p);
    }
    return blobCache.get(file);
}

function syncUI() {
    const t = currentTrack();
    const en = isEn();
    const name = en ? t.enTitle : t.title;
    const active = isPlaying && userEnabled && duckReasons.size === 0;
    const ducked = userEnabled && duckReasons.size > 0;

    // 同步顶栏与移动抽屉里的菜单按钮
    ['ambient-music-btn', 'mobile-ambient-music-btn'].forEach((id) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.setAttribute('aria-pressed', userEnabled ? 'true' : 'false');
        btn.classList.toggle('is-playing', active);
    });
    const navIcon = document.getElementById('ambient-music-icon');
    if (navIcon) {
        navIcon.className = active
            ? 'fa-solid fa-music text-amber-400 animate-pulse'
            : (userEnabled ? 'fa-solid fa-music' : 'fa-solid fa-volume-xmark');
    }

    // 同步左下角悬浮琴音胶囊
    if (!dockEl) return;
    dockEl.setAttribute('data-state', active ? 'playing' : (ducked ? 'ducked' : (userEnabled ? 'standby' : 'off')));
    const toggleBtn = $('[data-bgm-toggle]', dockEl);
    const labelEl = $('[data-bgm-label]', dockEl);
    const subEl = $('[data-bgm-sub]', dockEl);
    const iconEl = $('[data-bgm-icon]', dockEl);

    if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', userEnabled ? 'true' : 'false');
        toggleBtn.setAttribute('aria-label', userEnabled ? tr('暂停古琴背景雅乐') : tr('开启古琴背景雅乐'));
    }
    if (iconEl) {
        iconEl.className = active
            ? 'fa-solid fa-compact-disc fa-spin'
            : (userEnabled ? 'fa-solid fa-music' : 'fa-solid fa-volume-xmark');
    }
    if (labelEl) {
        labelEl.textContent = `《${name}》`;
    }
    if (subEl) {
        if (isLoading) subEl.textContent = en ? 'Loading…' : '载入琴韵…';
        else if (active) subEl.textContent = en ? 'Guqin · Playing' : '古琴雅乐 · 伴赏';
        else if (ducked) subEl.textContent = en ? 'Auto-paused' : '解说避让中';
        else if (userEnabled) subEl.textContent = en ? 'Tap to play' : '轻触启音';
        else subEl.textContent = en ? 'Muted' : '已静音';
    }
}

async function startPlayback({ silent = false } = {}) {
    if (!userEnabled || duckReasons.size > 0 || isLoading) return false;
    const t = currentTrack();
    isLoading = true;
    syncUI();

    try {
        const blobUrl = await fetchTrackBlobUrl(t.file);
        if (!userEnabled || duckReasons.size > 0) {
            isLoading = false;
            syncUI();
            return false;
        }
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.preload = 'auto';
            audioEl.addEventListener('ended', () => {
                // 一曲终了自动淡入切换下一曲，不枯燥循环单曲
                trackIndex = (trackIndex + 1) % TRACKS.length;
                if (userEnabled && duckReasons.size === 0) {
                    startPlayback({ silent: true });
                } else {
                    syncUI();
                }
            });
        }
        if (audioEl.src !== blobUrl) {
            audioEl.src = blobUrl;
        }
        audioEl.volume = 0.02;
        await audioEl.play();
        isPlaying = true;
        hasStartedOnce = true;
        isLoading = false;
        fadeTo(TARGET_VOLUME, 1400);
        syncUI();
        if (!silent) {
            toast.show(`🎵 ${tr('已开启背景雅乐')}：《${isEn() ? t.enTitle : t.title}》`);
        }
        return true;
    } catch {
        // 浏览器自动播放限制或无音频设备：静默保持待启状态，绝不抛控制台报错
        isPlaying = false;
        isLoading = false;
        syncUI();
        return false;
    }
}

function pausePlayback({ keepIntent = true, fadeMs = 420 } = {}) {
    if (!keepIntent) {
        userEnabled = false;
        savePref(false);
    }
    if (!audioEl || !isPlaying) {
        isPlaying = false;
        syncUI();
        return;
    }
    fadeTo(0.005, fadeMs, () => {
        if (audioEl) {
            try { audioEl.pause(); } catch {}
        }
        isPlaying = false;
        syncUI();
    });
}

function setDuck(reason, active) {
    if (active) {
        duckReasons.add(reason);
        if (isPlaying) pausePlayback({ keepIntent: true, fadeMs: 360 });
        else syncUI();
    } else {
        duckReasons.delete(reason);
        if (duckReasons.size === 0 && userEnabled && !isPlaying && autoBindRemoved) {
            startPlayback({ silent: true });
        } else {
            syncUI();
        }
    }
}

function toggle() {
    autoBindRemoved = true;
    if (userEnabled) {
        // 首次进入尚未启音（且不在解说避让期）时直点按钮则立即启音；已在播放或避让期点击则静音并关闭自动恢复
        if (!isPlaying && duckReasons.size === 0 && !hasStartedOnce) {
            startPlayback({ silent: false });
            return;
        }
        pausePlayback({ keepIntent: false, fadeMs: 300 });
        toast.show(`🔇 ${tr('已静音背景古琴雅乐')}`);
    } else {
        userEnabled = true;
        savePref(true);
        duckReasons.clear();
        startPlayback({ silent: false });
    }
}

function nextTrack() {
    autoBindRemoved = true;
    trackIndex = (trackIndex + 1) % TRACKS.length;
    userEnabled = true;
    savePref(true);
    duckReasons.clear();
    if (audioEl) {
        try { audioEl.pause(); } catch {}
    }
    isPlaying = false;
    startPlayback({ silent: false });
}

function mountDock() {
    if (dockEl || typeof document === 'undefined') return;
    dockEl = document.createElement('div');
    dockEl.id = 'ambient-music-dock';
    dockEl.className = 'ambient-music-dock';
    dockEl.setAttribute('role', 'region');
    dockEl.setAttribute('aria-label', '瓷器鉴赏背景雅乐控制');
    dockEl.innerHTML = `
        <button type="button" class="ambient-music-dock__main" data-action="toggleAmbientGuqin()" data-bgm-toggle aria-pressed="true" title="开关背景古琴雅乐">
            <span class="ambient-music-dock__disc" aria-hidden="true">
                <i class="fa-solid fa-music" data-bgm-icon></i>
            </span>
            <span class="ambient-music-dock__meta">
                <strong class="ambient-music-dock__title" data-bgm-label>《醉渔唱晚》</strong>
                <small class="ambient-music-dock__sub" data-bgm-sub>古琴雅乐 · 轻触启音</small>
            </span>
        </button>
        <button type="button" class="ambient-music-dock__next" data-action="nextAmbientTrack()" title="切换古琴曲目" aria-label="切换下一首古琴雅乐">
            <i class="fa-solid fa-forward-step" aria-hidden="true"></i>
        </button>
    `;
    document.body.appendChild(dockEl);
    syncUI();
}

export default defineModule({
    id: 'ambient-music',
    phase: 3,
    init(ctx) {
        userEnabled = readPref();
        mountDock();

        // 首次真实用户手势触发自动启音（若用户曾点过按钮则由按钮直接处理）
        const onFirstGesture = (ev) => {
            if (autoBindRemoved) return;
            autoBindRemoved = true;
            // 若用户首击的就是琴音开关本身，交由 toggle() 处置，避免重复调用
            if (ev.target && ev.target.closest && ev.target.closest('[data-action*="toggleAmbientGuqin"], [data-action*="nextAmbientTrack"]')) {
                return;
            }
            if (userEnabled && !isPlaying && duckReasons.size === 0 && !document.hidden) {
                setTimeout(() => {
                    if (userEnabled && !isPlaying && duckReasons.size === 0 && !document.hidden) {
                        startPlayback({ silent: true });
                    }
                }, 180);
            }
        };

        ['pointerdown', 'keydown'].forEach((evt) => {
            ctx.listen(window, evt, onFirstGesture, { passive: true, once: true });
        });

        ctx.listen(document, 'visibilitychange', () => {
            setDuck('hidden', document.hidden);
        });

        ctx.subscribe('media:video-active', ({ active }) => setDuck('video', !!active));
        ctx.subscribe('media:curator-active', ({ active }) => setDuck('curator', !!active));
    },
    destroy() {
        clearFade();
        if (audioEl) {
            try { audioEl.pause(); } catch {}
            audioEl = null;
        }
        if (dockEl) {
            dockEl.remove();
            dockEl = null;
        }
        isPlaying = false;
        hasStartedOnce = false;
        duckReasons.clear();
    },
    onLangChange: syncUI,
    actions: {
        toggleAmbientGuqin: toggle,
        nextAmbientTrack: nextTrack
    },
    api: {
        toggle,
        nextTrack,
        setDuck,
        isPlaying: () => isPlaying,
        isEnabled: () => userEnabled
    }
});

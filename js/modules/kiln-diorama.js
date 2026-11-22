/**
 * 模块：Blender 联动 · 宋代龙窑依山烧造 3D 动态微缩沙盘 (kiln-diorama)
 * 职责：加载 models/interactive/kiln_firing_diorama.glb，利用 THREE.AnimationMixer 驱动关键帧动画，
 *       支持四阶段温控跳转、播放/暂停、进度滑块与离屏/切后台自动停帧保护。
 */
(function (global) {
    'use strict';

    const GLB_PATH = 'models/interactive/kiln_firing_diorama.glb';
    const STAGES = [
        { key: 'load', ratio: 0.08, temp: '300℃', zh: '① 装匣入窑', en: '1. Sagger Loading' },
        { key: 'bisque', ratio: 0.35, temp: '850℃', zh: '② 素烧排湿', en: '2. Bisque Dehydration' },
        { key: 'reduce', ratio: 0.68, temp: '1300℃', zh: '③ 柴火强还原', en: '3. 1300℃ Reduction Firing' },
        { key: 'cool', ratio: 0.92, temp: '180℃', zh: '④ 缓冷开片成器', en: '4. Cooling & Crackle' }
    ];

    let renderer = null, scene = null, camera = null;
    let mixer = null, actions = [], clipDuration = 5.0;
    let dioramaGroup = null;
    let resizeObserver = null;
    let pointerListenersBound = false;
    let isPlaying = true;
    let isVisible = false;
    let animId = null;
    let lastTime = 0;
    let orbitTheta = 0.52, orbitPhi = 0.42, orbitRadius = 6.2;
    let dragging = false, lastPt = { x: 0, y: 0 };

    function isEn() {
        return (global.AppStore && global.AppStore.get('lang')) === 'en';
    }

    function mountUiCard() {
        const workshopSection = document.getElementById('workshop');
        if (!workshopSection || document.getElementById('kiln-diorama-panel')) return;
        const container = workshopSection.querySelector('.max-w-7xl');
        if (!container) return;

        const panel = document.createElement('div');
        panel.id = 'kiln-diorama-panel';
        panel.className = 'max-w-6xl mx-auto mt-10 feature-card p-5 sm:p-6 space-y-4';
        container.appendChild(panel);
        renderPanelShell();
    }

    function renderPanelShell() {
        const panel = document.getElementById('kiln-diorama-panel');
        if (!panel) return;
        const en = isEn();
        panel.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border-light pb-3">
                <div class="text-left">
                    <span class="badge bg-amber-700 text-white text-[10px] mb-1">${en ? 'Blender 5.2 Animated GLTF Diorama' : 'Blender 5.2 联动 · 关键帧动画 3D 沙盘'}</span>
                    <h3 class="text-lg sm:text-xl font-serif-cn font-semibold text-text-title">${en ? 'Song Dynasty Dragon Kiln Firing 3D Diorama' : '宋代依山龙窑 · 1300℃ 柴烧还原动态微缩沙盘'}</h3>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" id="kiln-diorama-play-btn" onclick="toggleKilnDioramaPlay()" class="px-4 py-1.5 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors flex items-center gap-1.5">
                        <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}" aria-hidden="true"></i>
                        <span>${en ? (isPlaying ? 'Pause' : 'Play') : (isPlaying ? '暂停动画' : '播放动画')}</span>
                    </button>
                </div>
            </div>
            <div class="grid lg:grid-cols-12 gap-5 items-center">
                <div class="lg:col-span-8 relative rounded-2xl overflow-hidden border border-border-light bg-[#0b1318] aspect-[16/9]">
                    <canvas id="kiln-diorama-canvas" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>
                    <div id="kiln-diorama-hud" class="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono text-amber-300 border border-white/15">
                        1300℃ · ${en ? 'Drag to Orbit' : '拖拽旋转视角'}
                    </div>
                </div>
                <div class="lg:col-span-4 space-y-3 text-left">
                    <div class="p-3.5 rounded-xl bg-bg-main border border-border-light space-y-2">
                        <div class="flex items-center justify-between text-xs font-serif-cn">
                            <span class="text-text-title font-medium">${en ? 'Firing Timeline' : '烧造热工时间轴'}</span>
                            <span id="kiln-diorama-progress-text" class="font-mono text-amber-400">0%</span>
                        </div>
                        <input id="kiln-diorama-slider" type="range" min="0" max="100" step="1" value="0" aria-label="${en ? 'Dragon kiln firing timeline' : '龙窑烧造进度时间轴'}" oninput="seekKilnDiorama(this.value)" class="w-full">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        ${STAGES.map(st => `
                            <button type="button" onclick="jumpKilnDioramaStage('${st.key}')" class="p-2.5 rounded-xl bg-yuebai/60 border border-border-light hover:border-tianqing text-left transition-all">
                                <span class="text-[10px] font-mono text-amber-400 block">${st.temp}</span>
                                <span class="text-xs font-serif-cn text-text-title font-medium">${en ? st.en : st.zh}</span>
                            </button>
                        `).join('')}
                    </div>
                    <p class="text-[11px] text-text-muted leading-relaxed">
                        ${en
                            ? 'Modelled & keyframe-animated in Blender 5.2 LTS: sloped brick tunnel, firebox flames, stacked saggers, porcelain blanks, and chimney smoke.'
                            : '由 Blender 5.2 LTS 实景建模并烘焙关键帧动画导出：展现依山阶梯窑室、窑头烈焰、匣钵叠柱推进、素坯玻化与烟囱升烟全过程。'}
                    </p>
                </div>
            </div>
        `;
    }

    function initScene() {
        const canvas = document.getElementById('kiln-diorama-canvas');
        if (!canvas || renderer || typeof THREE === 'undefined') return;

        try {
            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
            renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 1.5));
            const w = canvas.clientWidth || 640;
            const h = canvas.clientHeight || 360;
            renderer.setSize(w, h, false);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.15;

            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0b1318);
            camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
            updateCameraTransform();

            scene.add(new THREE.AmbientLight(0xd8e8ec, 0.85));
            const key = new THREE.DirectionalLight(0xffe6b8, 1.6);
            key.position.set(4, 6, 5);
            scene.add(key);
            const fireLight = new THREE.PointLight(0xff6b2b, 2.2, 12);
            fireLight.position.set(-1.6, 0.8, 1.2);
            scene.add(fireLight);

            dioramaGroup = new THREE.Group();
            scene.add(dioramaGroup);

            canvas.addEventListener('pointerdown', (e) => { dragging = true; lastPt = { x: e.clientX, y: e.clientY }; });
            if (!pointerListenersBound) {
                pointerListenersBound = true;
                global.addEventListener('pointermove', (e) => {
                    if (!dragging) return;
                    orbitTheta -= (e.clientX - lastPt.x) * 0.008;
                    orbitPhi = Math.max(0.18, Math.min(1.15, orbitPhi + (e.clientY - lastPt.y) * 0.006));
                    lastPt = { x: e.clientX, y: e.clientY };
                    updateCameraTransform();
                    renderSingleFrame();
                });
                global.addEventListener('pointerup', () => { dragging = false; });
            }

            if (typeof THREE.GLTFLoader === 'function') {
                const loader = new THREE.GLTFLoader();
                loader.load(GLB_PATH, (gltf) => {
                    const model = gltf.scene;
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z) || 1;
                    const s = 4.2 / maxDim;
                    model.scale.setScalar(s);
                    model.position.set(-center.x * s, -center.y * s, -center.z * s);
                    dioramaGroup.add(model);

                    if (gltf.animations && gltf.animations.length > 0 && typeof THREE.AnimationMixer === 'function') {
                        mixer = new THREE.AnimationMixer(model);
                        actions = [];
                        let maxDur = 0;
                        gltf.animations.forEach((clip) => {
                            if (clip.duration > maxDur) maxDur = clip.duration;
                            const act = mixer.clipAction(clip);
                            act.play();
                            actions.push(act);
                        });
                        clipDuration = maxDur || 5.0;
                    }
                    renderSingleFrame();
                }, undefined, (err) => {
                    console.warn('[kiln-diorama] GLB load note:', err);
                });
            }

            if ('ResizeObserver' in global) {
                if (resizeObserver) resizeObserver.disconnect();
                resizeObserver = new ResizeObserver(() => {
                    if (!renderer || !camera || !canvas) return;
                    const nw = canvas.clientWidth || 640;
                    const nh = canvas.clientHeight || 360;
                    renderer.setSize(nw, nh, false);
                    camera.aspect = nw / nh;
                    camera.updateProjectionMatrix();
                    renderSingleFrame();
                });
                resizeObserver.observe(canvas);
            }
        } catch (err) {
            console.warn('[kiln-diorama] init failed:', err);
        }
    }

    function updateCameraTransform() {
        if (!camera) return;
        camera.position.set(
            orbitRadius * Math.sin(orbitTheta) * Math.cos(orbitPhi),
            orbitRadius * Math.sin(orbitPhi) + 0.35,
            orbitRadius * Math.cos(orbitTheta) * Math.cos(orbitPhi)
        );
        camera.lookAt(0, 0.1, 0);
    }

    function renderSingleFrame() {
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    function syncProgressUi() {
        if (!actions.length || !clipDuration) return;
        const pct = Math.round(((actions[0].time % clipDuration) / clipDuration) * 100);
        const slider = document.getElementById('kiln-diorama-slider');
        const txt = document.getElementById('kiln-diorama-progress-text');
        if (slider) slider.value = pct;
        if (txt) txt.textContent = `${pct}%`;
    }

    function loop(now) {
        if (!isVisible || !isPlaying || document.hidden) {
            animId = null;
            return;
        }
        animId = requestAnimationFrame(loop);
        if (!lastTime) lastTime = now;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        if (mixer) {
            mixer.update(dt);
            syncProgressUi();
        } else if (dioramaGroup) {
            dioramaGroup.rotation.y += dt * 0.25;
        }
        renderSingleFrame();
    }

    function startLoop() {
        if (animId || !isVisible || !isPlaying || document.hidden) return;
        lastTime = performance.now();
        animId = requestAnimationFrame(loop);
    }

    function toggleKilnDioramaPlay() {
        isPlaying = !isPlaying;
        const btn = document.getElementById('kiln-diorama-play-btn');
        const en = isEn();
        if (btn) {
            btn.innerHTML = `<i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}" aria-hidden="true"></i><span>${en ? (isPlaying ? 'Pause' : 'Play') : (isPlaying ? '暂停动画' : '播放动画')}</span>`;
        }
        if (isPlaying) startLoop();
        else if (animId) { cancelAnimationFrame(animId); animId = null; }
    }

    function seekKilnDiorama(pctVal) {
        const ratio = Math.max(0, Math.min(1, parseFloat(pctVal) / 100));
        if (mixer && actions.length) {
            const targetTime = ratio * clipDuration;
            actions.forEach((act) => { act.time = targetTime; });
            mixer.update(0);
            syncProgressUi();
            renderSingleFrame();
        }
    }

    function jumpKilnDioramaStage(stageKey) {
        const st = STAGES.find(s => s.key === stageKey);
        if (!st) return;
        seekKilnDiorama(Math.round(st.ratio * 100));
        const hud = document.getElementById('kiln-diorama-hud');
        if (hud) hud.textContent = `${st.temp} · ${isEn() ? st.en : st.zh}`;
    }

    function initModule() {
        mountUiCard();
        const panel = document.getElementById('kiln-diorama-panel');
        if (!panel) return;
        if ('IntersectionObserver' in global) {
            const io = new IntersectionObserver((entries) => {
                isVisible = !!(entries[0] && entries[0].isIntersecting);
                if (isVisible) {
                    if (!renderer) initScene();
                    startLoop();
                } else if (animId) {
                    cancelAnimationFrame(animId);
                    animId = null;
                }
            }, { rootMargin: '200px 0px', threshold: 0.02 });
            io.observe(panel);
        } else {
            isVisible = true;
            initScene();
            startLoop();
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && animId) { cancelAnimationFrame(animId); animId = null; }
            else if (!document.hidden) startLoop();
        });
    }

    global.AppRegistry.register({
        id: 'kiln-diorama',
        phase: 3,
        init: initModule,
        onLangChange: function () {
            const hadRenderer = !!renderer;
            if (animId) { cancelAnimationFrame(animId); animId = null; }
            if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
            if (renderer && typeof renderer.dispose === 'function') {
                renderer.dispose();
            }
            renderer = null; scene = null; camera = null; mixer = null; actions = []; dioramaGroup = null;
            renderPanelShell();
            if (hadRenderer || isVisible) {
                initScene();
                startLoop();
            }
        },
        getSearchItems: function (lang) {
            const en = lang === 'en';
            return [{
                type: en ? 'Blender 3D' : 'Blender 3D 沙盘',
                icon: 'fa-fire-burner',
                title: en ? 'Song Dragon Kiln 3D Animated Diorama' : '宋代龙窑 1300℃ 柴烧还原动态沙盘',
                sub: en ? 'Interactive Blender keyframe animation' : '交互式关键帧动画沙盘与四阶段热工调控',
                action: () => {
                    const el = document.getElementById('kiln-diorama-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
            }];
        },
        publicApi: { toggleKilnDioramaPlay, seekKilnDiorama, jumpKilnDioramaStage },
        globalBindings: { toggleKilnDioramaPlay, seekKilnDiorama, jumpKilnDioramaStage }
    });
})(window);

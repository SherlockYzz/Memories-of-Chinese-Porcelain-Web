/**
 * 模块：视听研学 · 陶埏天工技艺展映、五音瓷磬与 Web Audio 环境音景 (audio-theatre)
 */
(function (global) {
    'use strict';

    const craftVideos = [
        {
            id: 'throwing',
            title: '《陶轮拉坯 · 指尖生形》',
            subtitle: '飞轮旋转，十指感知泥料筋骨厚薄，一呼一吸间提拉出曼妙曲线',
            quote: '“陶轮一转天地开，素手揉出万象来” ——《天工开物 · 陶埏篇》',
            sourceUrl: 'videos/ceramic_making.webm',
            duration: '00:24 · 高清实景循环',
            chapter: '工序五 · 轮盘拉坯',
            desc: '陶轮拉坯是传统手工制瓷最具生命力的核心工序。匠人将练好的熟泥掷于旋转转盘中心，以双手拇指开孔，四指提拉外壁。利用离心力与指尖均匀推压，将致密泥料顺势拔高，器物之口沿、修颈、溜肩、圆腹在此一气呵成。'
        },
        {
            id: 'trimming',
            title: '《修光利坯 · 削泥如玉》',
            subtitle: '半干阴凉，以锋利钢刀修削内外，使器壁薄厚如一、重心极稳',
            quote: '“削骨定肉，毫厘无差；利坯如削玉，薄可照人” ——《景德镇陶录》',
            sourceUrl: 'videos/potter_wheel.webm',
            duration: '00:32 · 1080P慢速精修',
            chapter: '工序七 · 修光利坯',
            desc: '修光利坯决定了古瓷成品的骨相与手感。拉出的生坯阴干至半干革质后固定在辘轳车上，匠人屏气凝神，手持特制薄铁利刀自上而下旋削，消除粗糙杂余泥肉，使坯体重量、弧线、厚度达到严苛的毫米级规整，并修出规整紫黑铁足底圈。'
        },
        {
            id: 'glazing',
            title: '《矿彩荡釉 · 翠色成衣》',
            subtitle: '以天然松木灰、长石与玛瑙为浆，荡釉浸釉多重厚施如凝脂玉润',
            quote: '“雨过天青云破处，这般颜色做将来” ——《宋徽宗御批》',
            sourceUrl: 'videos/ceramic_making.webm',
            duration: '00:24 · 矿物成衣',
            chapter: '工序九 · 荡釉浸釉',
            desc: '宋代单色釉追求“如冰似玉”的质感，秘诀正在于多道厚施矿物石灰碱釉。利用天然富铁瓷土与玛瑙研磨至数百目矿浆，通过荡釉（内壁摇荡）、浸釉（外壁速浸）与吹釉结合，使釉层厚度达到坯体数倍，出窑后失透晶莹、抚之若酥油羊脂。'
        },
        {
            id: 'firing',
            title: '《龙窑柴烧 · 烈焰涅槃》',
            subtitle: '匣钵重叠密封，以松柴经1300℃高温还原焰烧造三日三夜',
            quote: '“入窑一色，出窑万彩；千度烈焰，涅槃成器” ——《古瓷考据录》',
            sourceUrl: 'videos/potter_wheel.webm',
            duration: '00:32 · 柴烧还原',
            chapter: '工序十一 · 龙窑柴烧',
            desc: '柴烧是华夏古陶瓷的灵魂涅槃之所。器物须严格装入耐火匣钵中密封叠放以防飞灰沾染。数十米依山龙窑投松木柴持续升温至1300℃以上，在关键的缺氧还原阶段，胎釉中的三氧化二铁被剥离氧原子转化为氧化亚铁，方能绽放出摄人心魄的雨过天青与秘色幽光。'
        }
    ];

    let currentCraftVideoIndex = 0;
    let ambientAudioCtx = null;
    const activeAmbientNodes = {
        guqin: null,
        fire: null,
        water: null,
        chime: null
    };

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderPentatonicPanel() {
        const container = document.getElementById('pentatonic-keys-container');
        if (!container || typeof pentatonicNotesData === 'undefined') return;

        container.innerHTML = pentatonicNotesData.map((note, idx) => `
            <button onclick="strikeAncientChime('${note.key}')" class="p-3.5 rounded-2xl bg-bg-main border border-border-light hover:border-tianqing hover:shadow-md transition-all flex flex-col items-center justify-between text-center group">
                <span class="text-[10px] text-text-muted font-mono bg-yuebai px-2 py-0.5 rounded-full mb-1">${tr('键盘')} ${idx + 1} · ${note.frequency}Hz</span>
                <div class="w-12 h-12 rounded-full bg-yuebai group-hover:bg-tianqing-deep flex items-center justify-center transition-colors shadow-inner my-1.5 border border-border-light">
                    <span class="font-serif-cn text-xl font-bold text-tianqing-deep group-hover:text-white transition-colors">${tr(note.note)}</span>
                </div>
                <div>
                    <h5 class="text-xs font-serif-cn font-medium text-text-title">${note.pinyin} · ${tr(note.element)}</h5>
                    <p class="text-[10px] text-text-muted truncate mt-0.5">${tr(note.vessel.split(' · ')[0])}</p>
                </div>
            </button>
        `).join('');
    }

    function strikeAncientChime(key) {
        if (typeof pentatonicNotesData === 'undefined') return;
        const note = pentatonicNotesData.find(n => n.key === key);
        if (!note) return;

        if (typeof global.playPentatonicChime === 'function') {
            global.playPentatonicChime(note.frequency, note.harmonics);
        }

        const noteDescEl = document.getElementById('pentatonic-current-desc');
        if (noteDescEl) {
            noteDescEl.innerHTML = `
                <span class="text-amber-400 font-medium font-serif-cn">${tr(note.note + '音')} · ${tr(note.element)}</span>：
                ${tr(note.desc)} <span class="text-text-muted">（${tr('共鸣器物：')}${tr(note.vessel)} · ${tr('基频')} ${note.frequency}Hz）</span>
            `;
        }
    }

    function switchCraftVideo(index, autoPlay = true) {
        currentCraftVideoIndex = index;
        const v = craftVideos[index];
        if (!v) return;

        const videoEl = document.getElementById('craft-main-video');
        const titleEl = document.getElementById('craft-video-title');
        const subtitleEl = document.getElementById('craft-video-subtitle');
        const quoteEl = document.getElementById('craft-video-quote');
        const descEl = document.getElementById('craft-video-desc');
        const chapterEl = document.getElementById('craft-video-chapter');
        const durationEl = document.getElementById('craft-video-duration');

        if (videoEl) {
            if (autoPlay) {
                videoEl.src = v.sourceUrl;
                videoEl.play().catch(() => {});
            } else {
                videoEl.dataset.pendingSrc = v.sourceUrl;
            }
        }
        if (titleEl) titleEl.textContent = tr(v.title);
        if (subtitleEl) subtitleEl.textContent = tr(v.subtitle);
        if (quoteEl) quoteEl.textContent = tr(v.quote);
        if (descEl) descEl.textContent = tr(v.desc);
        if (chapterEl) chapterEl.textContent = tr(v.chapter);
        if (durationEl) durationEl.textContent = tr(v.duration);

        document.querySelectorAll('.craft-chapter-btn').forEach((btn, i) => {
            btn.classList.toggle('border-tianqing', i === index);
            btn.classList.toggle('bg-tianqing-deep/15', i === index);
        });

        if (autoPlay && global.ToastService) {
            global.ToastService.show('🎬 ' + tr('已载入研学展映：') + tr(v.title));
        }
    }

    function initVideoLazyLoader() {
        const video = document.getElementById('craft-main-video');
        if (!video) return;
        switchCraftVideo(0, false);

        if (!('IntersectionObserver' in global)) return;
        const obs = new IntersectionObserver((entries) => {
            if (entries[0] && entries[0].isIntersecting) {
                if (!video.src && video.dataset.pendingSrc) {
                    video.src = video.dataset.pendingSrc;
                }
                obs.disconnect();
            }
        }, { threshold: 0.3 });
        obs.observe(video);
    }

    function getAmbientContext() {
        if (!ambientAudioCtx) {
            const AudioContext = global.AudioContext || global.webkitAudioContext;
            ambientAudioCtx = new AudioContext();
        }
        if (ambientAudioCtx.state === 'suspended') {
            ambientAudioCtx.resume();
        }
        return ambientAudioCtx;
    }

    function toggleAmbientSound(type) {
        const ctx = getAmbientContext();
        const btn = document.getElementById('ambient-btn-' + type);

        if (activeAmbientNodes[type]) {
            try {
                activeAmbientNodes[type].gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
                setTimeout(() => {
                    if (activeAmbientNodes[type] && activeAmbientNodes[type].stop) {
                        activeAmbientNodes[type].stop();
                    }
                    activeAmbientNodes[type] = null;
                }, 800);
            } catch (e) {
                activeAmbientNodes[type] = null;
            }
            if (btn) btn.classList.remove('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
            if (global.ToastService) global.ToastService.show('已静音环境音景');
            return;
        }

        if (type === 'fire') {
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                if (Math.random() < 0.0018) data[i] += (Math.random() * 2 - 1) * 0.45;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, ctx.currentTime);

            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 1.2);

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            noise.start();

            activeAmbientNodes.fire = { stop: () => noise.stop(), gain: gainNode };
            if (btn) btn.classList.add('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
            if (global.ToastService) global.ToastService.show('🔥 已开启【龙窑松柴烈火噼啪声】');
        } else if (type === 'water') {
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(420, ctx.currentTime);
            filter.Q.setValueAtTime(1.8, ctx.currentTime);

            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.2);

            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);
            noise.start();

            activeAmbientNodes.water = { stop: () => noise.stop(), gain: gainNode };
            if (btn) btn.classList.add('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
            if (global.ToastService) global.ToastService.show('💧 已开启【山泉水磨澄泥潺潺声】');
        } else if (type === 'guqin') {
            const guqinFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
            let noteTimer = null;
            let isRunning = true;

            function playGuqinNote() {
                if (!isRunning) return;
                const f = guqinFreqs[Math.floor(Math.random() * guqinFreqs.length)];
                const osc = ctx.createOscillator();
                const oscHarm = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, ctx.currentTime);
                oscHarm.type = 'sine';
                oscHarm.frequency.setValueAtTime(f * 2, ctx.currentTime);

                gain.gain.setValueAtTime(0.001, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

                osc.connect(gain);
                oscHarm.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                oscHarm.start();
                osc.stop(ctx.currentTime + 3.0);
                oscHarm.stop(ctx.currentTime + 3.0);

                noteTimer = setTimeout(playGuqinNote, 2200 + Math.random() * 2000);
            }

            playGuqinNote();
            activeAmbientNodes.guqin = {
                stop: () => { isRunning = false; clearTimeout(noteTimer); },
                gain: { gain: { exponentialRampToValueAtTime: () => {} } }
            };
            if (btn) btn.classList.add('active', 'border-tianqing', 'bg-tianqing-deep', 'text-white');
            if (global.ToastService) global.ToastService.show('🎵 已开启【古琴五音泛音清境】');
        } else if (type === 'chime') {
            if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2580);
            if (global.ToastService) global.ToastService.show('🔔 叩瓷清越 · 声如鸣磬');
        }
    }

    function refreshAll() {
        renderPentatonicPanel();
        switchCraftVideo(currentCraftVideoIndex, false);
    }

    global.AppRegistry.register({
        id: 'audio-theatre',
        phase: 3,
        init: function () {
            renderPentatonicPanel();
            initVideoLazyLoader();
        },
        onLangChange: refreshAll,
        publicApi: {
            renderPentatonicPanel,
            strikeAncientChime,
            switchCraftVideo,
            toggleAmbientSound
        },
        globalBindings: {
            strikeAncientChime,
            switchCraftVideo,
            toggleAmbientSound
        }
    });
})(window);

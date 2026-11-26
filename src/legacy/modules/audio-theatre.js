/**
 * 模块：视听研学 · 哔哩哔哩景德镇非遗制瓷实录展映、五音瓷磬与 Web Audio 环境音景 (audio-theatre)
 */
(function (global) {
    'use strict';

    const craftVideos = [
        {
            id: 'throwing',
            bvid: 'BV1Su411L75R',
            author: '八和人文茶器',
            poster: 'images/videos/step1-throwing.webp',
            title: '《手工制瓷 · 轮盘拉坯》',
            subtitle: '飞轮旋转，十指感知泥料筋骨厚薄，一呼一吸间提拉出曼妙曲线',
            quote: '“陶轮一转天地开，素手揉出万象来” ——《天工开物 · 陶埏篇》',
            duration: '01:30 · B站非遗实录',
            chapter: '工序二十六 · 轮盘拉坯',
            desc: '陶轮拉坯是传统手工制瓷最具生命力的核心工序。匠人将练好的熟泥掷于旋转辘轳转盘中心，双手抱泥找正、拇指开孔、四指提拉外壁，顺应离心力将致密泥料拔高成型，器物口沿、修颈与圆腹一气呵成。'
        },
        {
            id: 'trimming',
            bvid: 'BV13h411P7or',
            author: '八和人文茶器',
            poster: 'images/videos/step2-trimming.webp',
            title: '《修光利坯 · 削泥如玉》',
            subtitle: '半干阴凉，以锋利钢刀修削内外，使器壁薄厚如一、重心极稳',
            quote: '“削骨定肉，毫厘无差；利坯如削玉，薄可照人” ——《景德镇陶录》',
            duration: '01:37 · B站非遗实录',
            chapter: '工序二十八 · 修光利坯',
            desc: '修光利坯决定了古瓷成品的骨相与手感。拉出的生坯阴干至革质半干后倒扣旋车上，匠人屏气凝神，手持特制薄铁利刀自上而下旋削，剔除多余泥肉，使器壁达到毫米级规整并挖出挺括圈足。'
        },
        {
            id: 'glazing',
            bvid: 'BV168411S78k',
            author: '八和人文茶器',
            poster: 'images/videos/step3-glazing.webp',
            title: '《矿彩荡釉 · 翠色成衣》',
            subtitle: '以松木灰与釉果调制釉浆，旋腕荡釉使釉衣如凝脂般均匀附着',
            quote: '“雨过天青云破处，这般颜色做将来” ——《宋徽宗御批》',
            duration: '00:45 · B站非遗实录',
            chapter: '工序四十一 · 荡釉施浆',
            desc: '荡釉是景德镇圆器内壁施釉的核心古法：匠人将适量釉浆注入坯体内部，借手腕巧劲回旋晃荡，使釉浆顺内壁均匀铺展后瞬间倾倒出余浆，让薄胎披上润泽玉衣。'
        },
        {
            id: 'qinghua',
            bvid: 'BV1uV411Y7Xh',
            author: '桃锦川',
            poster: 'images/videos/step4-qinghua.webp',
            title: '《青花分水 · 料分五色》',
            subtitle: '以鸡头笔含饱浓淡不一之青花料水，在素坯上皴染出水墨层次',
            quote: '“宣德年制青花色，浓淡分水若墨禅。” ——《陶雅》',
            duration: '22:12 · 青花分水专集',
            chapter: '釉下彩绘 · 分水皴染',
            desc: '青花分水乃景德镇釉下彩绝技。匠人先以细笔勾勒轮廓，再依“头浓、二浓、正浓、正淡、影淡”五阶料水，借毛笔含水不贴坯而引流晕染，入窑一火烧成即化作深浅层次如画卷的水墨青花。'
        },
        {
            id: 'firing',
            bvid: 'BV1tmfWYNEiH',
            author: '冷木冷木',
            poster: 'images/videos/step5-kiln.webp',
            title: '《景德镇柴窑 · 烈焰涅槃》',
            subtitle: '满窑匣钵层叠，松柴持续升温逾 1300℃ 还原焰烧造与静候开窑',
            quote: '“入窑一色，出窑万彩；千度烈焰，涅槃成器” ——《古瓷考据录》',
            duration: '20:04 · 柴窑全纪实',
            chapter: '工序五十四 · 柴窑烧造',
            desc: '柴烧是华夏古瓷蜕变的灵魂时刻。器坯封入匣钵后由把桩师傅依火位码放，闭门投松柴昼夜连烧至 1300℃ 以上，在强还原焰气氛中氧化铁还原成亚铁，经漫长降温方得见满窑天青与玉润光泽。'
        }
    ];

    let currentCraftVideoIndex = 0;
    let isVideoActive = false;
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

    function notifyVideoActive(active) {
        isVideoActive = !!active;
        if (global.AppBus && typeof global.AppBus.emit === 'function') {
            global.AppBus.emit('media:video-active', { active: isVideoActive });
        }
    }

    function buildBiliEmbedUrl(bvid, autoplay = true) {
        return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&page=1&high_quality=1&danmaku=0&autoplay=${autoplay ? 1 : 0}`;
    }

    function renderPentatonicPanel() {
        const container = document.getElementById('pentatonic-keys-container');
        if (!container || typeof pentatonicNotesData === 'undefined') return;

        container.innerHTML = pentatonicNotesData.map((note, idx) => `
            <button type="button" data-action="strikeAncientChime('${note.key}')" class="p-3.5 rounded-2xl bg-bg-main border border-border-light hover:border-tianqing hover:shadow-md transition-all flex flex-col items-center justify-between text-center group">
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

    function stopCraftVideo() {
        const facade = document.getElementById('craft-video-facade');
        const host = document.getElementById('craft-video-player-host');
        const closeBtn = document.getElementById('craft-video-close-btn');
        if (host) {
            host.innerHTML = '';
            host.classList.add('hidden');
        }
        if (facade) facade.classList.remove('hidden');
        if (closeBtn) closeBtn.classList.add('hidden');
        notifyVideoActive(false);
    }

    function playCraftVideo() {
        const v = craftVideos[currentCraftVideoIndex];
        if (!v) return;
        const facade = document.getElementById('craft-video-facade');
        const host = document.getElementById('craft-video-player-host');
        const closeBtn = document.getElementById('craft-video-close-btn');
        if (!host) return;

        if (facade) facade.classList.add('hidden');
        if (closeBtn) closeBtn.classList.remove('hidden');
        host.classList.remove('hidden');
        host.innerHTML = `<iframe src="${buildBiliEmbedUrl(v.bvid, true)}" title="${tr(v.title)}" allowfullscreen="true" scrolling="no" frameborder="0" referrerpolicy="no-referrer" allow="autoplay; fullscreen; picture-in-picture" class="w-full h-full border-0"></iframe>`;
        notifyVideoActive(true);
        if (global.ToastService) {
            global.ToastService.show('已加载 B 站实录：' + tr(v.title) + '（背景琴音已自动暂避）');
        }
    }

    function switchCraftVideo(index, autoPlay = true) {
        currentCraftVideoIndex = index;
        const v = craftVideos[index];
        if (!v) return;

        const posterEl = document.getElementById('craft-video-poster');
        const titleEl = document.getElementById('craft-video-title');
        const subtitleEl = document.getElementById('craft-video-subtitle');
        const quoteEl = document.getElementById('craft-video-quote');
        const descEl = document.getElementById('craft-video-desc');
        const chapterEl = document.getElementById('craft-video-chapter');
        const durationEl = document.getElementById('craft-video-duration');
        const authorEl = document.getElementById('craft-video-author');
        const biliLinkEl = document.getElementById('craft-video-bili-link');

        if (posterEl) {
            posterEl.src = v.poster;
            posterEl.alt = tr(v.title);
        }
        if (titleEl) titleEl.textContent = tr(v.title);
        if (subtitleEl) subtitleEl.textContent = tr(v.subtitle);
        if (quoteEl) quoteEl.textContent = tr(v.quote);
        if (descEl) descEl.textContent = tr(v.desc);
        if (chapterEl) chapterEl.textContent = tr(v.chapter);
        if (durationEl) durationEl.textContent = tr(v.duration);
        if (authorEl) {
            authorEl.innerHTML = `<i class="fa-solid fa-tv text-sky-500 mr-1" aria-hidden="true"></i>UP主：${v.author}`;
        }
        if (biliLinkEl) {
            biliLinkEl.href = `https://www.bilibili.com/video/${v.bvid}`;
        }

        document.querySelectorAll('.craft-chapter-btn').forEach((btn, i) => {
            btn.classList.toggle('border-tianqing', i === index);
            btn.classList.toggle('bg-tianqing-deep/15', i === index);
        });

        if (autoPlay) {
            playCraftVideo();
        } else {
            stopCraftVideo();
        }
    }

    function initVideoTheatre() {
        switchCraftVideo(0, false);
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
            if (global.ToastService) global.ToastService.show('已开启【龙窑松柴烈火噼啪声】');
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
            if (global.ToastService) global.ToastService.show('已开启【山泉水磨澄泥潺潺声】');
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
            if (global.ToastService) global.ToastService.show('已开启【古琴五音泛音清境】');
        } else if (type === 'chime') {
            if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2580);
            if (global.ToastService) global.ToastService.show('叩瓷清越 · 声如鸣磬');
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
            initVideoTheatre();
        },
        onLangChange: refreshAll,
        publicApi: {
            renderPentatonicPanel,
            strikeAncientChime,
            switchCraftVideo,
            playCraftVideo,
            stopCraftVideo,
            toggleAmbientSound
        },
        globalBindings: {
            strikeAncientChime,
            switchCraftVideo,
            playCraftVideo,
            stopCraftVideo,
            toggleAmbientSound
        }
    });
})(window);

/**
 * 模块：序厅首屏展示柜与流金粒子画布 (hero-showcase)
 */
(function (global) {
    'use strict';

    function initHeroAmbientCanvas() {
        const canvas = document.getElementById('hero-ambient-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const reducedMotion = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
        let w = canvas.width = global.innerWidth;
        let h = canvas.height = Math.max(720, global.innerHeight);

        const particles = [];
        for (let i = 0; i < 64; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: 1.0 + Math.random() * 2.5,
                vx: (Math.random() - 0.5) * 0.32,
                vy: -0.22 - Math.random() * 0.42,
                gold: i % 3 === 0,
                alpha: 0.22 + Math.random() * 0.55
            });
        }

        let resizeTimer = null;
        global.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                w = canvas.width = global.innerWidth;
                h = canvas.height = Math.max(720, global.innerHeight);
                if (reducedMotion) renderHeroFrame(false);
            }, 150);
        }, { passive: true });

        function renderHeroFrame(advance) {
            ctx.clearRect(0, 0, w, h);
            for (let p of particles) {
                if (advance) {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.y < -10) p.y = h + 10;
                    if (p.x < -10) p.x = w + 10;
                    if (p.x > w + 10) p.x = -10;
                }
                ctx.fillStyle = p.gold
                    ? `rgba(212, 175, 106, ${p.alpha})`
                    : `rgba(143, 184, 192, ${p.alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (reducedMotion) {
            renderHeroFrame(false);
            return;
        }

        let heroVisible = true;
        let heroAnimId = null;
        let lastHeroTick = 0;

        function drawHeroParticles(now) {
            if (!heroVisible || document.hidden) {
                heroAnimId = null;
                return;
            }
            heroAnimId = requestAnimationFrame(drawHeroParticles);
            if (now && now - lastHeroTick < 32) return;
            lastHeroTick = now || 0;
            renderHeroFrame(true);
        }

        function syncHeroLoop() {
            if (heroVisible && !document.hidden) {
                if (!heroAnimId) heroAnimId = requestAnimationFrame(drawHeroParticles);
            } else if (heroAnimId) {
                cancelAnimationFrame(heroAnimId);
                heroAnimId = null;
            }
        }

        const heroSection = document.getElementById('hero') || canvas;
        if ('IntersectionObserver' in global) {
            const io = new IntersectionObserver((entries) => {
                heroVisible = entries[0].isIntersecting;
                syncHeroLoop();
            }, { threshold: 0.02 });
            io.observe(heroSection);
        }
        document.addEventListener('visibilitychange', syncHeroLoop);
        syncHeroLoop();
    }

    function switchHeroShowcase(imgSrc, titleText, modelIdx, btnEl) {
        const imgEl = document.getElementById('hero-featured-img');
        if (imgEl) {
            imgEl.style.opacity = '0.2';
            imgEl.style.transform = 'scale(0.96)';
            setTimeout(() => {
                imgEl.src = imgSrc;
                imgEl.style.opacity = '1';
                imgEl.style.transform = 'scale(1)';
            }, 160);
        }
        const headerSpan = document.getElementById('hero-showcase-title');
        if (headerSpan) {
            headerSpan.textContent = (typeof global.tText === 'function') ? global.tText(titleText) : titleText;
        }

        document.querySelectorAll('.hero-thumb-btn').forEach(b => {
            b.classList.remove('border-amber-400', 'ring-2');
            b.classList.add('border-white/10');
        });
        if (btnEl) {
            btnEl.classList.add('border-amber-400', 'ring-2');
            btnEl.classList.remove('border-white/10');
        }

        if (typeof global.loadPorcelainModel === 'function' && modelIdx !== undefined) {
            global.loadPorcelainModel(modelIdx);
        }
        if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2520);
    }

    global.AppRegistry.register({
        id: 'hero-showcase',
        phase: 1,
        init: initHeroAmbientCanvas,
        publicApi: { switchHeroShowcase },
        globalBindings: { switchHeroShowcase }
    });
})(window);

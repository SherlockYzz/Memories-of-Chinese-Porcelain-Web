/**
 * 华夏器道 · 仝瓷记忆 — 东方意境三维动态气象与流体交互引擎 (Oriental Atmospheric Ambient Engine)
 * 核心特性：
 * 1. 天工松烟金粟微粒流光 (Songyan Gold Flakes & Celadon Micro-Particles with Mouse Physics)
 * 2. 千里江山水墨烟岚动态流变 (Dynamic Multi-Scale Ink-Wash Misty Cloud Drift)
 * 3. 清泉流觞鼠标交互涟漪 (Interactive Celestial Water Ripples)
 * 4. 自动感知「晴窗抚古 (Light)」与「夜宴观瓷 (Dark)」双模色彩映射
 */

(function () {
    let canvas, ctx;
    let width = 0, height = 0;
    let particles = [];
    let ripples = [];
    let mistPatches = [];
    let mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, speed: 0 };
    let isDark = false;
    let animationId = null;

    const PARTICLE_COUNT = 96;

    function initAmbientCanvas() {
        if (document.getElementById('oriental-ambient-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'oriental-ambient-canvas';
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        canvas.style.opacity = '0.92';
        document.body.prepend(canvas);

        ctx = canvas.getContext('2d');
        handleResize();

        // 监听主题变化
        checkTheme();
        const observer = new MutationObserver(() => checkTheme());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // 生成初始微粒
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle(true));
        }

        // 生成水墨烟岚簇
        initMistPatches();

        // 绑定事件
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('click', handleClick, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (animationId) cancelAnimationFrame(animationId);
            } else {
                render();
            }
        });

        render();
    }

    function checkTheme() {
        isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function handleResize() {
        if (!canvas) return;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function handleMouseMove(e) {
        const dx = e.clientX - mouse.x;
        const dy = e.clientY - mouse.y;
        mouse.speed = Math.min(30, Math.hypot(dx, dy));
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // 鼠标高速移动时产生微弱清泉涟漪
        if (mouse.speed > 16 && Math.random() < 0.28) {
            ripples.push({
                x: mouse.x,
                y: mouse.y,
                radius: 4,
                maxRadius: 55 + Math.random() * 35,
                opacity: 0.35,
                speed: 1.2
            });
        }
    }

    function handleClick(e) {
        ripples.push({
            x: e.clientX,
            y: e.clientY,
            radius: 6,
            maxRadius: 95 + Math.random() * 40,
            opacity: 0.65,
            speed: 1.8
        });
    }

    function createParticle(randomY = false) {
        return {
            x: Math.random() * (width || window.innerWidth),
            y: randomY ? Math.random() * (height || window.innerHeight) : (height || window.innerHeight) + 10,
            vx: (Math.random() - 0.5) * 0.45,
            vy: -(0.25 + Math.random() * 0.55),
            size: 1.0 + Math.random() * 2.6,
            baseAlpha: 0.20 + Math.random() * 0.45,
            alpha: 0,
            life: 0,
            maxLife: 350 + Math.random() * 400,
            isGold: Math.random() > 0.38, // 60% 浮金金粟，40% 天青玉屑
            wobbleSpeed: 0.015 + Math.random() * 0.02,
            wobbleOffset: Math.random() * Math.PI * 2
        };
    }

    function initMistPatches() {
        mistPatches = [
            { x: width * 0.15, y: height * 0.25, r: 240, vx: 0.06, vy: 0.02, phase: 0 },
            { x: width * 0.75, y: height * 0.35, r: 310, vx: -0.05, vy: 0.03, phase: 2.1 },
            { x: width * 0.45, y: height * 0.75, r: 280, vx: 0.04, vy: -0.02, phase: 4.2 }
        ];
    }

    function render() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // 1. 绘制千里江山水墨烟岚
        drawMistyShroud();

        // 2. 绘制清泉涟漪
        drawWaterRipples();

        // 3. 绘制松烟金粟微粒
        drawGoldParticles();

        animationId = requestAnimationFrame(render);
    }

    function drawMistyShroud() {
        for (let i = 0; i < mistPatches.length; i++) {
            const m = mistPatches[i];
            m.x += m.vx;
            m.y += m.vy;
            m.phase += 0.003;

            // 柔和边界回弹
            if (m.x < -m.r) m.x = width + m.r;
            if (m.x > width + m.r) m.x = -m.r;

            const curR = m.r + Math.sin(m.phase) * 35;
            const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, curR);

            if (isDark) {
                // 夜宴暗金与天青幽岚
                grad.addColorStop(0, 'rgba(124, 170, 180, 0.045)');
                grad.addColorStop(0.5, 'rgba(214, 177, 106, 0.020)');
                grad.addColorStop(1, 'transparent');
            } else {
                // 晴窗宣纸清雅墨润与淡天青雾
                grad.addColorStop(0, 'rgba(124, 170, 180, 0.040)');
                grad.addColorStop(0.5, 'rgba(197, 160, 89, 0.025)');
                grad.addColorStop(1, 'transparent');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(m.x, m.y, curR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawWaterRipples() {
        for (let i = ripples.length - 1; i >= 0; i--) {
            const rip = ripples[i];
            rip.radius += rip.speed;
            rip.opacity *= 0.965;

            if (rip.opacity <= 0.015 || rip.radius >= rip.maxRadius) {
                ripples.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
            ctx.strokeStyle = isDark
                ? `rgba(139, 194, 206, ${rip.opacity * 0.7})`
                : `rgba(90, 140, 155, ${rip.opacity * 0.45})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // 内层伴随细弱金纹
            if (rip.radius > 12) {
                ctx.beginPath();
                ctx.arc(rip.x, rip.y, rip.radius * 0.65, 0, Math.PI * 2);
                ctx.strokeStyle = isDark
                    ? `rgba(225, 185, 95, ${rip.opacity * 0.35})`
                    : `rgba(197, 160, 89, ${rip.opacity * 0.25})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }

    function drawGoldParticles() {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.life++;

            // 鼠标交互物理斥力
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 120 && dist > 1) {
                const force = (120 - dist) / 120;
                p.x += (dx / dist) * force * 2.2;
                p.y += (dy / dist) * force * 2.2;
            }

            // 自然飘升与摆动
            p.x += p.vx + Math.sin(p.life * p.wobbleSpeed + p.wobbleOffset) * 0.35;
            p.y += p.vy;

            // 淡入淡出计算
            const progress = p.life / p.maxLife;
            if (progress < 0.15) {
                p.alpha = (progress / 0.15) * p.baseAlpha;
            } else if (progress > 0.8) {
                p.alpha = ((1 - progress) / 0.2) * p.baseAlpha;
            } else {
                p.alpha = p.baseAlpha;
            }

            // 超出边界重置
            if (p.y < -15 || p.x < -15 || p.x > width + 15 || p.life >= p.maxLife) {
                particles[i] = createParticle(false);
                continue;
            }

            // 粒子着色
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            if (p.isGold) {
                // 浮金微粒
                ctx.fillStyle = isDark
                    ? `rgba(240, 205, 120, ${p.alpha * 0.95})`
                    : `rgba(197, 155, 75, ${p.alpha * 0.85})`;
                ctx.shadowColor = isDark ? 'rgba(214, 177, 106, 0.45)' : 'rgba(197, 155, 75, 0.25)';
                ctx.shadowBlur = p.size * 2.0;
            } else {
                // 天青微粒
                ctx.fillStyle = isDark
                    ? `rgba(139, 194, 206, ${p.alpha * 0.85})`
                    : `rgba(95, 155, 170, ${p.alpha * 0.75})`;
                ctx.shadowColor = isDark ? 'rgba(139, 194, 206, 0.40)' : 'rgba(95, 155, 170, 0.20)';
                ctx.shadowBlur = p.size * 1.5;
            }

            ctx.fill();
            ctx.shadowBlur = 0; // 重置阴影避免开销
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAmbientCanvas);
    } else {
        initAmbientCanvas();
    }
})();

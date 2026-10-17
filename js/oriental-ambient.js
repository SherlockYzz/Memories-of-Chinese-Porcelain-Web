/**
 * 华夏器道 · 天青泥火 — 东方浑天璇玑仪与千里江山三维空间动力学引擎 (Flagship 3D Oriental Engine)
 * 核心技术：
 * 1. 纯数学 3D 透视几何投影 (Pure Math 3D Perspective Projection + Smooth Camera Orbit)
 * 2. 北宋水运浑天璇玑三维旋转天球天仪 (3D Armillary Celestial Equator/Ecliptic Rings with Constellation Nodes)
 * 3. 千里江山立体等高线水墨波澜网格 (3D Topographical Ink Waves Mesh)
 * 4. 空间深度松烟浮金与天青微粒场 (3D Volumetric Sparkle Field + Perspective Depth Fog)
 * 5. 鼠标姿态空间倾斜视差 (Mouse Parallax) + 点击 3D 引力冲击波 (Gravitational Shockwave Blast)
 * 6. 极致自适应【晴窗抚古 (白昼澄心堂宣纸)】与【夜宴观瓷 (暗夜玄金星河)】双模渲染
 */

(function () {
    let canvas, ctx;
    let width = 0, height = 0, dpr = 1;
    let isDark = false;
    let animationId = null;

    // 相机与鼠标遥测动力学
    let rotX = 0.18, rotY = 0.28;
    let targetRotX = 0.18, targetRotY = 0.28;
    let mouseX = 0, mouseY = 0;
    let lastMouseX = 0, lastMouseY = 0;
    let mouseSpeed = 0;

    // 冲击波与震颤
    let shockwaveRadius = 0;
    let shockwaveMax = 0;
    let shockwaveAlpha = 0;
    let shockwaveOrigin = { x: 0, y: 0 };
    let screenShake = 0;

    // 3D 几何实体数据
    const RING_POINTS = 64;
    let armillaryRings = [];
    let mountainGrid = [];
    let spaceParticles = [];
    const PARTICLE_COUNT = 140;

    function initEngine() {
        if (document.getElementById('oriental-ambient-canvas')) return;

        canvas = document.createElement('canvas');
        canvas.id = 'oriental-ambient-canvas';
        canvas.style.position = 'fixed';
        canvas.style.inset = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '0';
        canvas.style.opacity = '0.96';
        document.body.prepend(canvas);

        ctx = canvas.getContext('2d');
        resize();

        // 监听主题变化
        checkTheme();
        const observer = new MutationObserver(() => checkTheme());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // 初始化 3D 几何实体
        initArmillaryRings();
        initMountainGrid();
        initSpaceParticles();

        // 绑定事件
        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mousedown', onMouseDown, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (animationId) cancelAnimationFrame(animationId);
            } else {
                render(performance.now());
            }
        });

        render(performance.now());
    }

    function checkTheme() {
        isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function resize() {
        if (!canvas) return;
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }

    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        mouseSpeed = Math.min(35, Math.hypot(dx, dy));
        lastMouseX = mouseX;
        lastMouseY = mouseY;

        // 鼠标在屏幕滑动时，平滑改变 3D 相机仰角与方位角 (Parallax)
        const normX = (mouseX / width - 0.5) * 2;
        const normY = (mouseY / height - 0.5) * 2;
        targetRotY = 0.28 + normX * 0.42;
        targetRotX = 0.18 - normY * 0.32;
    }

    function onMouseDown(e) {
        triggerShockwave(e.clientX, e.clientY);
    }

    function triggerShockwave(x, y) {
        shockwaveOrigin = { x, y };
        shockwaveRadius = 10;
        shockwaveMax = Math.max(width, height) * 0.65;
        shockwaveAlpha = 0.85;
        screenShake = 6.0;

        // 对 3D 空间微粒施加向外爆发速度
        const cx = width * 0.5;
        const cy = height * 0.5;
        for (let i = 0; i < spaceParticles.length; i++) {
            const p = spaceParticles[i];
            const pDx = (p.x + cx) - x;
            const pDy = (p.y + cy) - y;
            const dist = Math.hypot(pDx, pDy) || 1;
            const force = Math.max(0, 1 - dist / 380) * 18;
            p.blastVx += (pDx / dist) * force;
            p.blastVy += (pDy / dist) * force;
            p.blastVz += (Math.random() - 0.5) * force * 1.5;
        }
    }

    // 暴露全局触发接口
    window.triggerOrientalShockwave = triggerShockwave;

    // ================= 3D 几何数学模型初始化 =================
    function initArmillaryRings() {
        // 创建北宋浑天璇玑仪三大天球环：赤道环、黄道倾角环、白道子午环
        armillaryRings = [
            { radius: 240, tiltX: 0, tiltZ: 0, speed: 0.0035, pts: [] },
            { radius: 275, tiltX: 0.41, tiltZ: 0.25, speed: -0.0028, pts: [] },
            { radius: 210, tiltX: -0.55, tiltZ: 0.65, speed: 0.0042, pts: [] },
            { radius: 310, tiltX: 0.72, tiltZ: -0.38, speed: -0.0020, pts: [] }
        ];

        armillaryRings.forEach(ring => {
            ring.pts = [];
            for (let i = 0; i < RING_POINTS; i++) {
                const theta = (i / RING_POINTS) * Math.PI * 2;
                ring.pts.push({
                    theta,
                    isNode: (i % 8 === 0) // 二十八宿星官节点
                });
            }
        });
    }

    function initMountainGrid() {
        // 创建空间底部起伏的千里江山水墨波澜曲面
        mountainGrid = [];
        const cols = 22;
        const rows = 14;
        const stepX = 54;
        const stepZ = 45;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                mountainGrid.push({
                    baseX: (c - cols * 0.5) * stepX,
                    baseZ: (r - rows * 0.5) * stepZ,
                    r, c,
                    phase: (c * 0.35 + r * 0.5)
                });
            }
        }
    }

    function initSpaceParticles() {
        spaceParticles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            spaceParticles.push({
                x: (Math.random() - 0.5) * 900,
                y: (Math.random() - 0.5) * 650,
                z: (Math.random() - 0.5) * 550,
                vx: (Math.random() - 0.5) * 0.45,
                vy: -(0.3 + Math.random() * 0.6),
                vz: (Math.random() - 0.5) * 0.35,
                blastVx: 0,
                blastVy: 0,
                blastVz: 0,
                size: 1.0 + Math.random() * 2.8,
                alpha: 0.25 + Math.random() * 0.55,
                isGold: Math.random() > 0.42, // 58% 浮金金粟，42% 天青玉屑
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // ================= 3D 透视几何投影算法 (Pure 3D Perspective Math) =================
    function project3D(x, y, z, cx, cy, fov = 720) {
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);

        // 绕 Y 轴偏航 (Yaw)
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // 绕 X 轴俯仰 (Pitch)
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const zDist = z2 + 680;
        if (zDist <= 20) return null;

        const scale = fov / zDist;
        return {
            x: cx + x1 * scale,
            y: cy + y2 * scale,
            depth: zDist,
            scale: scale
        };
    }

    // ================= 主动力学渲染管线 (Main 60FPS Pipeline) =================
    let startTime = performance.now();

    function render(now) {
        const t = (now - startTime) * 0.001;

        // 平滑相机惯性阻尼跟踪
        rotX += (targetRotX - rotX) * 0.055;
        rotY += (targetRotY - rotY) * 0.055;

        // 屏幕微震衰减
        let shakeX = 0, shakeY = 0;
        if (screenShake > 0.05) {
            shakeX = (Math.random() - 0.5) * screenShake;
            shakeY = (Math.random() - 0.5) * screenShake;
            screenShake *= 0.88;
        }

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // 3D 空间中心：大屏偏右 60% 营造留白文人气象，小屏居中
        const cx = (width > 1024 ? width * 0.56 : width * 0.5);
        const cy = height * 0.48;

        // 1. 绘制环境水墨漫射光晕
        drawAmbientGlow(cx, cy, t);

        // 2. 绘制千里江山 3D 立体水墨波澜网格
        draw3DMountainMesh(cx, cy, t);

        // 3. 绘制北宋浑天璇玑仪 3D 旋转天球环
        draw3DArmillaryRings(cx, cy, t);

        // 4. 绘制空间深度 3D 松烟金粟微粒场
        draw3DSpaceParticles(cx, cy, t);

        // 5. 绘制交互冲击波光圈
        drawShockwave();

        ctx.restore();

        animationId = requestAnimationFrame(render);
    }

    function drawAmbientGlow(cx, cy, t) {
        const breath = 1 + Math.sin(t * 0.85) * 0.08;
        const gradRadius = (width > 1024 ? 420 : 320) * breath;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, gradRadius);

        if (isDark) {
            // 暗夜模式：故宫夜宴星河流金与深邃天青晕光
            grad.addColorStop(0, 'rgba(139, 194, 206, 0.14)');
            grad.addColorStop(0.35, 'rgba(214, 177, 106, 0.08)');
            grad.addColorStop(0.70, 'rgba(32, 54, 70, 0.04)');
            grad.addColorStop(1, 'transparent');
        } else {
            // 白昼模式：宋韵澄心堂宣纸雨后天青与雅金漫射
            grad.addColorStop(0, 'rgba(124, 170, 180, 0.12)');
            grad.addColorStop(0.40, 'rgba(197, 160, 89, 0.06)');
            grad.addColorStop(0.75, 'rgba(228, 239, 242, 0.03)');
            grad.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    function draw3DMountainMesh(cx, cy, t) {
        const cols = 22;
        const rows = 14;

        // 遍历行绘制 3D 等高水墨波澜流线
        for (let r = 0; r < rows; r++) {
            ctx.beginPath();
            let firstPt = true;

            for (let c = 0; c < cols; c++) {
                const node = mountainGrid[r * cols + c];
                // 3D 空间动态高度调制：结合正弦起伏与微风扰动
                const waveY = 175 + Math.sin(node.baseX * 0.009 + t * 0.85 + node.phase) * 32
                                  + Math.cos(node.baseZ * 0.012 + t * 0.65) * 24;

                const proj = project3D(node.baseX, waveY, node.baseZ + 60, cx, cy);
                if (!proj) continue;

                if (firstPt) {
                    ctx.moveTo(proj.x, proj.y);
                    firstPt = false;
                } else {
                    ctx.lineTo(proj.x, proj.y);
                }
            }

            const depthAlpha = Math.max(0.04, 0.35 - (r / rows) * 0.24);
            ctx.strokeStyle = isDark
                ? `rgba(139, 194, 206, ${depthAlpha * 0.85})`
                : `rgba(90, 140, 155, ${depthAlpha * 0.70})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
        }
    }

    function draw3DArmillaryRings(cx, cy, t) {
        armillaryRings.forEach((ring, rIdx) => {
            const rotAngle = t * ring.speed * 2.5;
            const cosTiltX = Math.cos(ring.tiltX);
            const sinTiltX = Math.sin(ring.tiltX);
            const cosTiltZ = Math.cos(ring.tiltZ);
            const sinTiltZ = Math.sin(ring.tiltZ);

            ctx.beginPath();
            let firstDrawn = false;
            let firstProj = null;

            for (let i = 0; i <= RING_POINTS; i++) {
                const idx = i % RING_POINTS;
                const theta = (idx / RING_POINTS) * Math.PI * 2 + rotAngle;

                // 环初始平面在 X-Z
                let px = Math.cos(theta) * ring.radius;
                let py = 0;
                let pz = Math.sin(theta) * ring.radius;

                // 倾斜矩阵调制
                const y1 = py * cosTiltX - pz * sinTiltX;
                const z1 = py * sinTiltX + pz * cosTiltX;
                const x2 = px * cosTiltZ - y1 * sinTiltZ;
                const y2 = px * sinTiltZ + y1 * cosTiltZ;

                const proj = project3D(x2, y2 - 20, z1, cx, cy);
                if (!proj) continue;

                if (!firstDrawn) {
                    ctx.moveTo(proj.x, proj.y);
                    firstProj = proj;
                    firstDrawn = true;
                } else {
                    ctx.lineTo(proj.x, proj.y);
                }

                // 绘制二十八宿星官节点珠
                if (ring.pts[idx].isNode && i < RING_POINTS) {
                    ctx.save();
                    const nodeAlpha = isDark ? 0.85 : 0.65;
                    ctx.fillStyle = isDark ? 'rgba(245, 215, 130, 0.95)' : 'rgba(197, 160, 89, 0.85)';
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 2.5 * proj.scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            if (firstProj) ctx.lineTo(firstProj.x, firstProj.y);

            const ringAlpha = (rIdx % 2 === 0) ? (isDark ? 0.38 : 0.28) : (isDark ? 0.22 : 0.16);
            ctx.strokeStyle = (rIdx % 2 === 0)
                ? (isDark ? `rgba(240, 205, 120, ${ringAlpha})` : `rgba(197, 160, 89, ${ringAlpha})`)
                : (isDark ? `rgba(139, 194, 206, ${ringAlpha})` : `rgba(110, 165, 175, ${ringAlpha})`);
            ctx.lineWidth = (rIdx === 0 ? 1.5 : 1.0);
            ctx.stroke();
        });
    }

    function draw3DSpaceParticles(cx, cy, t) {
        for (let i = 0; i < spaceParticles.length; i++) {
            const p = spaceParticles[i];

            // 爆发速度阻尼衰减
            p.blastVx *= 0.92;
            p.blastVy *= 0.92;
            p.blastVz *= 0.92;

            // 粒子空间移动
            p.x += p.vx + p.blastVx + Math.sin(t + p.phase) * 0.35;
            p.y += p.vy + p.blastVy;
            p.z += p.vz + p.blastVz;

            // 循环包裹
            if (p.y < -380) p.y = 380;
            if (p.x < -480) p.x = 480;
            if (p.x > 480) p.x = -480;
            if (p.z < -300) p.z = 300;
            if (p.z > 300) p.z = -300;

            const proj = project3D(p.x, p.y, p.z, cx, cy);
            if (!proj) continue;

            const renderSize = Math.max(0.8, p.size * proj.scale);
            const depthFactor = Math.min(1.0, Math.max(0.15, (850 - proj.depth) / 600));
            const finalAlpha = p.alpha * depthFactor;

            ctx.beginPath();
            ctx.arc(proj.x, proj.y, renderSize, 0, Math.PI * 2);

            if (p.isGold) {
                // 浮金金粟微粒
                ctx.fillStyle = isDark
                    ? `rgba(245, 215, 125, ${finalAlpha * 0.92})`
                    : `rgba(197, 155, 75, ${finalAlpha * 0.85})`;
            } else {
                // 天青玉屑微粒
                ctx.fillStyle = isDark
                    ? `rgba(145, 205, 218, ${finalAlpha * 0.85})`
                    : `rgba(95, 160, 172, ${finalAlpha * 0.75})`;
            }

            ctx.fill();
        }
    }

    function drawShockwave() {
        if (shockwaveAlpha <= 0.01) return;

        shockwaveRadius += 14;
        shockwaveAlpha *= 0.94;

        ctx.save();
        ctx.beginPath();
        ctx.arc(shockwaveOrigin.x, shockwaveOrigin.y, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
            ? `rgba(240, 210, 130, ${shockwaveAlpha * 0.75})`
            : `rgba(197, 160, 89, ${shockwaveAlpha * 0.55})`;
        ctx.lineWidth = Math.max(0.5, 3.5 * shockwaveAlpha);
        ctx.stroke();

        // 次级天青内圈
        if (shockwaveRadius > 25) {
            ctx.beginPath();
            ctx.arc(shockwaveOrigin.x, shockwaveOrigin.y, shockwaveRadius * 0.75, 0, Math.PI * 2);
            ctx.strokeStyle = isDark
                ? `rgba(139, 194, 206, ${shockwaveAlpha * 0.55})`
                : `rgba(110, 165, 175, ${shockwaveAlpha * 0.35})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }
        ctx.restore();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEngine);
    } else {
        initEngine();
    }
})();

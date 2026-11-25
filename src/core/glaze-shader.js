/**
 * 物理瓷釉微结构着色器与贴图生成器（Three.js r128 兼容）。
 * 为 3D 展馆（legacy three-scene）与首屏器物（ESM hero-vessel）共同提供：
 *   1. 多尺度双层 Voronoi 开片贴图（粗主纹染茶/墨色 + 细浅次裂 + 凹凸深度）
 *   2. 微观“橘皮”棕眼法线贴图
 *   3. MeshPhysicalMaterial onBeforeCompile 物理釉层增强：
 *      - 积釉深浅变化（凹谷/肩颈增厚变深，棱脊/口沿减薄透浅）
 *      - 官窑“紫口铁足”露胎渐变遮罩（底部向铁黑褐露胎过渡，口沿微透紫胎）
 *      - 建窑曜变天目薄膜干涉虹彩（视角相关 iridescence）
 *      - 乳浊次表面温润微光（防止发白发粉、呈现羊脂玉润感）
 */
/* global THREE */

let cachedOrangePeelNormal = null;
const cachedCrackleMaps = new Map();

function seededRand(seed0) {
    let s = seed0 >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

/**
 * 生成细腻的“橘皮”微法线贴图（512×512 CanvasTexture）。
 */
export function getOrangePeelNormalMap() {
    if (cachedOrangePeelNormal || typeof THREE === 'undefined') return cachedOrangePeelNormal;
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    const data = img.data;
    const h = new Float32Array(size * size);
    const rand = seededRand(20261125);

    // 低频波浪 + 细腻棕眼微凹
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = (x / size) * Math.PI * 2;
            const v = (y / size) * Math.PI * 2;
            const wave =
                Math.sin(u * 6 + Math.cos(v * 5)) * 0.35 +
                Math.cos(v * 7 - Math.sin(u * 4)) * 0.35 +
                Math.sin((u + v) * 14) * 0.18 +
                (rand() - 0.5) * 0.12;
            h[y * size + x] = wave;
        }
    }

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const xm = (x - 1 + size) % size;
            const xp = (x + 1) % size;
            const ym = (y - 1 + size) % size;
            const yp = (y + 1) % size;
            const dx = (h[y * size + xp] - h[y * size + xm]) * 1.1;
            const dy = (h[yp * size + x] - h[ym * size + x]) * 1.1;
            const nx = -dx;
            const ny = -dy;
            const nz = 1.0;
            const inv = 1 / Math.hypot(nx, ny, nz);
            const idx = (y * size + x) * 4;
            data[idx] = Math.round((nx * inv * 0.5 + 0.5) * 255);
            data[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
            data[idx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
            data[idx + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    cachedOrangePeelNormal = tex;
    return tex;
}

/**
 * 生成多尺度双层 Voronoi 开片贴图包：
 * - colorMap: 透明底上叠印深沉一级主裂（铁线）与浅细二级次裂（金丝），非均匀线网
 * - bumpMap: 真实沟壑深度图（主纹深、次纹浅）
 */
export function getMultiScaleCrackleMaps({
    inkColor = '#3c3127',
    goldColor = '#9b7440',
    scale = 1.8,
    strength = 0.42
} = {}) {
    if (typeof THREE === 'undefined') return null;
    const key = `${inkColor}|${goldColor}|${scale}|${strength.toFixed(2)}`;
    if (cachedCrackleMaps.has(key)) return cachedCrackleMaps.get(key);

    const size = 512;
    const cCanvas = document.createElement('canvas');
    const bCanvas = document.createElement('canvas');
    cCanvas.width = bCanvas.width = size;
    cCanvas.height = bCanvas.height = size;
    const cCtx = cCanvas.getContext('2d');
    const bCtx = bCanvas.getContext('2d');

    cCtx.fillStyle = '#ffffff';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = 'rgb(212, 212, 212)';
    bCtx.fillRect(0, 0, size, size);

    const rand = seededRand(880417);

    // 真实 Voronoi 距离差场（支持周期性平铺，无接缝）
    const makeSeeds = (gridN) => {
        const pts = [];
        for (let gy = 0; gy < gridN; gy++) {
            for (let gx = 0; gx < gridN; gx++) {
                pts.push({
                    x: (gx + 0.14 + rand() * 0.72) / gridN,
                    y: (gy + 0.14 + rand() * 0.72) / gridN
                });
            }
        }
        return { gridN, pts };
    };

    const primary = makeSeeds(6);
    const secondary = makeSeeds(13);

    const voronoiEdge = (u, v, seeds) => {
        const { gridN, pts } = seeds;
        const gx = Math.floor(u * gridN);
        const gy = Math.floor(v * gridN);
        let d1Sq = 9999.0;
        let d2Sq = 9999.0;
        for (let oy = -1; oy <= 1; oy++) {
            const ny = (gy + oy + gridN) % gridN;
            const rowOffset = ny * gridN;
            for (let ox = -1; ox <= 1; ox++) {
                const nx = (gx + ox + gridN) % gridN;
                const s = pts[rowOffset + nx];
                let dx = s.x - u;
                let dy = s.y - v;
                if (dx > 0.5) dx -= 1;
                else if (dx < -0.5) dx += 1;
                if (dy > 0.5) dy -= 1;
                else if (dy < -0.5) dy += 1;
                const distSq = dx * dx + dy * dy;
                if (distSq < d1Sq) {
                    d2Sq = d1Sq;
                    d1Sq = distSq;
                } else if (distSq < d2Sq) {
                    d2Sq = distSq;
                }
            }
        }
        return (Math.sqrt(d2Sq) - Math.sqrt(d1Sq)) * gridN;
    };

    const parseHex = (hex) => {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    };
    const inkRGB = parseHex(inkColor);
    const goldRGB = parseHex(goldColor);

    const cImg = cCtx.createImageData(size, size);
    const bImg = bCtx.createImageData(size, size);
    const cd = cImg.data;
    const bd = bImg.data;

    for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
            const u = x / size;
            // 略微扰动坐标，避免裂纹太直
            const warpU = (u + 0.012 * Math.sin(v * Math.PI * 6) + 1) % 1;
            const warpV = (v + 0.012 * Math.cos(u * Math.PI * 6) + 1) % 1;

            const e1 = voronoiEdge(warpU, warpV, primary);
            const e2 = voronoiEdge(warpU, warpV, secondary);

            // 一级铁线：较深、略宽但粗细有自然变化
            const w1 = 0.036 + 0.014 * Math.sin(u * 25.1 + v * 18.8);
            const t1 = Math.max(0, 1 - e1 / w1);
            const m1 = Math.pow(t1, 2.2) * Math.min(1, strength * 1.15);

            // 二级金丝：更细、更浅，仅在主网格内部若隐若现
            const w2 = 0.024;
            const t2 = Math.max(0, 1 - e2 / w2);
            const m2 = Math.pow(t2, 2.6) * Math.min(1, strength * 0.62);

            const idx = (y * size + x) * 4;
            let r = 255;
            let g = 255;
            let b = 255;
            if (m2 > 0.01) {
                r = r * (1 - m2) + goldRGB[0] * m2;
                g = g * (1 - m2) + goldRGB[1] * m2;
                b = b * (1 - m2) + goldRGB[2] * m2;
            }
            if (m1 > 0.01) {
                r = r * (1 - m1) + inkRGB[0] * m1;
                g = g * (1 - m1) + inkRGB[1] * m1;
                b = b * (1 - m1) + inkRGB[2] * m1;
            }
            cd[idx] = Math.round(r);
            cd[idx + 1] = Math.round(g);
            cd[idx + 2] = Math.round(b);
            cd[idx + 3] = 255;

            const bumpVal = Math.max(40, Math.round(215 - m1 * 145 - m2 * 70));
            bd[idx] = bumpVal;
            bd[idx + 1] = bumpVal;
            bd[idx + 2] = bumpVal;
            bd[idx + 3] = 255;
        }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const colorMap = new THREE.CanvasTexture(cCanvas);
    const bumpMap = new THREE.CanvasTexture(bCanvas);
    colorMap.wrapS = colorMap.wrapT = bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(scale, scale);
    bumpMap.repeat.set(scale, scale);

    const bundle = { colorMap, bumpMap };
    cachedCrackleMaps.set(key, bundle);
    return bundle;
}

/**
 * 为 MeshPhysicalMaterial / MeshStandardMaterial 注入瓷釉物理着色器增强：
 * - 积釉厚度色阶（凹处与垂直壁中下段加深，凸起棱脊与口沿减薄透胎）
 * - 官窑“紫口铁足”露胎渐变遮罩
 * - 建窑曜变天目薄膜干涉虹彩
 * - 温润乳浊次表面散射微光
 */
export function enhancePorcelainMaterial(mat, optics = {}, options = {}) {
    if (!mat || mat.userData.__tqGlazeEnhanced) return mat;
    const minY = typeof options.minY === 'number' ? options.minY : 0.0;
    const height = Math.max(0.1, typeof options.height === 'number' ? options.height : 2.15);

    const deepColor = new THREE.Color(optics.deepColor || '#4c7983');
    const thinColor = new THREE.Color(optics.thinColor || '#98b8be');
    const purpleIron = typeof optics.purpleRimIronFoot === 'number' ? optics.purpleRimIronFoot : 0.0;
    const iridescence = typeof optics.iridescenceStrength === 'number' ? optics.iridescenceStrength : 0.0;
    const subsurface = typeof optics.subsurfaceWarmth === 'number' ? optics.subsurfaceWarmth : 0.16;

    // 统一在 uniform 里暴露，方便调试或动态调色
    const uniforms = {
        uTqDeepColor: { value: deepColor },
        uTqThinColor: { value: thinColor },
        uTqMinY: { value: minY },
        uTqHeight: { value: height },
        uTqPurpleIron: { value: purpleIron },
        uTqIridescence: { value: iridescence },
        uTqSubsurface: { value: subsurface }
    };
    mat.userData.__tqGlazeEnhanced = true;
    mat.userData.__tqUniforms = uniforms;
    mat.customProgramCacheKey = () =>
        `tq_glaze_v1_${purpleIron > 0 ? 1 : 0}_${iridescence > 0 ? 1 : 0}`;

    const prevOnBeforeCompile = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, renderer) => {
        if (typeof prevOnBeforeCompile === 'function') prevOnBeforeCompile(shader, renderer);
        Object.assign(shader.uniforms, uniforms);

        shader.vertexShader = shader.vertexShader
            .replace(
                '#include <common>',
                `#include <common>
                varying vec3 vTqLocalPos;
                varying vec3 vTqLocalNorm;`
            )
            .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                vTqLocalPos = position;
                vTqLocalNorm = normalize(normal);`
            );

        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                `#include <common>
                varying vec3 vTqLocalPos;
                varying vec3 vTqLocalNorm;
                uniform vec3 uTqDeepColor;
                uniform vec3 uTqThinColor;
                uniform float uTqMinY;
                uniform float uTqHeight;
                uniform float uTqPurpleIron;
                uniform float uTqIridescence;
                uniform float uTqSubsurface;`
            )
            .replace(
                '#include <map_fragment>',
                `#include <map_fragment>
                {
                    float hNorm = clamp((vTqLocalPos.y - uTqMinY) / uTqHeight, 0.0, 1.0);
                    // 1. 积釉厚薄变化：腹部中下段重力垂釉厚（偏 deepColor），凸棱与近口沿釉薄（偏 thinColor）
                    float poolMask = smoothstep(0.12, 0.42, hNorm) * (1.0 - smoothstep(0.68, 0.96, hNorm));
                    float slopeThin = pow(1.0 - abs(vTqLocalNorm.y), 1.6);
                    float edgeSharp = clamp(length(fwidth(vTqLocalNorm)) * 4.5, 0.0, 1.0);
                    float thinFactor = clamp(edgeSharp * 0.55 + smoothstep(0.84, 1.0, hNorm) * 0.45, 0.0, 0.65);

                    diffuseColor.rgb = mix(diffuseColor.rgb, uTqDeepColor, poolMask * 0.28 * (1.0 - slopeThin * 0.35));
                    diffuseColor.rgb = mix(diffuseColor.rgb, uTqThinColor, thinFactor * 0.32);

                    // 2. 官窑“紫口铁足”露胎渐变遮罩
                    if (uTqPurpleIron > 0.01) {
                        // 足底露胎：铁黑色紫金土
                        float ironFoot = (1.0 - smoothstep(0.01, 0.075, hNorm)) * uTqPurpleIron;
                        vec3 ironClay = vec3(0.14, 0.10, 0.085);
                        diffuseColor.rgb = mix(diffuseColor.rgb, ironClay, clamp(ironFoot * 1.15, 0.0, 0.92));

                        // 口沿紫口：薄釉下微透紫褐胎色
                        float purpleRim = smoothstep(0.955, 0.998, hNorm) * uTqPurpleIron * (0.45 + 0.55 * edgeSharp);
                        vec3 purpleClay = vec3(0.28, 0.21, 0.19);
                        diffuseColor.rgb = mix(diffuseColor.rgb, purpleClay, clamp(purpleRim * 0.65, 0.0, 0.55));
                    }
                }`
            )
            .replace(
                '#include <dithering_fragment>',
                `{
                    vec3 vDir = normalize(vViewPosition);
                    float ndv = clamp(dot(normalize(normal), vDir), 0.0, 1.0);
                    float fresnel = pow(1.0 - ndv, 3.0);

                    // 3. 乳浊玉质次表面柔光（避免冷硬塑料高光）
                    gl_FragColor.rgb += uTqThinColor * fresnel * uTqSubsurface * 0.32;

                    // 4. 建窑曜变薄膜干涉虹彩（随视角与法线偏折呈蓝紫金晕）
                    if (uTqIridescence > 0.01) {
                        float phase = ndv * 5.2 + vTqLocalPos.y * 2.8;
                        vec3 irid = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
                        vec3 yaobianTint = mix(vec3(0.15, 0.38, 0.85), vec3(0.68, 0.36, 0.82), irid.r);
                        yaobianTint = mix(yaobianTint, vec3(0.88, 0.72, 0.36), pow(irid.b, 2.0) * 0.45);
                        gl_FragColor.rgb += yaobianTint * fresnel * uTqIridescence * 0.48;
                    }
                }
                #include <dithering_fragment>`
            );
    };
    mat.needsUpdate = true;
    return mat;
}

export const glazeShader = {
    getOrangePeelNormalMap,
    getMultiScaleCrackleMaps,
    enhancePorcelainMaterial
};

export default glazeShader;

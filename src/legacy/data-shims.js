/**
 * 数据兼容层：旧脚本里以全局常量形式使用的数据，现在全部来自统一数据接口（content/*.json）。
 * 这里不包含任何内容，只做“取数 + 映射成旧结构”。旧脚本迁移完后本文件即可删除。
 */
/* global App */
const __tqData = window.__TQ__.core.data;

const historyPeriods = __tqData.get('history');
const kilnGeographyData = __tqData.get('kilns');
const workshopSteps = __tqData.get('workshop-steps');
const traditionalColors = __tqData.get('colors');
const literatiArts = __tqData.get('literati-arts');
const archivePorcelains = __tqData.get('archive');
const imperialReignMarks = __tqData.get('reign-marks');
const scholarNotes = __tqData.get('notes');
const microscopePresets = __tqData.get('microscope');
const porcelainComparisonData = __tqData.get('comparison');
const pentatonicNotesData = __tqData.get('pentatonic');
const scholarQuizData = __tqData.get('quiz');

// 三维展馆：器物、底足考据、模型元数据、釉色参数
const porcelainModelsData = __tqData.get('vessels');
const bottomConnoisseurshipData = porcelainModelsData.map(function (v) {
    return Object.assign({ name: v.name }, v.bottom);
});
const masterTreasuresMeta = {};
const scannedModelsMeta = {};
porcelainModelsData.forEach(function (v) {
    if (v.model && v.model.kind === 'glb') {
        masterTreasuresMeta[v.order] = {
            path: v.model.path,
            key: v.model.key,
            name: v.name,
            scale: v.model.scale,
            targetHeight: v.model.targetHeight,
            previewImg: v.model.previewImg
        };
    } else if (v.model && v.model.kind === 'gltf') {
        scannedModelsMeta[v.order] = { path: v.model.path, key: v.id, targetHeight: v.model.targetHeight };
    }
});
const glazePalettes = {};
__tqData.get('glazes').forEach(function (g) {
    const m = g.material;
    glazePalettes[g.id] = {
        name: g.name,
        desc: g.desc,
        color: parseInt(m.color.slice(1), 16),
        emissive: parseInt(m.emissive.slice(1), 16),
        roughness: m.roughness,
        metalness: m.metalness,
        clearcoat: m.clearcoat,
        clearcoatRoughness: m.clearcoatRoughness,
        ior: m.ior,
        reflectivity: m.reflectivity,
        optics: g.optics || {}
    };
});
const gallerySceneConfig = (__tqData.get('scene') || {}).gallery || {};

window.historyPeriods = historyPeriods;
window.kilnGeographyData = kilnGeographyData;
window.workshopSteps = workshopSteps;
window.traditionalColors = traditionalColors;
window.literatiArts = literatiArts;
window.archivePorcelains = archivePorcelains;
window.imperialReignMarks = imperialReignMarks;
window.scholarNotes = scholarNotes;
window.microscopePresets = microscopePresets;
window.porcelainComparisonData = porcelainComparisonData;
window.pentatonicNotesData = pentatonicNotesData;
window.scholarQuizData = scholarQuizData;

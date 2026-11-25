/**
 * 构建清单：这是“哪些源码进入哪个产物”的唯一事实来源。
 *
 * - esm     : ESM 源码入口，经 esbuild 打包为经典脚本 (IIFE)。
 * - concat  : 经典脚本按顺序拼接（供应商库与尚未迁移的 legacy 文件）。
 * - css     : 样式按顺序合并压缩。
 * - lazy:true 的产物不出现在 index.html 里，由运行时 lazy-loader 按需加载。
 *
 * 新增模块：ESM 模块只要被 src/main.js（或某个 lazy 入口）import 即可，无需改这里。
 * 迁移 legacy：把文件从 concat 列表删除，并在 docs/MIGRATION.md 登记。
 */
export default {
    outDir: 'dist',
    publicDir: 'public',
    html: {
        entry: 'src/pages/index.html',
        out: 'index.html'
    },
    css: [
        {
            name: 'vendor-icons',
            out: 'assets/vendor-icons.css',
            files: ['src/vendor/font-awesome.min.css'],
            minify: false
        },
        {
            name: 'app-css',
            out: 'assets/app.css',
            files: ['src/styles/legacy/style.css', 'src/styles/legacy/visual-enhance.css']
        }
    ],
    concat: [
        {
            name: 'vendor',
            out: 'assets/vendor.js',
            minify: false,
            files: ['src/vendor/three.min.js', 'src/vendor/GLTFLoader.js']
        },
        {
            name: 'legacy',
            out: 'assets/legacy.js',
            files: [
                'src/legacy/core/event-bus.js',
                'src/legacy/core/store.js',
                'src/legacy/core/module-registry.js',
                'src/legacy/core/modal-manager.js',
                'src/legacy/core/toast.js',
                'src/legacy/oriental-ambient.js',
                'src/legacy/i18n-en-pack.js',
                'src/legacy/i18n.js',
                'src/legacy/data.js',
                'src/legacy/three-scene.js',
                'src/legacy/three-fx.js',
                'src/legacy/modules/theme-manager.js',
                'src/legacy/modules/webgl-bg.js',
                'src/legacy/modules/navigation.js',
                'src/legacy/modules/hero-showcase.js',
                'src/legacy/modules/history-timeline.js',
                'src/legacy/modules/kiln-map.js',
                'src/legacy/modules/workshop-steps.js',
                'src/legacy/modules/glaze-chemistry.js',
                'src/legacy/modules/literati-tea.js',
                'src/legacy/modules/archive-catalog.js',
                'src/legacy/modules/scholar-exam.js',
                'src/legacy/modules/vessel-comparison.js',
                'src/legacy/modules/microscope-lab.js',
                'src/legacy/modules/audio-theatre.js',
                'src/legacy/modules/study-notebook.js',
                'src/legacy/modules/command-palette.js',
                'src/legacy/modules/shortcuts.js',
                'src/legacy/modules/kiln-diorama.js',
                'src/legacy/modules/scale-ruler-modal.js',
                'src/legacy/modules/collector-card.js',
                'src/legacy/app.js',
                'src/legacy/ui-enhance.js'
            ]
        },
        { name: 'legacy-pottery', out: 'assets/legacy-pottery.js', lazy: true, files: ['src/legacy/pottery-workshop.js'] },
        { name: 'legacy-ai', out: 'assets/legacy-ai.js', lazy: true, files: ['src/legacy/ai-recognition.js'] },
        { name: 'legacy-audio-data', out: 'assets/legacy-audio-data.js', lazy: true, minify: false, files: ['src/legacy/museum-audio-data.js'] },
        { name: 'legacy-scanned-data', out: 'assets/legacy-scanned-data.js', lazy: true, minify: false, files: ['src/legacy/scanned-models-data.js'] }
    ],
    esm: []
};

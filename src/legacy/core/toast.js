/**
 * 华夏器道 · 无障碍全局消息提示服务 (ToastService)
 */
(function (global) {
    'use strict';

    function show(msg, duration = 2800) {
        let text = String(msg || '');
        if (typeof global.tText === 'function') {
            text = global.tText(text);
        }
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            toast.setAttribute('aria-atomic', 'true');
            document.body.appendChild(toast);
        }
        toast.textContent = text;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
    }

    global.ToastService = { show };
    global.showToast = show;
})(window);

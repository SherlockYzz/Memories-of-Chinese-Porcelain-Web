/** 全局消息提示（无障碍：role=status + aria-live）。 */
import { tr } from './i18n.js';

let timer = 0;

export function show(message, duration = 2800) {
    const text = tr(String(message == null ? '' : message));
    let el = document.getElementById('toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), duration);
}

export const toast = { show };
export default toast;

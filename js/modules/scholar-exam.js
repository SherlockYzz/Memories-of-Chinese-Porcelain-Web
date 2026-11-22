/**
 * 模块：独立学者研鉴札记 & “文博殿试”古陶瓷互动考卷 (scholar-exam)
 */
(function (global) {
    'use strict';

    let currentQuizIdx = 0;
    let quizScore = 0;
    let quizAnswered = false;

    function tr(s) {
        return typeof global.tText === 'function' ? global.tText(s) : s;
    }

    function renderScholarNotes() {
        const container = document.getElementById('scholar-notes-container');
        if (!container || typeof scholarNotes === 'undefined') return;

        container.innerHTML = scholarNotes.map((note, idx) => `
            <div class="feature-card p-6 hover-lift text-left flex flex-col justify-between cursor-pointer" onclick="openScholarNoteModal(${idx})">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <span class="badge bg-yuebai text-tianqing-deep text-xs border border-border-light">${tr(note.category)}</span>
                        <span class="text-[11px] text-amber-400 font-mono"><i class="fa-regular fa-clock mr-1" aria-hidden="true"></i>${tr(note.readTime || '6分钟')}</span>
                    </div>
                    <h4 class="text-lg font-serif-cn text-text-title font-semibold mb-2.5 leading-snug">${tr(note.title)}</h4>
                    <p class="text-xs text-text-body font-light leading-relaxed line-clamp-3">${tr(note.excerpt)}</p>
                </div>
                <div class="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-xs text-tianqing-deep">
                    <span class="text-text-muted text-[11px]">${tr(note.author || '数字文博实验室')}</span>
                    <span class="font-serif-cn font-medium hover:underline">${tr('展卷深读全文')} &rarr;</span>
                </div>
            </div>
        `).join('');
    }

    function openScholarNoteModal(idx) {
        if (typeof scholarNotes === 'undefined') return;
        const note = scholarNotes[idx];
        if (!note) return;
        const modal = document.getElementById('universal-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = tr(note.title);
        modalBody.innerHTML = `
            <div class="space-y-4 text-left">
                <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-light text-xs text-text-muted">
                    <span><i class="fa-solid fa-building-columns text-tianqing-deep mr-1" aria-hidden="true"></i>${tr(note.author)}</span>
                    <span class="font-mono text-amber-400">${tr(note.date)}</span>
                </div>
                <div class="text-xs sm:text-sm text-text-body leading-relaxed font-light space-y-3">
                    ${tr(note.fullText || `<p>${note.excerpt}</p>`)}
                </div>
            </div>
        `;
        if (global.ModalManager) global.ModalManager.open(modal);
        else modal.classList.add('active');
    }

    function renderScholarQuizCard() {
        const container = document.getElementById('scholar-quiz-container');
        if (!container || typeof scholarQuizData === 'undefined') return;

        if (currentQuizIdx >= scholarQuizData.length) {
            const rankTitle = quizScore >= 5
                ? '【大宋文博翰林学士 · 奉华阁待诏】'
                : (quizScore >= 3 ? '【景德镇御器厂督陶司丞】' : '【格物致知·博古研习生】');
            container.innerHTML = `
                <div class="text-center py-6 space-y-4">
                    <div class="w-16 h-16 rounded-full bg-amber-700/30 border border-amber-400 flex items-center justify-center mx-auto text-amber-400 text-2xl">
                        <i class="fa-solid fa-award" aria-hidden="true"></i>
                    </div>
                    <span class="badge bg-tianqing-deep text-white text-xs">${tr('博古殿试圆满礼成')}</span>
                    <h4 class="text-2xl font-serif-cn font-semibold text-text-title">${tr('您的殿试成绩：')}${quizScore} / ${scholarQuizData.length} ${tr('题')}</h4>
                    <p class="text-base font-serif-cn text-amber-400 font-medium">${tr('敕授雅衔：')}${tr(rankTitle)}</p>
                    <p class="text-xs text-text-body max-w-lg mx-auto font-light">${tr('“器以载道，格物致知。” 您已深入掌握两宋五大名窑与明清御窑的矿物化学、热应力开片及器物学精髓。')}</p>
                    <div class="pt-2">
                        <button onclick="restartScholarQuiz()" class="px-6 py-2.5 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn hover:bg-tianqing transition-colors">
                            <i class="fa-solid fa-rotate-right mr-1" aria-hidden="true"></i>${tr('重新开卷应试')}
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const q = scholarQuizData[currentQuizIdx];
        container.innerHTML = `
            <div class="space-y-4 text-left">
                <div class="flex items-center justify-between text-xs pb-2 border-b border-border-light">
                    <span class="badge bg-tianqing-deep text-white">${tr('殿试策问 · 第')} ${currentQuizIdx + 1} / ${scholarQuizData.length} ${tr('题')}</span>
                    <span class="font-mono text-amber-400">${tr('当前累计答对：')}${quizScore} ${tr('题')}</span>
                </div>
                <h4 class="text-sm sm:text-base font-serif-cn text-text-title font-medium leading-relaxed">${tr(q.question)}</h4>
                <div class="grid sm:grid-cols-2 gap-2.5" id="quiz-options-box">
                    ${q.options.map((opt, oIdx) => `
                        <button onclick="submitQuizAnswer(${oIdx})" class="quiz-opt-btn p-3 rounded-xl bg-bg-main border border-border-light hover:border-tianqing text-left text-xs text-text-body font-serif-cn transition-all">
                            ${tr(opt)}
                        </button>
                    `).join('')}
                </div>
                <div id="quiz-explanation-box" class="hidden p-3.5 rounded-xl bg-yuebai/50 border border-border-light text-xs text-text-body leading-relaxed"></div>
            </div>
        `;
        quizAnswered = false;
    }

    function submitQuizAnswer(selectedIdx) {
        if (quizAnswered || typeof scholarQuizData === 'undefined') return;
        quizAnswered = true;
        const q = scholarQuizData[currentQuizIdx];
        const isCorrect = selectedIdx === q.answer;
        if (isCorrect) {
            quizScore++;
            if (typeof global.playPorcelainChime === 'function') global.playPorcelainChime(2680);
        } else {
            if (typeof global.playCrackleSound === 'function') global.playCrackleSound();
        }

        const btns = document.querySelectorAll('.quiz-opt-btn');
        btns.forEach((btn, idx) => {
            if (idx === q.answer) {
                btn.classList.add('border-amber-400', 'bg-tianqing-deep', 'text-white');
            } else if (idx === selectedIdx && !isCorrect) {
                btn.classList.add('border-red-500', 'text-red-500');
            }
        });

        const expBox = document.getElementById('quiz-explanation-box');
        if (expBox) {
            expBox.classList.remove('hidden');
            expBox.innerHTML = `
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <strong class="${isCorrect ? 'text-amber-400' : 'text-red-500'} font-serif-cn block mb-1">
                            ${isCorrect ? `✓ ${tr('金榜落笔·回答正确！')}` : `✗ ${tr('尚差毫厘·正解如左')}`}
                        </strong>
                        <span>${tr(q.explanation)}</span>
                    </div>
                    <button onclick="nextScholarQuiz()" class="px-4 py-2 rounded-full bg-tianqing-deep text-white text-xs font-serif-cn shrink-0 hover:bg-tianqing transition-colors">
                        ${currentQuizIdx + 1 < scholarQuizData.length ? `${tr('下一策问')} &rarr;` : `${tr('揭榜授衔')} &rarr;`}
                    </button>
                </div>
            `;
        }
    }

    function nextScholarQuiz() {
        currentQuizIdx++;
        renderScholarQuizCard();
    }

    function restartScholarQuiz() {
        currentQuizIdx = 0;
        quizScore = 0;
        renderScholarQuizCard();
    }

    function refreshAll() {
        renderScholarNotes();
        renderScholarQuizCard();
    }

    global.AppRegistry.register({
        id: 'scholar-exam',
        phase: 3,
        init: refreshAll,
        onLangChange: refreshAll,
        publicApi: {
            renderScholarNotes,
            openScholarNoteModal,
            renderScholarQuizCard,
            submitQuizAnswer,
            nextScholarQuiz,
            restartScholarQuiz
        },
        globalBindings: {
            openScholarNoteModal,
            submitQuizAnswer,
            nextScholarQuiz,
            restartScholarQuiz
        }
    });
})(window);

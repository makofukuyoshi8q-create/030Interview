(function () {
    // --- 1. 画像のプリロード（共通） ---
    const totalPaperFrames = 13;
    for (let i = 1; i <= totalPaperFrames; i++) {
        const img = new Image();
        img.src = `images/paper-${i}.png`;
    }
}
)();
// ...existing code...

/* ---------- interview-section 内のスクロールを内側にフォワードする ----------
   変更点：container の progress（outer scroll）を基準に転送を行う。
   これで「スクロール領域（container）の間だけ固定挙動」が期待どおりになります。
*/
(function attachInnerScrollForwarding() {
    const selector = '.interview-section .clipboard-sticky-wrapper';
    function getNodes() {
        // container を基準に progress を計算するため container も取得
        const wrapper = document.querySelector(selector);
        const container = wrapper ? wrapper.closest('.clipboard-container') : null;
        const inner = wrapper ? wrapper.querySelector('.inner-block') : null;
        return { wrapper, container, inner };
    }

    function containerInStickyRange(container) {
        if (!container) return false;
        const r = container.getBoundingClientRect();
        const scrolled = Math.max(0, -r.top);
        const maxScroll = Math.max(1, r.height - window.innerHeight);
        const progress = Math.min(1, scrolled / maxScroll);
        // 「領域に入り始めたら固定開始、領域を抜けたら解除」
        return progress > 0 && progress < 1;
    }

    // Wheel (desktop)： passive:false 必須（preventDefault を使うため）
    window.addEventListener('wheel', (ev) => {
        const { wrapper, container, inner } = getNodes();
        if (!wrapper || !container || !inner) return;
        if (!containerInStickyRange(container)) return;

        const delta = ev.deltaY;
        const atTop = inner.scrollTop <= 0 && delta < 0;
        const atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1 && delta > 0;

        if (!atTop && !atBottom) {
            inner.scrollTop += delta;
            ev.preventDefault();
        }
        // 端だったらページスクロールに委譲（prevent しない）
    }, { passive: false });

    // Touch (mobile)
    let lastTouchY = null;
    window.addEventListener('touchstart', (ev) => {
        const { wrapper, container } = getNodes();
        if (!wrapper || !container || !containerInStickyRange(container)) { lastTouchY = null; return; }
        lastTouchY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : null;
    }, { passive: true });

    window.addEventListener('touchmove', (ev) => {
        const { wrapper, container, inner } = getNodes();
        if (!wrapper || !container || !inner || lastTouchY === null) return;
        if (!containerInStickyRange(container)) { lastTouchY = null; return; }

        const touchY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : null;
        if (touchY === null) return;

        const delta = lastTouchY - touchY;
        const atTop = inner.scrollTop <= 0 && delta < 0;
        const atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1 && delta > 0;

        if (!atTop && !atBottom) {
            inner.scrollTop += delta;
            ev.preventDefault();
        } else {
            lastTouchY = touchY;
        }
        lastTouchY = touchY;
    }, { passive: false });

    console.log('attachInnerScrollForwarding: listeners attached (selector=', selector, ')');
})();


// --- 2. スクロールイベント ---
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // 【A】トップページ専用の処理（index.html用）
    const topSection = document.querySelector('.top-page-section');
    const topImage = document.getElementById('top-image');
    const topTitle = document.querySelector('.top-title');

    if (topSection && topImage) {
        const sectionTop = topSection.offsetTop;
        const sectionHeight = topSection.offsetHeight - window.innerHeight;
        let progress = (scrollY - sectionTop) / sectionHeight;
        progress = Math.max(0, Math.min(1, progress * 2));

        const frameIndex = Math.min(10, Math.floor(progress * 10) + 1);
        topImage.src = `images/top-${frameIndex}.png`;

        if (topTitle) {
            topTitle.style.opacity = Math.min(1, progress * 2);
        }
    }

    /* ...existing code... */
    (function manageClipboardOverlay() {
        // content-area の clipboard を対象（index/chapter 両方で動くように）
        const containers = document.querySelectorAll('.content-area > .clipboard-container, .clipboard-container');
        if (!containers || containers.length === 0) return;

        containers.forEach(container => {
            const wrapper = container.querySelector('.clipboard-sticky-wrapper');
            if (!wrapper) return;

            // wrapper が画面の半分以上見えたらオーバーレイを付ける（閾値は調整可）
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.intersectionRatio > 0.5) {
                        container.classList.add('has-overlay');
                    } else {
                        container.classList.remove('has-overlay');
                    }
                });
            }, { threshold: [0, 0.5] });

            observer.observe(wrapper);
        });
    })();
    /* ...existing code... */

    // 【B】クリップボードめくり処理（chapter1では3枚めくり対応、indexでは従来通り）
    const container = document.querySelector('.interview-section .clipboard-container') || document.querySelector('.clipboard-container');
    const paperImg = document.getElementById('paper-image');
    const firstPage = document.getElementById('first-page') || document.querySelector('.first-page') || null;
    const secondPage = document.getElementById('second-page') || document.querySelector('.second-page') || null;
    const thirdPage = document.getElementById('third-page') || null;

    /* ...existing code... */
    if (container && paperImg) {
        const rect = container.getBoundingClientRect();
        const scrolled = Math.max(0, -rect.top);
        const maxScroll = Math.max(1, rect.height - window.innerHeight);
        let progress = Math.min(1, scrolled / maxScroll);

        const totalFrames = 13; // paper-1 ... paper-13

        // フェード開始を遅らせたい場合は fadeStart を大きくする（例: 0.4）
        const fadeStart = 0.25;
        const fadeEnd = 0.35;

        // overlay が未定義になる可能性があるので安全に取得
        const overlay = firstPage || (container ? container.querySelector('.first-page') : null);

        if (thirdPage) {
            // chapter1: 2段階めくり
            const animStart1 = 0.25;
            const animEnd1 = 0.38;
            const showSecond = 0.38;

            const animStart2 = 0.50;
            const animEnd2 = 0.78;
            const showThird = 0.78;

            const pageFade = 0.12;

            // first-page のフェードアウト（fadeStart -> fadeEnd を使用）
            if (firstPage) {
                if (progress <= fadeStart) {
                    firstPage.style.opacity = '1';
                    firstPage.style.visibility = 'visible';
                } else if (progress > fadeStart && progress <= fadeEnd) {
                    const local = (progress - fadeStart) / (fadeEnd - fadeStart);
                    firstPage.style.opacity = String(Math.max(0, 1 - local));
                    firstPage.style.visibility = 'visible';
                } else {
                    firstPage.style.opacity = '0';
                    firstPage.style.visibility = 'hidden';
                }
            }

            // overlay（同一扱い）も安全に制御
            if (overlay) {
                if (progress <= fadeStart) {
                    overlay.style.opacity = '1';
                    overlay.style.visibility = 'visible';
                } else if (progress > fadeStart && progress <= fadeEnd) {
                    const fadeProgress = (progress - fadeStart) / (fadeEnd - fadeStart);
                    overlay.style.opacity = String(Math.max(0, 1 - fadeProgress));
                    overlay.style.visibility = 'visible';
                } else {
                    overlay.style.opacity = '0';
                    overlay.style.visibility = 'hidden';
                }
            }

            // 紙のフレーム制御（1回目／間隔／2回目）
            if (progress >= animStart1 && progress <= animEnd1) {
                const norm = (progress - animStart1) / (animEnd1 - animStart1);
                const idx = Math.min(totalFrames, Math.max(1, Math.floor(norm * (totalFrames - 1)) + 1));
                paperImg.src = `images/paper-${idx}.png`;
            } else if (progress > animEnd1 && progress < animStart2) {
                paperImg.src = `images/paper-1.png`;
            } else if (progress >= animStart2 && progress <= animEnd2) {
                const norm2 = (progress - animStart2) / (animEnd2 - animStart2);
                const idx2 = Math.min(totalFrames, Math.max(1, Math.floor(norm2 * (totalFrames - 1)) + 1));
                paperImg.src = `images/paper-${idx2}.png`;
            } else if (progress < animStart1) {
                paperImg.src = `images/paper-1.png`;
            } else {
                paperImg.src = `images/paper-13.png`;
            }

            // 2枚目表示・フェード制御（2→3 の時にフェードアウト）
            if (secondPage) {
                const inner = secondPage.querySelector('.inner-block');
                if (progress >= showSecond && progress < animStart2) {
                    secondPage.style.opacity = '1';
                    secondPage.style.visibility = 'visible';
                    secondPage.style.pointerEvents = 'auto';
                    if (inner) inner.classList.add('revealed');
                } else if (progress >= animStart2 && progress <= (animStart2 + pageFade)) {
                    const local = (progress - animStart2) / pageFade;
                    secondPage.style.opacity = String(Math.max(0, 1 - local));
                    secondPage.style.visibility = 'visible';
                    secondPage.style.pointerEvents = 'none';
                    if (inner) inner.classList.remove('revealed');
                } else {
                    secondPage.style.opacity = '0';
                    secondPage.style.visibility = 'hidden';
                    secondPage.style.pointerEvents = 'none';
                    if (inner) inner.classList.remove('revealed');
                }
            }

            // 3枚目表示判定
            if (thirdPage) {
                const inner3 = thirdPage.querySelector('.inner-block');
                if (progress >= showThird) {
                    thirdPage.style.opacity = '1';
                    thirdPage.style.visibility = 'visible';
                    thirdPage.style.pointerEvents = 'auto';
                    if (inner3) inner3.classList.add('revealed');
                } else {
                    thirdPage.style.opacity = '0';
                    thirdPage.style.visibility = 'hidden';
                    thirdPage.style.pointerEvents = 'none';
                    if (inner3) inner3.classList.remove('revealed');
                }
            }

        } else {
            // index 等：thirdPage がない場合（従来通りの1回めくり）
            const animStart = 0.25;
            const animEnd = 0.45;

            // first-page のフェードアウト（fadeStart -> fadeEnd を使用）
            if (firstPage) {
                if (progress <= fadeStart) {
                    firstPage.style.opacity = '1';
                    firstPage.style.visibility = 'visible';
                } else if (progress > fadeStart && progress <= fadeEnd) {
                    const local = (progress - fadeStart) / (fadeEnd - fadeStart);
                    firstPage.style.opacity = String(Math.max(0, 1 - local));
                    firstPage.style.visibility = 'visible';
                } else {
                    firstPage.style.opacity = '0';
                    firstPage.style.visibility = 'hidden';
                }
            }

            // 紙フレーム
            if (progress >= animStart && progress <= animEnd) {
                const norm = (progress - animStart) / (animEnd - animStart);
                const idx = Math.min(totalFrames, Math.max(1, Math.floor(norm * (totalFrames - 1)) + 1));
                paperImg.src = `images/paper-${idx}.png`;
            } else if (progress < animStart) {
                paperImg.src = `images/paper-1.png`;
            } else {
                paperImg.src = `images/paper-13.png`;
            }

            if (secondPage) {
                const inner = secondPage.querySelector('.inner-block');
                if (progress >= animEnd) {
                    secondPage.style.opacity = '1';
                    secondPage.style.visibility = 'visible';
                    secondPage.style.pointerEvents = 'auto';
                    if (inner) inner.classList.add('revealed');
                } else {
                    secondPage.style.opacity = '0';
                    secondPage.style.visibility = 'hidden';
                    secondPage.style.pointerEvents = 'none';
                    if (inner) inner.classList.remove('revealed');
                }
            }
        }
    }
    /* ...existing code... */

    // 【C】その他の要素 (Turning Pointなど)
    const triggerSection = document.getElementById('turning-point-trigger');
    const fullTreeImg = document.getElementById('turning-tree-full');
    if (triggerSection && fullTreeImg) {
        const sectionTop = triggerSection.offsetTop;
        const sectionHeight = triggerSection.offsetHeight - window.innerHeight;
        let treeProgress = Math.max(0, Math.min(1, (scrollY - sectionTop) / sectionHeight));
        const treeIndex = Math.min(7, Math.floor(treeProgress * 7) + 1);
        fullTreeImg.src = `images/tree-${treeIndex}.png`;
    }
}, { passive: true });
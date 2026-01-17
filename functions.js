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

    // 【B】クリップボードめくり処理 (ここを新HTMLに合わせて修正)
    const container = document.querySelector('.interview-section .clipboard-container') || document.querySelector('.clipboard-container');
    const paperImg = document.getElementById('paper-image');
    const firstPage = document.getElementById('first-page') || document.querySelector('.first-page') || null;
    const secondPage = document.getElementById('second-page') || document.querySelector('.second-page') || null;

    if (container && paperImg) {
        const rect = container.getBoundingClientRect();
        
    
        const scrolled = Math.max(0, -rect.top);
        const maxScroll = Math.max(1, rect.height - window.innerHeight);
        let progress = Math.min(1, scrolled / maxScroll);

        const fadeEnd = 0.35;   // 1枚目が消え終わるタイミング
        const animStart = 0.35; // めくりが始まるタイミング
        const animEnd = 0.7;   // めくりが終わるタイミング
        const showStart = 0.65; // 2枚目が出始めるタイミング

        // 1枚目（first-page）のフェード処理
        if (firstPage) {
            if (progress <= fadeEnd) {
                firstPage.style.opacity = String(1 - (progress / fadeEnd));
                firstPage.style.visibility = 'visible';
            } else {
                firstPage.style.opacity = '0';
                firstPage.style.visibility = 'hidden';
            }
        }

        // フレームアニメーション (paper-1 〜 paper-13)
        const norm = Math.max(0, Math.min(1, (progress - animStart) / (animEnd - animStart)));
        const frameIndex = Math.min(13, Math.max(1, Math.floor(norm * 12) + 1));
        paperImg.src = `images/paper-${frameIndex}.png`;

        // 2枚目（second-page）の表示判定
        if (secondPage) {
            const innerBlock = secondPage.querySelector('.inner-block');
            if (progress >= showStart) {
                secondPage.style.opacity = '1';
                secondPage.style.visibility = 'visible';
                secondPage.style.pointerEvents = 'auto';
                if (innerBlock) innerBlock.classList.add('revealed'); // Prologue 表示用
            } else {
                secondPage.style.opacity = '0';
                secondPage.style.visibility = 'hidden';
                secondPage.style.pointerEvents = 'none';
                if (innerBlock) innerBlock.classList.remove('revealed');
            }
        }
    }

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
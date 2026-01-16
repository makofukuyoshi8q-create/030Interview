// ...existing code...

// 画像のプリロード（読み込み待ちによるチカチカを防止）
const totalFrames = 10;
for (let i = 1; i <= totalFrames; i++) {
    const img = new Image();
    img.src = `images/top-${i}.png`;
}

window.addEventListener('scroll', () => {
    const topSection = document.querySelector('.top-page-section');
    const topImage = document.getElementById('top-image');
    const topTitle = document.querySelector('.top-title');

    const scrollY = window.scrollY;
    const sectionTop = topSection.offsetTop;
    const sectionHeight = topSection.offsetHeight - window.innerHeight;

    let progress = (scrollY - sectionTop) / sectionHeight;
    progress = Math.max(0, Math.min(1, progress * 2));

    // --- 画像の切り替え ---
    const totalFrames = 10;
    const frameIndex = Math.min(
        Math.floor(progress * totalFrames) + 1,
        totalFrames
    );
    topImage.src = `images/top-${frameIndex}.png`;

    const textOpacity = Math.min(1, progress * 2);
    topTitle.style.opacity = textOpacity;

    // 位置もじわじわ上に上げる（10pxから0pxへ）
    const translateY = 10 - (textOpacity * 10);
    topTitle.style.transform = `translateY(${translateY}px)`;
});

// ...existing code...

// --- clipboard セクション用のスクロール処理（オーバーレイ→フレーム→めくり→Prologue 表示） ---
(function () {
    const container = document.querySelector('.clipboard-container');
    const paperImg = document.getElementById('paper-image');
    const currentSheet = document.querySelector('.current-sheet');
    const topTitle = document.querySelector('.top-title');
    const overlay = document.getElementById('paper-overlay');

    if (!container || !paperImg || !currentSheet || !overlay) return;

    const frameCount = 13; // images/paper-1.png ... paper-13.png
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = `images/paper-${i}.png`;
    }

    const fadeStart = 0.4;
    const fadeEnd = 0.3;   // 0..fadeEnd: overlay フェードアウト領域（短めにして素早く消す）
    const animStart = fadeEnd;
    const animEnd = 0.5;    // animStart..animEnd: フレーム切替領域（やや圧縮）

    let flipped = false;

    // functions.js の onScroll 関数内を差し替え
    function onScroll() {
        const rect = container.getBoundingClientRect();
        const scrolled = Math.max(0, -rect.top);
        const maxScroll = Math.max(1, rect.height - window.innerHeight);
        let progress = Math.min(1, scrolled / maxScroll);

        // 1. overlay (プロフィール) のフェード処理
        if (progress <= fadeEnd) {
            const t = progress / fadeEnd;
            overlay.style.opacity = String(1 - t);
            overlay.style.visibility = 'visible';
            overlay.style.pointerEvents = 'auto';
        } else {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden'; // display: none は使わず visibility で制御
            overlay.style.pointerEvents = 'none';
        }

        // 2. フレームアニメーション (paper-1 〜 paper-13)
        const norm = Math.max(0, Math.min(1, (progress - animStart) / (animEnd - animStart)));
        const frameIndex = Math.min(frameCount, Math.max(1, Math.floor(norm * (frameCount - 1)) + 1));
        paperImg.src = `images/paper-${frameIndex}.png`;

        // 3. プロローグ表示の判定
        // paper-13 に到達したかどうかを重視する
        if (frameIndex === frameCount && progress > 0.7) {
            if (!flipped) {
                currentSheet.classList.add('revealed');
                flipped = true;
            }
        } else {
            if (flipped) {
                currentSheet.classList.remove('revealed');
                flipped = false;
            }
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
})();




/// すでに記述がある場合は、このロジックに差し替えてください
window.addEventListener('scroll', () => {
    const triggerSection = document.getElementById('turning-point-trigger');
    const fullTreeImg = document.getElementById('turning-tree-full');

    if (!triggerSection || !fullTreeImg) return;

    const scrollY = window.scrollY;
    const sectionTop = triggerSection.offsetTop;
    const sectionHeight = triggerSection.offsetHeight - window.innerHeight;

    // セクションに入っている間だけ計算
    let progress = (scrollY - sectionTop) / sectionHeight;
    progress = Math.max(0, Math.min(1, progress * 1.5));

    // tree-1 〜 tree-7
    const totalTreeFrames = 7;
    // progressが1のときにちょうど7枚目になるように計算
    const treeIndex = Math.min(
        totalTreeFrames,
        Math.floor(progress * (totalTreeFrames - 0.01)) + 1
    );

    const nextSrc = `images/tree-${treeIndex}.png`;
    if (fullTreeImg.getAttribute('src') !== nextSrc) {
        fullTreeImg.src = nextSrc;
    }
});





function scrollToSection(selector) {
    const target = document.querySelector(selector);
    if (target) {
        // ヘッダーなどがある場合に備え、少し上（100pxなど）に余裕を持って止める
        const offset = 100;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}
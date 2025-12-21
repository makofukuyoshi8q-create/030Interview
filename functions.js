// 画像のプリロード（読み込み待ちによるチカチカを防止）
const totalFrames = 8;
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
    const totalFrames = 8;
    const frameIndex = Math.min(
        Math.floor(progress * totalFrames) + 1,
        totalFrames
    );
    topImage.src = `images/top-${frameIndex}.png`;

    // --- 文字のじわじわ浮き出し ---
    // progressが 0.5 (半分) くらいで完全に表示されるように「progress * 2」に設定
    // ※もっとゆっくり表示させたい場合は「progress * 1」など調整してください
    const textOpacity = Math.min(1, progress * 2); 
    topTitle.style.opacity = textOpacity;

    // 位置もじわじわ上に上げる（10pxから0pxへ）
    const translateY = 10 - (textOpacity * 10);
    topTitle.style.transform = `translateY(${translateY}px)`;
});

window.addEventListener('scroll', () => {
    const paper = document.querySelector('.current-sheet');
    const container = document.querySelector('.clipboard-container');
    
    const rect = container.getBoundingClientRect();

    // 画面の一枚分（window.innerHeight）くらいスクロールしてからめくりたい場合
    // 「要素の上端が、画面の上からマイナス（画面外に少し出た状態）」を条件にします
    if (rect.top < -window.innerHeight * 0.5) { 
        paper.classList.add('is-flipped');
    } else {
        paper.classList.remove('is-flipped');
    }
});

window.addEventListener('scroll', () => {
    // クラス名を実際のHTMLに合わせて指定
    const section = document.querySelector('.tenki-section');
    const frames = document.querySelectorAll('.tree-frame');
    
    if (!section || frames.length === 0) return;

    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight - window.innerHeight;
    const scrollY = window.scrollY - sectionTop;

    // セクション内にいるときだけ実行
    if (scrollY >= 0 && scrollY <= sectionHeight) {
        const progress = scrollY / sectionHeight;
        
        // 10枚の画像から、現在の進捗に合うインデックスを計算
        const frameIndex = Math.min(
            frames.length - 1,
            Math.floor(progress * frames.length)
        );

        frames.forEach((frame, index) => {
            if (index === frameIndex) {
                frame.classList.add('active');
            } else {
                frame.classList.remove('active');
            }
        });
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
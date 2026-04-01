/**
 * ##########################################################
 * YouTube 外部プレーヤー制御（完成版）
 * - 遅延読み込み（IntersectionObserver）
 * - 二重生成防止
 * - API未ロード対策
 * - シーンジャンプ予約対応
 * - 最低限のエラーハンドリング			v.260120.1c
 * ##########################################################
 */

// 生成済みプレーヤー管理
const players = {};

// プレーヤーID → YouTube動画ID
const videoConfigs = {
    'player1': '6bnaBnd4kyU',
    'player2': 'NmP_EJdcE6E',
    'player3': 'gA6Qf7iu8SE',
    'player4': 'j6P_m6adkgc',
    'player5': 'HOmS6Kn0bn8',
    'player6': 'Dji-ehIz5_k',
    'player7': '7Yu1A-M5SIc',
    'player8': 'Dr44J7r125Y',	// 8まで利用中
    'player9': 'L1fVzqyxqFc', //test
    'player10': 'bSosw3_lwq0',
    'player-k1': 'k7cpjmkc1Rw', // かなたそ
    'player-k2': 'Z2K1H9D0DZ8',
    'player-k3': 'dWhH50ADZTc',
    'player-k4': 'Ktk_EDLDPeY',
    'player-k5': 'RznzWYHfalc',
    'player-k6': 'dgoqNuHAt9A',
    'player-k7': 'IdXhY6zGC4s',
    'player-k8': 'gAZNSCYfx0M',
    'player-k9': 'L1fVzqyxqFc',
    'player-k10': 'bSosw3_lwq0',
    'player-u1': 'EysutYiUyec', // 歌っちゃ王
    'player-u2': 'Y6NclTEctRw',
};





// シーンジャンプの予約（未生成時）
const pendingSeek = {};

/**
 * YouTube IFrame API 準備完了時に自動実行
 */
function onYouTubeIframeAPIReady() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const id = entry.target.id;
            const videoId = videoConfigs[id];

            if (videoId) {
                initPlayer(id, videoId);
            }

            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '200px'
    });

    Object.keys(videoConfigs).forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
    });
}

/**
 * プレーヤー生成（安全対策込み）
 */
function initPlayer(id, videoId) {
    // 二重生成防止
    if (players[id]) return;

    // API未ロード対策
    if (!window.YT || typeof YT.Player !== 'function') {
        console.warn('YouTube API is not ready:', id);
        return;
    }

    players[id] = new YT.Player(id, {
        videoId: videoId,
        width: '560',
        height: '315',
        playerVars: {
            playsinline: 1,
            rel: 0
        },
        events: {
            onReady: (event) => {
                // ローダー非表示
                const loader = document.getElementById(`loader-${id}`);
                if (loader) loader.style.display = 'none';

                // シーンジャンプ予約があれば実行
                if (pendingSeek[id] != null) {
                    event.target.seekTo(pendingSeek[id], true);
                    event.target.playVideo();
                    delete pendingSeek[id];
                }

                console.log(`Player ${id} is ready`);
            },
            onError: (event) => {
                console.error(`Player ${id} error:`, event.data);
            }
        }
    });
}

/**
 * シーンジャンプ（イベント委譲）
 */
document.addEventListener('click', (event) => {
    const link = event.target.closest('.scene-jump');
    if (!link) return;

    event.preventDefault();

    const targetId = link.getAttribute('data-target');
    const time = parseFloat(link.getAttribute('data-time'));

    if (!targetId || isNaN(time)) return;

    // すでにプレーヤーがある場合
    if (players[targetId] && typeof players[targetId].seekTo === 'function') {
        players[targetId].seekTo(time, true);
        players[targetId].playVideo();
        return;
    }

    // 未生成の場合：予約してスクロール
    pendingSeek[targetId] = time;

    const el = document.getElementById(targetId);
    if (el) {
        el.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
});

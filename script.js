// =====================================
// グローバル変数と定数
// =====================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// ゲーム状態
const GAME_STATE = {
    TITLE: 0,
    COUNTDOWN: 1,
    PLAYING: 2,
    GAMEOVER: 3,
    CLEARED: 4
};
let currentGameState = GAME_STATE.TITLE;

// 猫の移動
let catX, catY;
let catSpeed = 5;
let catMoving = true;
let mouseX = GAME_WIDTH / 2;
let mouseY = GAME_HEIGHT / 2;

// スコアと時間
let currentScore = 0;
const GAME_DURATION = 30 * 1000; // 30秒
let gameStartTime = 0;
let lastItemSpawnTime = 0;
const ITEM_SPAWN_INTERVAL = 1000; // 1秒ごとにアイテムをPOP
let activeItems = []; // 画面上のアクティブなアイテムリスト

// デバフ関連
let debuffActive = false;
let debuffStartTime = 0;
const DEBUFF_DURATION = 5 * 1000; // 5秒

// ★追加: ルンバ乗車状態関連
let roboCatActive = false;
let roboCatStartTime = 0;
const ROBOCAT_DURATION = 4 * 1000; // 4秒
const ROBOCAT_SPEED_MULTIPLIER = 2.0; // スピードアップ倍率 (例: 2倍)


// 掃除機とルンバの移動
let movingObjects = []; // { itemRef: ItemObject, dx: number, dy: number }
const MOVING_SPEED = 3;

// ハイスコア
const HIGHSCORE_STORAGE_KEY = 'catGameHighscores';
let highscores = [];

// UI要素
const startScreen = document.getElementById('start-screen');
const countdownScreen = document.getElementById('countdown-screen');
const gameOverScreen = document.getElementById('game-over-screen'); // <-- ハイフンを追加
const gameClearScreen = document.getElementById('game-clear-screen'); // <-- ハイフンを追加
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const clearRestartButton = document.getElementById('clearRestartButton');
const countdownPaws = document.getElementById('countdown-paws');
const countdownText = document.getElementById('countdown-text');
const finalScoreText = document.getElementById('final-score');
const scoreList = document.getElementById('score-list');
const muteButton = document.getElementById('muteButton');
const momImgElement = document.getElementById('mom-img');
const manzokuCatImgElement = document.getElementById('manzoku-cat-img'); // ★追加
const currentScoreDisplay = document.getElementById('current-score-display');
const currentScoreValue = document.getElementById('current-score-value');

// サウンド関連
let bgmPlaying = true;
let BGM;
const SOUNDS = {};

// =====================================
// 画像と音声ファイルのロード
// =====================================
const images = {};
const assetsToLoad = [
    { name: 'cat', src: 'assets/images/ImCat.png' },
    { name: 'catTape', src: 'assets/images/ImCatTapeplus.png' },
    { name: 'mom', src: 'assets/images/mom.png' },
    { name: 'stage', src: 'assets/images/stage.png' },
    { name: 'goal', src: 'assets/images/goal.png' },
    { name: 'startBtn', src: 'assets/images/start.png' },
    { name: 'countdownPaw', src: 'assets/images/count.png' },
    { name: 'sasimi', src: 'assets/images/sasimi.png' },
    { name: 'tunakan', src: 'assets/images/tunakan.png' },
    { name: 'sakana', src: 'assets/images/sakana.png' },
    { name: 'cake', src: 'assets/images/cake.png' },
    { name: 'kyuuri', src: 'assets/images/kyuuri.png' },
    { name: 'soujiki', src: 'assets/images/soujiki.png' },
    { name: 'syawa', src: 'assets/images/syawa-.png' },
    { name: 'tape', src: 'assets/images/tape.png' },
    { name: 'robo', src: 'assets/images/robo.png' },
    { name: 'roboCat', src: 'assets/images/robocat.png' }, // ★追加: 新しいルンバに乗った猫の画像
    { name: 'manzokuCat', src: 'assets/images/manzokucat.png' }, // ★追加: 満足猫の画像


    // サウンドファイル
    { name: 'bgm_animaruyouchien', src: 'assets/sounds/bgm_animaruyouchien.mp3', type: 'audio' },
    { name: 'cat_op', src: 'assets/sounds/cat_op.wav', type: 'audio' },
    { name: 'cat_get', src: 'assets/sounds/cat_get.wav', type: 'audio' },
    { name: 'dmcat_kyuuri', src: 'assets/sounds/dmcat_kyuuri.wav', type: 'audio' },
    { name: 'dmcat_soujiki', src: 'assets/sounds/dmcat_soujiki.wav', type: 'audio' },
    { name: 'dmcat_syawa', src: 'assets/sounds/dmcat_syawa.wav', type: 'audio' },
    { name: 'dmcat_tape', src: 'assets/sounds/dmcat_tape.wav', type: 'audio' },
    { name: 'count', src: 'assets/sounds/count.wav', type: 'audio' },
    { name: 'cat_start', src: 'assets/sounds/cat_start.wav', type: 'audio' },
    { name: 'cat_goal', src: 'assets/sounds/cat_goal.wav', type: 'audio' },
    { name: 'cat_timeout', src: 'assets/sounds/cat_timeout.wav', type: 'audio' },
];

let assetsLoadedCount = 0;
const totalAssets = assetsToLoad.length;

function loadAssets() {
    return new Promise(resolve => {
        assetsToLoad.forEach(asset => {
            if (asset.type === 'audio') {
                SOUNDS[asset.name] = new Audio(asset.src);
                if (asset.name === 'bgm_animaruyouchien') {
                    BGM = SOUNDS[asset.name];
                    BGM.loop = true;
                    BGM.volume = 0.5;
                }
                SOUNDS[asset.name].addEventListener('canplaythrough', assetLoaded);
                SOUNDS[asset.name].addEventListener('error', (e) => {
                    console.error(`サウンド ${asset.name} のロードエラー:`, e);
                    assetLoaded(); // エラーでもカウントを進める
                });
            } else {
                images[asset.name] = new Image();
                images[asset.name].src = asset.src;
                images[asset.name].onload = assetLoaded; // リサイズ処理を削除
                images[asset.name].onerror = (e) => {
                    console.error(`画像 ${asset.name} のロードエラー:`, e);
                    assetLoaded(); // エラーでもカウントを進める
                };
            }
        });

        function assetLoaded() {
            assetsLoadedCount++;
            if (assetsLoadedCount === totalAssets) {
                resolve();
            }
        }
    });
}

// =====================================
// ゲームオブジェクトの定義
// =====================================

// アイテムデータ
const itemData = {
    // 加点アイテム
    sasimi: { points: 500, imgName: 'sasimi', type: 'score', sound: 'cat_get' },
    tunakan: { points: 100, imgName: 'tunakan', type: 'score', sound: 'cat_get' },
    sakana: { points: 200, imgName: 'sakana', type: 'score', sound: 'cat_get' },
    cake: { points: 50, imgName: 'cake', type: 'score', sound: 'cat_get' },
    // 減点アイテム
    kyuuri: { points: -100, imgName: 'kyuuri', type: 'penalty', sound: 'dmcat_kyuuri' },
    soujiki: { points: -200, imgName: 'soujiki', type: 'penalty', sound: 'dmcat_soujiki' },
    syawa: { points: -500, imgName: 'syawa', type: 'penalty', sound: 'dmcat_syawa' },
    tape: { points: -50, imgName: 'tape', type: 'penalty', sound: 'dmcat_tape', debuff: true },
    // ダミーアイテム
    robo: { points: 0, imgName: 'robo', type: 'effect', effect: 'roboCat' } // typeを'effect'に変更し、effectプロパティを追加
};

// アイテムの全キーリスト (ランダムPOP用)
const allItemKeys = Object.keys(itemData);

class Item {
    constructor(name) {
        const data = itemData[name];
        this.name = name;
        this.img = images[data.imgName];
        this.type = data.type;
        this.points = data.points;
        this.sound = data.sound;
        this.debuff = data.debuff || false;
        this.effect = data.effect; // ★追加

        this.width = this.img.width; // 事前縮小された画像の幅を使用
        this.height = this.img.height; // 事前縮小された画像の高さを使用

        // 画面の範囲内でランダムな初期位置を設定
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = Math.random() * (GAME_HEIGHT - this.height);
    }

    draw() {
        // ブラー表示の簡易的なシミュレーション: 半透明で描画
        // ctx.save();
        // ctx.globalAlpha = 0.7; // 半透明度
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height); // 画像の元のサイズを使用
        // ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

// =====================================
// ゲームロジック関数
// =====================================

function resetGame() {
    // 猫の初期位置は、画像がロードされてからその幅/高さを取得できるように、
    // `window.onload`後に`catX`, `catY`を初期化するように変更
    catSpeed = 5;
    catMoving = true;
    currentScore = 0;
    activeItems = [];
    movingObjects = [];
    debuffActive = false;
    // ★追加: ルンバ乗車状態もリセット
    roboCatActive = false;

    gameStartTime = 0; // ゲーム開始時に改めて設定
    lastItemSpawnTime = 0;

    // UIの表示を初期状態に戻す
    hideAllScreens();
    startScreen.classList.add('active');
    updateHighscoreDisplay();
}

function startGame() {
    // playSound('cat_op');ゲームスタートクリックのにゃーん
    hideAllScreens();
    countdownScreen.classList.add('active');
    startCountdown();
    // BGMを再生開始 (自動再生がブロックされる場合があるため、ここで開始)
    if (BGM && BGM.paused) {
        BGM.play().catch(e => console.warn("BGM再生失敗: ", e));
    }
}

let countdownTimer;
function startCountdown() {
    let count = 3;
    // 肉球の表示をリセット
    for(let i = 0; i < countdownPaws.children.length; i++) {
        countdownPaws.children[i].style.display = 'inline-block';
    }
    countdownText.textContent = ''; // 初期テキストクリア

    countdownTimer = setInterval(() => {
        if (count > 0) {
            playSound('count');
            countdownText.textContent = count;
            // 肉球の表示を切り替える
            for(let i = 0; i < countdownPaws.children.length; i++) {
                countdownPaws.children[i].style.display = (i < count) ? 'inline-block' : 'none';
            }
            count--;
        } else {
            playSound('cat_start');
            clearInterval(countdownTimer);
            countdownText.textContent = 'スタート！';
            setTimeout(() => {
                hideAllScreens();
                currentGameState = GAME_STATE.PLAYING;
                gameStartTime = performance.now(); // ゲーム開始時刻を記録
                // ゲーム開始時に猫の位置を再度設定 (アセットロード後に決定されたサイズを使用)
                catX = 50;
                catY = GAME_HEIGHT - images.cat.height - 50;
                catMoving = true; // ゲーム開始時は動いている状態
            }, 500); // 「スタート！」表示後、少し待ってゲーム開始
        }
    }, 1000);
}

function updateGame(deltaTime) {
    const currentTime = performance.now();

    // デバフの管理
    if (debuffActive && currentTime - debuffStartTime > DEBUFF_DURATION) {
        debuffActive = false;
        // catSpeedはdebaffActiveの状態によって決まるため、ここでは直接戻さない
    }

    // 当たり判定の直前あたりにログを追加
    console.log("roboCatActive:", roboCatActive); // roboCatActiveの状態を確認

    // ★追加: ルンバ乗車状態の管理
    if (roboCatActive && currentTime - roboCatStartTime > ROBOCAT_DURATION) {
        roboCatActive = false; // ルンバ乗車状態を解除
        // catSpeedはdebaffActiveの状態によって決まるため、ここでは直接戻さない
    }

    // 猫の移動
    if (catMoving) {
        // ★修正: 猫の現在の画像とスピードを、デバフとルンバ状態によって決定
        let currentCatImage;
        let effectiveCatSpeed = catSpeed; // 基本スピード

        if (roboCatActive) {
            currentCatImage = images.roboCat; // ルンバ猫画像
            effectiveCatSpeed *= ROBOCAT_SPEED_MULTIPLIER; // スピードアップ
            if (debuffActive) { // robocat状態でdebuffもアクティブな場合
                effectiveCatSpeed *= 0.5; // スピードダウンを重ねる
            }
        } else if (debuffActive) {
            currentCatImage = images.catTape; // テープ猫画像
            effectiveCatSpeed *= 0.5; // スピードダウン
        } else {
            currentCatImage = images.cat; // 通常猫画像
            effectiveCatSpeed = catSpeed; // 基本スピード
        }
        
        // catWidthとcatHeightはここで現在の画像から取得
        const catWidth = currentCatImage.width;
        const catHeight = currentCatImage.height;

        const targetX = mouseX - catWidth / 2;
        const targetY = mouseY - catHeight / 2;

        const moveSpeed = effectiveCatSpeed; // 調整されたスピードを使用

        const dx = targetX - catX;
        const dy = targetY - catY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > moveSpeed) {
            catX += (dx / dist) * moveSpeed;
            catY += (dy / dist) * moveSpeed;
        } else {
            catX = targetX;
            catY = targetY;
        }

        // 画面端でのクリップ
        catX = Math.max(0, Math.min(catX, GAME_WIDTH - catWidth));
        catY = Math.max(0, Math.min(catY, GAME_HEIGHT - catHeight));
    }

    // アイテムのPOP
    if (currentTime - lastItemSpawnTime > ITEM_SPAWN_INTERVAL) {
        lastItemSpawnTime = currentTime;
        if (activeItems.length < 10) { // 画面上のアイテム最大数
            const randomItemKey = allItemKeys[Math.floor(Math.random() * allItemKeys.length)];
            const newItem = new Item(randomItemKey);
            activeItems.push(newItem);

            // 動き回るオブジェクトの初期方向設定
            if (randomItemKey === 'soujiki' || randomItemKey === 'robo') {
                const dx = (Math.random() > 0.5 ? 1 : -1) * MOVING_SPEED;
                const dy = (Math.random() > 0.5 ? 1 : -1) * MOVING_SPEED;
                movingObjects.push({ itemRef: newItem, dx: dx, dy: dy });
            }
        }
    }

    // 動くオブジェクトの更新
    for (const obj of movingObjects) {
        const item = obj.itemRef;
        item.x += obj.dx;
        item.y += obj.dy;

        // 画面端での跳ね返り
        if (item.x < 0 || item.x + item.width > GAME_WIDTH) {
            obj.dx *= -1;
            item.x = Math.max(0, Math.min(item.x, GAME_WIDTH - item.width)); // 画面内に強制
        }
        if (item.y < 0 || item.y + item.height > GAME_HEIGHT) {
            obj.dy *= -1;
            item.y = Math.max(0, Math.min(item.y, GAME_HEIGHT - item.height)); // 画面内に強制
        }
    }

    // 当たり判定
    // ★修正: 当たり判定時の猫の画像を動的に決定
    const currentCatImageForCollision = roboCatActive ? images.roboCat : (debuffActive ? images.catTape : images.cat);
    const catRect = { x: catX, y: catY, width: currentCatImageForCollision.width, height: currentCatImageForCollision.height };
    const itemsToRemove = [];

    for (let i = 0; i < activeItems.length; i++) {
        const item = activeItems[i];
    // ルンバアイテムの場合にのみ、衝突判定前の猫とルンバの座標・サイズをログに出す
    if (item.name === 'robo') {
        const currentCatImageForCollision = roboCatActive ? images.roboCat : (debuffActive ? images.catTape : images.cat);
        const catRect = { x: catX, y: catY, width: currentCatImageForCollision.width, height: currentCatImageForCollision.height };
        console.log("ルンバの位置:", item.getRect());
        console.log("猫の位置とサイズ:", catRect);
        console.log("衝突判定結果 (ルンバ):", checkCollision(catRect, item.getRect()));
    }



        if (checkCollision(catRect, item.getRect())) {
            itemsToRemove.push(i); // 削除対象としてインデックスを記録

            // スコア・サウンドの処理
            if (item.type === 'score' || item.type === 'penalty') {
                currentScore += item.points;
                playSound(item.sound);
            }

            // ★追加: ルンバとテープの特殊処理の前にログを追加
        console.log("アイテムに接触しました。アイテム名:", item.name, "タイプ:", item.type, "エフェクト:", item.effect, "デバフ:", item.debuff);


            // ★修正: ルンバとテープの特殊処理
            if (item.debuff) { // tapeアイテムの場合
                // ルンバ状態を即時解除し、テープデバフを適用
                roboCatActive = false; // ルンバ状態解除
                debuffActive = true; // テープデバフ適用
                debuffStartTime = currentTime;
                // catSpeedはデバフ状態によってupdateGame内で自動調整される
                playSound(item.sound); // デバフサウンド
            } else if (item.type === 'effect' && item.effect === 'roboCat') { // roboアイテムの場合

                // ★追加: ここに到達したことを示すログ
            console.log("ルンバアイテムの条件分岐に到達しました。");

                if (!roboCatActive) {
                    console.log("ルンバに接触！roboCatActiveをtrueに設定。"); // ルンバ接触時のログ
                    roboCatActive = true;
                    roboCatStartTime = currentTime;
                    playSound('cat_get');
                } else {
                    console.log("ルンバに接触したが、すでにroboCatActiveです。"); // すでにルンバ状態のログ
                }
            }
        }
    }

    // 取得したアイテムの削除 (逆順に削除してインデックスずれを防ぐ)
    for (let i = itemsToRemove.length - 1; i >= 0; i--) {
        const index = itemsToRemove[i];
        const removedItem = activeItems.splice(index, 1)[0];
        // 動くオブジェクトリストからも削除
        movingObjects = movingObjects.filter(obj => obj.itemRef !== removedItem);
    }

    // ゴール判定
    const goalX = GAME_WIDTH - images.goal.width - 50;
    const goalY = GAME_HEIGHT - images.goal.height - 50 + 30; // 30ピクセル下にずらす

    const goalRect = { x: goalX, y: goalY, width: images.goal.width, height: images.goal.height };

    if (checkCollision(catRect, goalRect)) {
        playSound('cat_goal');
        saveHighscore(currentScore);
        highscores = loadHighscores(); // ランキングを更新
        hideAllScreens();
        gameClearScreen.classList.add('active');
        finalScoreText.textContent = `あなたのネコ度: ${currentScore}`;
        currentGameState = GAME_STATE.CLEARED;
        return; // ゲームクリア後の処理に進むため、これ以降の処理をスキップ
    }

    // タイムオーバー判定
    const elapsedTime = currentTime - gameStartTime;
    if (elapsedTime >= GAME_DURATION) {
        playSound('cat_timeout');
        currentScore = 0; // タイムオーバーの場合はポイント無効
        hideAllScreens();
        gameOverScreen.classList.add('active');
        currentGameState = GAME_STATE.GAMEOVER;
    }

    // 現在のスコアをHTMLに表示
    currentScoreValue.textContent = currentScore; // 追加
}

function drawGame() {
    // Canvasをクリア (背景はCSSで設定済みのため、描画不要)
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ゴール地点の描画
    const goalX = GAME_WIDTH - images.goal.width - 50;
    const goalY = GAME_HEIGHT - images.goal.height - 50 + 45; // 30ピクセル下にずらす
    ctx.drawImage(images.goal, goalX, goalY); // 事前縮小された画像の元のサイズで描画

    // アイテムの描画
    activeItems.forEach(item => item.draw());

    // ★修正: 猫の描画 (デバフ中、ルンバ乗車中で画像切り替え)
    let currentCatImageToDraw;
    if (roboCatActive) {
        currentCatImageToDraw = images.roboCat;
    } else if (debuffActive) {
        currentCatImageToDraw = images.catTape;
    } else {
        currentCatImageToDraw = images.cat;
    }
    console.log("描画する猫の画像:", currentCatImageToDraw?.src); // どの画像が描画されようとしているか確認
    ctx.drawImage(currentCatImageToDraw, catX, catY);

    // スコア表示
    // ctx.fillStyle = 'black';
    // ctx.font = '36px Arial'; // フォントは任意で調整
    // ctx.textAlign = 'right';
    // ctx.fillText(`スコア: ${currentScore}`, GAME_WIDTH - 20, 45);

    // 残り時間プログレスバー
    const elapsedTime = performance.now() - gameStartTime;
    const remainingTime = Math.max(0, GAME_DURATION - elapsedTime);
    const progressWidth = (remainingTime / GAME_DURATION) * GAME_WIDTH;

    ctx.fillStyle = 'gray'; // プログレスバーの背景
    ctx.fillRect(0, 0, GAME_WIDTH, 15);
    ctx.fillStyle = 'green'; // プログレスバー本体
    ctx.fillRect(0, 0, progressWidth, 15);

    // ハイスコアとミュートボタンはHTML/CSSで制御されるため、Canvasには描画しない
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// =====================================
// ハイスコアの読み書き
// =====================================
function loadHighscores() {
    const storedScores = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
    if (storedScores) {
        try {
            const parsedScores = JSON.parse(storedScores);
            parsedScores.sort((a, b) => b.score - a.score);
            return parsedScores;
        } catch (e) {
            console.error("ハイスコアのパースエラー:", e);
            return [];
        }
    }
    return [];
}

function saveHighscore(score) {
    highscores = loadHighscores(); // 最新のハイスコアを再度読み込む
    const now = new Date();
    const dateString = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
    
    highscores.push({ score: score, date: dateString });
    highscores.sort((a, b) => b.score - a.score); // スコアで降順ソート
    highscores = highscores.slice(0, 5); // 上位5件のみ保持

    localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(highscores));
    updateHighscoreDisplay();
}

function updateHighscoreDisplay() {
    scoreList.innerHTML = ''; // リストをクリア
    highscores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${entry.score} (${entry.date})`;
        scoreList.appendChild(li);
    });
}

// =====================================
// UI操作とイベントリスナー
// =====================================

function hideAllScreens() {
    startScreen.classList.remove('active');
    countdownScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    gameClearScreen.classList.remove('active');
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', resetGame);
clearRestartButton.addEventListener('click', resetGame);

canvas.addEventListener('mousemove', (e) => {
    // canvas内のマウス座標を正確に取得
    const rect = canvas.getBoundingClientRect(); // Canvasの実際の表示サイズと位置を取得

    // 表示サイズに対するマウス座標の比率を計算し、それをCanvasの論理サイズに適用する
    // これにより、CSSでCanvasの表示サイズが変わっても、内部的な座標計算が正しく行われる
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('click', () => {
    if (currentGameState === GAME_STATE.PLAYING) {
        catMoving = !catMoving;
    }
});

function playSound(name) {
    if (bgmPlaying && SOUNDS[name]) {
        // 効果音は再生するたびに新しいAudioオブジェクトを生成して、音が重なっても大丈夫なようにする
        const sound = new Audio(SOUNDS[name].src);
        sound.volume = 1.0; // 個別の音量設定
        sound.play().catch(e => console.warn(`サウンド ${name} の再生失敗: `, e));
    }
}

muteButton.addEventListener('click', () => {
    bgmPlaying = !bgmPlaying;
    muteButton.textContent = bgmPlaying ? 'BGM: ON' : 'BGM: OFF';

    if (BGM) {
        if (bgmPlaying) {
            BGM.play().catch(e => console.warn("BGM再生失敗: ", e));
        } else {
            BGM.pause();
        }
    }
});


// =====================================
// ゲームループ
// =====================================
let lastFrameTime = 0;
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime; // 経過時間 (ミリ秒)
    lastFrameTime = currentTime;

    // ゲーム状態に応じた更新と描画
    switch (currentGameState) {
        case GAME_STATE.TITLE:
            // タイトル画面の描画はCSSとHTMLで制御
            break;
        case GAME_STATE.COUNTDOWN:
            // カウントダウン画面の描画はCSSとHTMLで制御
            break;
        case GAME_STATE.PLAYING:
            updateGame(deltaTime);
            drawGame();
            break;
        case GAME_STATE.GAMEOVER:
            // ゲームオーバー画面の描画はCSSとHTMLで制御
            break;
        case GAME_STATE.CLEARED:
            // ゲームクリア画面の描画はCSSとHTMLで制御
            break;
    }

    requestAnimationFrame(gameLoop); // 次のフレームを要求
}

// =====================================
// 初期化
// =====================================
window.onload = async () => {
    console.log("アセットロード開始...");
    await loadAssets(); // 全アセットのロードを待つ
    console.log("アセットロード完了。");

    // HTMLのmom-img要素のsrcを設定 (Canvasに描画しないため、HTML側で参照させる)
    if (images.mom && momImgElement) {
        momImgElement.src = images.mom.src;
    }
    // ★追加: manzokuCat-img要素のsrcを設定
    if (images.manzokuCat && manzokuCatImgElement) {
        manzokuCatImgElement.src = images.manzokuCat.src;
    }

    // 初期化処理 (猫の初期位置はアセットロード後に決定)
    catX = 50;
    catY = GAME_HEIGHT - images.cat.height - 50; // 最下段、最左端

    highscores = loadHighscores();
    updateHighscoreDisplay();

    // 初期状態のUI表示
    hideAllScreens();
    startScreen.classList.add('active');

    // ゲームループ開始
    requestAnimationFrame(gameLoop);
};
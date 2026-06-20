let questions = [];

// 默认题库（如果 JSON 加载失败则使用）
const defaultQuestions = [
  {
    "id": 1,
    "image": "images/01_diamond.png",
    "gemName": "钻石",
    "baseChipHint": 10,
    "terms": [
      { "text": "钻石", "multiplier": 2.0, "desc": "碳元素立方晶系矿物，莫氏硬度10" },
      { "text": "金刚石", "multiplier": 1.8, "desc": "钻石的矿物学名称" },
      { "text": "D色无瑕钻石", "multiplier": 2.5, "desc": "顶级颜色和净度的钻石" },
      { "text": "合成钻石", "multiplier": -0.5, "desc": "CVD/HPHT法实验室合成" },
      { "text": "莫桑石", "multiplier": -1.0, "desc": "碳化硅，常被误认为钻石" },
      { "text": "苏联钻", "multiplier": 0, "desc": "商业噱头，实为立方氧化锆" }
    ]
  },
  {
    "id": 2,
    "image": "images/02_CarmenLucia.jpg",
    "gemName": "红宝石",
    "baseChipHint": 10,
    "terms": [
      { "text": "红宝石", "multiplier": 2.0, "desc": "红色刚玉，铬元素致色，莫氏硬度9" },
      { "text": "刚玉（红）", "multiplier": 1.5, "desc": "矿物学名称" },
      { "text": "缅甸鸽血红", "multiplier": 2.5, "desc": "缅甸顶级红宝石" },
      { "text": "星光红宝石", "multiplier": 1.8, "desc": "具六射星光效应的红宝石" },
      { "text": "红尖晶石", "multiplier": -1.0, "desc": "常与红宝石混淆的矿物" },
      { "text": "合成红宝石", "multiplier": -0.5, "desc": "焰熔法实验室合成" }
    ]
  },
  {
    "id": 3,
    "image": "images/03_BlueBelleOfAsia.png",
    "gemName": "蓝宝石",
    "baseChipHint": 10,
    "terms": [
      { "text": "蓝宝石", "multiplier": 2.0, "desc": "刚玉家族除红色外的品种，硬度9" },
      { "text": "矢车菊蓝宝石", "multiplier": 2.5, "desc": "顶级克什米尔蓝宝石" },
      { "text": "帕帕拉恰", "multiplier": 2.2, "desc": "粉橙色蓝宝石，极为稀有" },
      { "text": "蓝尖晶石", "multiplier": -1.0, "desc": "常被误认为蓝宝石" },
      { "text": "蓝黄玉", "multiplier": -1.0, "desc": "托帕石蓝色变种" },
      { "text": "希望蓝钻", "multiplier": 0, "desc": "著名蓝色钻石，非蓝宝石" }
    ]
  },
  {
    "id": 4,
    "image": "images/04_emerald.png",
    "gemName": "祖母绿",
    "baseChipHint": 10,
    "terms": [
      { "text": "祖母绿", "multiplier": 2.0, "desc": "绿色绿柱石，铬/钒致色" },
      { "text": "哥伦比亚祖母绿", "multiplier": 2.5, "desc": "哥伦比亚产顶级祖母绿" },
      { "text": "达碧兹祖母绿", "multiplier": 2.0, "desc": "六射轮辐状图案祖母绿" },
      { "text": "注油祖母绿", "multiplier": -0.3, "desc": "注油处理改善净度" },
      { "text": "绿碧玺", "multiplier": -0.8, "desc": "电气石族绿色变种" },
      { "text": "合成祖母绿", "multiplier": -0.5, "desc": "水热法实验室合成" }
    ]
  }
];

let totalChips = 1000;
let baseChip = 100;
let currentRound = 1;
let selectedTerms = [];
let currentQuestionIndex = 0;
let allInUsed = false;
let isAnimating = false; // 点击飞入/飞出动画进行中，防止连点
let reorderTarget = null;  // 倍率区拖拽排序中的卡片 DOM
let reorderStartY = 0;     // 拖拽起始 Y 坐标

// ═══════════════════════════════════════════════════════════
// 音效系统（基于 ZzFX，CDN 异步加载；未就绪时静默降级）
// ═══════════════════════════════════════════════════════════

/** 确保移动端 AudioContext 已解锁（zzfx 已内联，同步可用） */
function _sfxReady() {
    window.__ensureAudio && window.__ensureAudio();
    return true;
}

/** 筹码强度系数：baseChip 越大越夸张 (0.4 ~ 1.2) */
function chipIntensity() {
    return 0.4 + Math.min(baseChip / 100, 0.8);
}

// ── 金币音色基准：三角波 + 中低频 + 负滑音 + 极短包络 = 金属碰撞感 ──

function sfx_coinDouble() {
    if (!_sfxReady()) return;
    const vol = chipIntensity();
    // 主硬币：三角波 620Hz，快速沉降（-70Hz 滑音），音量 0.55~0.95
    zzfx(...[0.5 * vol + 0.18, 0.04, 620 + baseChip * 8, .005, .01, .08, 3, 1, -70, , , , , .04]);
    // 第二枚硬币泛音（偏移 30ms）：更低沉 440Hz，模拟两枚硬币碰撞的不同音高
    if (baseChip >= 20) {
        setTimeout(() => zzfx(...[0.35 * vol + 0.12, 0.04, 440 + baseChip * 5, .005, .01, .07, 3, 1, -55, , , , , .03]), 30);
    }
}

function sfx_coinHalf() {
    if (!_sfxReady()) return;
    // 筹码回收：一枚硬币快速滑落，三角波 520Hz → 430Hz
    zzfx(...[0.45, 0.03, 520, .005, .01, .08, 3, 1, -90, , , , , .03]);
}

function sfx_allIn() {
    if (!_sfxReady()) return;
    const vol = chipIntensity();
    const coins = 3 + Math.min(Math.floor(baseChip / 20), 14);
    // 金币倾泻：每枚硬币随机音高 350~750Hz，三角波，快速负滑音
    for (let i = 0; i < coins; i++) {
        setTimeout(() => {
            const f = 380 + Math.random() * 370;
            zzfx(...[0.32 * vol + 0.25, 0.06, f, .005, .01, .06 + Math.random() * .06, 3, 1, -40 - Math.random() * 50, , , , , .04]);
        }, i * 38);
    }
    // 重低音砸桌（筹码总重量）
    setTimeout(() => {
        zzfx(...[0.5 * vol + 0.25, 0, 45, .01, .06, .55, 2, 1, -50, , , , .25, ]);
    }, coins * 38 + 20);
}

function sfx_select() {
    if (!_sfxReady()) return;
    // UI 点击：三角波 900Hz，极短促，清脆不刺耳
    zzfx(...[0.5, 0, 900, .003, .01, .03, 3, 1, , , , , , ]);
}

function sfx_remove() {
    if (!_sfxReady()) return;
    // UI 移除：三角波 650Hz → 450Hz 快速滑落
    zzfx(...[0.42, 0, 650, .003, .01, .04, 3, 1, -200, , , , , ]);
}

function sfx_revealCorrect() {
    if (!_sfxReady()) return;
    // 正确"叮"：三角波 520Hz → 720Hz 徐徐上扬，明亮悦耳
    zzfx(...[0.5, 0, 520, .02, .04, .18, 3, 1, 200, , , , , ]);
}

function sfx_revealBust() {
    if (!_sfxReady()) return;
    // 错误蜂鸣：方波 + 超低频 + 颤音，刺耳警告
    zzfx(...[0.55, 0, 85, .04, .06, .5, 1, 2, -60, , -300, .1, , .15, , , , , .45]);
}

function sfx_revealNegative() {
    if (!_sfxReady()) return;
    // 负倍率警告：方波降调，短促有力
    zzfx(...[0.5, 0, 180, .03, .05, .3, 1, 2, -50, , -180, .08, , .1]);
}

// 彩蛋词条概率 — 仅第28题有概率刷出
const EASTER_EGG_CHANCE = 0.08;

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const finalScreen = document.getElementById('final-screen');
const resultContent = document.getElementById('result-content');
const toast = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
});

async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        questions = await response.json();
        shuffleQuestions();
        console.log('题库加载成功，共', questions.length, '道题');
        
    } catch (error) {
        console.error('加载题库失败，使用默认题库:', error);
        questions = defaultQuestions;
        showToast('使用默认题库');
    } finally {
        loadLeaderboard();
        bindEvents();
    }
}

function loadLeaderboard() {
    const raw = JSON.parse(localStorage.getItem('gemLeaderboard') || '[]');

    // 存量数据清理：相同得分只保留最近日期，超过 100 条切除最低分
    const seen = new Map();
    for (const item of raw) {
        const existing = seen.get(item.score);
        if (!existing || item.date > existing.date) {
            seen.set(item.score, item);
        }
    }
    const leaderboard = [...seen.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);

    // 回写清理后的数据
    if (leaderboard.length !== raw.length) {
        localStorage.setItem('gemLeaderboard', JSON.stringify(leaderboard));
    }

    const tbody = document.getElementById('leaderboard-body');

    if (leaderboard.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-data">暂无记录</td></tr>';
        return;
    }

    tbody.innerHTML = leaderboard.map((item, index) => `
        <tr>
            <td class="${index < 3 ? 'rank-gold' : ''}">${index + 1}</td>
            <td>${item.score}</td>
            <td>${item.date}</td>
        </tr>
    `).join('');
}

function bindEvents() {
    document.getElementById('start-btn').addEventListener('click', startGame);

    const multiplierArea = document.getElementById('multiplier-area');
    multiplierArea.addEventListener('dragover', dragOver);
    multiplierArea.addEventListener('drop', drop);
    // 倍率区内触摸拖拽排序
    multiplierArea.addEventListener('touchstart', reorderTouchStart, { passive: false });
    multiplierArea.addEventListener('touchmove', reorderTouchMove, { passive: false });
    multiplierArea.addEventListener('touchend', reorderTouchEnd);

    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', dragOverDropZone);
    dropZone.addEventListener('drop', dropToDropZone);
    dropZone.addEventListener('dragenter', dragEnterDropZone);
    dropZone.addEventListener('dragleave', dragLeaveDropZone);

    // 词条池整体也接受放置（从倍率区拖回）
    const termsPool = document.querySelector('.terms-pool');
    termsPool.addEventListener('dragover', dragOverTermsPool);
    termsPool.addEventListener('dragleave', dragLeaveTermsPool);
    termsPool.addEventListener('drop', dropToTermsPool);

    // 阻止浏览器默认拖拽行为（如打开搜索）
    document.addEventListener('dragover', preventDefaultDrag);
    document.addEventListener('drop', preventDefaultDrag);

    // 点击词条添加/移除（事件委托在持久容器上，不受 DOM 重建影响）
    document.getElementById('terms-grid').addEventListener('click', handlePoolClick);
    document.getElementById('multiplier-area').addEventListener('click', handleMultiplierClick);
}

function startGame() {
    totalChips = 10;
    baseChip = 10;
    currentRound = 1;
    currentQuestionIndex = 0;
    selectedTerms = [];
    allInUsed = false;

    shuffleQuestions();

    startScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    loadQuestion();
}

function shuffleQuestions() {
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
}

function loadQuestion() {
    const question = questions[currentQuestionIndex % questions.length];

    // 彩蛋概率过滤：仅第28题，小概率才保留彩蛋词条
    const isQuestion28 = question.id === 28;
    const easterEggRoll = Math.random() < EASTER_EGG_CHANCE;
    if (isQuestion28 && !easterEggRoll) {
        question.terms = question.terms.filter(t => !t.easterEgg);
    }

    // 给每个 term 打上唯一索引，标记彩蛋
    question.terms.forEach((term, i) => {
        term._idx = i;
        term._isEasterEgg = !!term.easterEgg;
    });

    document.getElementById('chips-value').textContent = totalChips;
    document.getElementById('round-display').textContent = `第 ${currentRound}/10 题`;
    document.getElementById('current-chip-text').textContent = `当前筹码: ${baseChip}`;

    const gemImage = document.getElementById('gem-image');
    const gemEmoji = document.getElementById('gem-emoji');

    if (question.image) {
        gemImage.src = question.image;
        gemImage.style.display = 'block';
        gemEmoji.style.display = 'none';
    } else {
        gemEmoji.textContent = getGemEmoji(question.gemName);
        gemImage.style.display = 'none';
        gemEmoji.style.display = 'block';
    }

    const multiplierSlots = document.getElementById('multiplier-slots');
    multiplierSlots.innerHTML = '<div class="multiplier-slot">点击添加词条，拖拽为词条排序</div>';
    selectedTerms = [];

    // 随机打乱词条顺序
    const shuffledTerms = question.terms.map((term, index) => ({ term, originalIndex: index }));
    for (let i = shuffledTerms.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTerms[i], shuffledTerms[j]] = [shuffledTerms[j], shuffledTerms[i]];
    }

    const termsGrid = document.getElementById('terms-grid');
    termsGrid.innerHTML = shuffledTerms.map(({ term, originalIndex }) => `
        <div class="term-card" draggable="true" data-index="${originalIndex}">
            ${term.text}
        </div>
    `).join('');

    // 绑定拖拽事件
    termsGrid.querySelectorAll('.term-card').forEach(card => {
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
    });

    allInUsed = false;
}

function getGemEmoji(gemName) {
    const emojiMap = {
        '红宝石': '◆',
        '蓝宝石': '◆',
        '祖母绿': '◆',
        '钻石': '◆',
        '珍珠': '◆',
        '翡翠': '◆',
        '紫水晶': '◆',
        '黄玉': '◆',
        '碧玺': '◆',
        '石榴石': '◆'
    };
    return emojiMap[gemName] || '◆';
}

function preventDefaultDrag(event) {
    event.preventDefault();
}

function dragEnterDropZone(event) {
    event.preventDefault();
    event.target.classList.add('drag-over');
}

function dragLeaveDropZone(event) {
    event.target.classList.remove('drag-over');
}

function dragOverTermsPool(event) {
    event.preventDefault();
    // 始终允许放置，具体校验在 dropToTermsPool 中处理
    const termsPoolEl = event.target.closest('.terms-pool');
    if (termsPoolEl) {
        termsPoolEl.classList.add('drag-over');
    }
}

function dragLeaveTermsPool(event) {
    const termsPoolEl = event.target.closest('.terms-pool');
    if (termsPoolEl && !termsPoolEl.contains(event.relatedTarget)) {
        termsPoolEl.classList.remove('drag-over');
    }
}

function dropToTermsPool(event) {
    event.preventDefault();
    const termsPoolEl = event.target.closest('.terms-pool');
    termsPoolEl?.classList.remove('drag-over');

    const fromMultiplier = event.dataTransfer.getData('fromMultiplier') === 'true';
    const sourceSlotIndex = parseInt(event.dataTransfer.getData('slotIndex'));

    if (fromMultiplier && !isNaN(sourceSlotIndex)) {
        removeTermFromMultiplier(sourceSlotIndex);
    }
}

function removeTermFromMultiplier(slotIndex) {
    const removedTerm = selectedTerms.splice(slotIndex, 1)[0];
    if (!removedTerm) return;

    renderMultiplierSlots();
    sfx_remove();

    // 用唯一索引 _idx 精确定位词条池卡片，防止同名 text 导致匹配错误
    const originalIndex = removedTerm._idx;
    if (originalIndex !== undefined) {
        const cardToShow = document.querySelector(`#terms-grid .term-card[data-index="${originalIndex}"]`);
        if (cardToShow) cardToShow.style.display = 'flex';
    }
    showToast('已移除词条');
}

/**
 * 将词条池中的卡片添加到倍率区（桌面拖拽和点击共用）
 * @param {number} termIndex - question.terms 数组索引
 * @returns {boolean} 是否成功添加
 */
function addTermToMultiplier(termIndex) {
    if (selectedTerms.length >= 8) {
        showToast('最多选择8个词条');
        return false;
    }

    const question = questions[currentQuestionIndex % questions.length];
    const term = question.terms[termIndex];

    if (!term) return false;

    if (selectedTerms.some(t => t._idx === term._idx)) {
        showToast('该词条已选择');
        return false;
    }

    selectedTerms.push(term);
    renderMultiplierSlots();
    sfx_select();

    const cardToHide = document.querySelector(
        `#terms-grid .term-card[data-index="${termIndex}"]`
    );
    if (cardToHide) cardToHide.style.display = 'none';

    return true;
}

function dragStart(event) {
    const target = event.target;
    target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', target.getAttribute('data-index'));

    const isFromMultiplier = target.classList.contains('in-multiplier');
    event.dataTransfer.setData('fromMultiplier', isFromMultiplier);

    if (isFromMultiplier) {
        event.dataTransfer.setData('slotIndex', target.getAttribute('data-slot-index'));
    }
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
    // 清理所有拖拽高亮
    document.querySelectorAll('#multiplier-slots .drag-over').forEach(el => el.classList.remove('drag-over'));
}

function dragOver(event) {
    event.preventDefault();
    event.stopPropagation();

    // 先清除上一次的高亮
    document.querySelectorAll('#multiplier-slots .term-card.in-multiplier.drag-over, #multiplier-slots .multiplier-slot.drag-over')
        .forEach(el => el.classList.remove('drag-over'));

    // 高亮当前目标：优先卡片，其次空 slot
    const targetCard = event.target.closest('.term-card.in-multiplier');
    const slot = event.target.closest('.multiplier-slot');
    if (targetCard) {
        targetCard.classList.add('drag-over');
    } else if (slot) {
        slot.classList.add('drag-over');
    }
}

function dragOverDropZone(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.target.closest('.drop-zone');
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function drop(event) {
    event.preventDefault();
    event.stopPropagation();

    // 清理所有高亮
    document.querySelectorAll('#multiplier-slots .drag-over').forEach(el => el.classList.remove('drag-over'));

    const index = parseInt(event.dataTransfer.getData('text/plain'));
    const fromMultiplier = event.dataTransfer.getData('fromMultiplier') === 'true';
    const sourceSlotIndex = parseInt(event.dataTransfer.getData('slotIndex'));

    const question = questions[currentQuestionIndex % questions.length];

    if (fromMultiplier) {
        // 倍率区内重排序
        const targetCard = event.target.closest('.term-card.in-multiplier');
        const targetSlot = event.target.closest('.multiplier-slot');

        let targetIndex = selectedTerms.length; // 默认插入末尾
        if (targetCard) {
            targetIndex = parseInt(targetCard.getAttribute('data-slot-index'));
        } else if (targetSlot) {
            const idx = targetSlot.getAttribute('data-slot-index');
            targetIndex = idx !== null ? parseInt(idx) : selectedTerms.length;
        }

        console.log('[drop] reorder', { sourceSlotIndex, targetIndex, targetCard: !!targetCard, targetSlot: !!targetSlot });

        if (!isNaN(targetIndex) && sourceSlotIndex !== targetIndex && !isNaN(sourceSlotIndex)) {
            const movedTerm = selectedTerms.splice(sourceSlotIndex, 1)[0];
            if (movedTerm) {
                const adjustedTarget = targetIndex > sourceSlotIndex ? targetIndex - 1 : targetIndex;
                selectedTerms.splice(adjustedTarget, 0, movedTerm);
                renderMultiplierSlots();
                console.log('[drop] reorder done', { from: sourceSlotIndex, to: adjustedTarget });
            }
        }
        // 注：从倍率区拖回词条池由 dropToTermsPool / dropToDropZone 处理
    } else {
        addTermToMultiplier(index);
    }
}

function dropToDropZone(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.target.closest('.drop-zone');
    if (dropZone) {
        dropZone.classList.remove('drag-over');
    }

    const sourceSlotIndex = parseInt(event.dataTransfer.getData('slotIndex'));
    const fromMultiplier = event.dataTransfer.getData('fromMultiplier') === 'true';

    if (fromMultiplier && !isNaN(sourceSlotIndex)) {
        removeTermFromMultiplier(sourceSlotIndex);
    }
}

function renderMultiplierSlots() {
    const multiplierSlots = document.getElementById('multiplier-slots');
    
    if (selectedTerms.length === 0) {
        multiplierSlots.innerHTML = '<div class="multiplier-slot">点击添加词条，拖拽为词条排序</div>';
        return;
    }

    let html = selectedTerms.map((term, index) => `
        <div class="term-card in-multiplier" draggable="true" data-slot-index="${index}">
            ${term.text}
            <span class="card-mystery">?</span>
        </div>
    `).join('');
    
    if (selectedTerms.length < 8) {
        html += '<div class="multiplier-slot">+ 添加更多</div>';
    }
    
    multiplierSlots.innerHTML = html;
    
    // 绑定倍率区词条的拖拽事件
    multiplierSlots.querySelectorAll('.term-card.in-multiplier').forEach(card => {
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
    });
}

// ═══════════════════════════════════════════════════════════
// 点击添加/移除词条 + 飞行动画
// ═══════════════════════════════════════════════════════════

/**
 * 词条池卡片 → 倍率区 飞行动画
 * 创建 clone，从词条池位置飞到倍率区位置
 */
function flyCardToMultiplier(sourceCard, onComplete) {
    if (isAnimating) return;
    isAnimating = true;

    const sourceRect = sourceCard.getBoundingClientRect();
    const multiplierSlots = document.getElementById('multiplier-slots');
    const targetEl =
        multiplierSlots.querySelector('.multiplier-slot:last-child') ||
        multiplierSlots;
    const targetRect = targetEl.getBoundingClientRect();

    const clone = sourceCard.cloneNode(true);
    clone.classList.add('card-fly-clone');
    clone.removeAttribute('draggable');

    Object.assign(clone.style, {
        position: 'fixed',
        left: sourceRect.left + 'px',
        top: sourceRect.top + 'px',
        width: sourceRect.width + 'px',
        height: sourceRect.height + 'px',
        margin: '0',
        zIndex: '500',
        pointerEvents: 'none',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    });
    document.body.appendChild(clone);

    // 强制回流，让浏览器注册起始位置
    clone.offsetHeight;

    clone.style.left = targetRect.left + 'px';
    clone.style.top = targetRect.top + 'px';
    clone.style.width = targetRect.width + 'px';
    clone.style.height = targetRect.height + 'px';
    clone.style.opacity = '0.7';
    clone.style.transform = 'scale(0.85)';

    clone.addEventListener('transitionend', () => {
        clone.remove();
        isAnimating = false;
        if (onComplete) onComplete();
    }, { once: true });

    // 兜底：500ms 后强制清理（transitionend 可能不触发）
    setTimeout(() => {
        if (clone.parentNode) {
            clone.remove();
            isAnimating = false;
            if (onComplete) onComplete();
        }
    }, 500);
}

/**
 * 倍率区卡片 → 词条池 飞行动画
 * 创建 clone，从倍率区飞回词条池区域（淡出缩小）
 */
function flyCardToPool(sourceCard, onComplete) {
    if (isAnimating) return;
    isAnimating = true;

    const sourceRect = sourceCard.getBoundingClientRect();
    const termsPool = document.querySelector('.terms-pool');
    const poolRect = termsPool.getBoundingClientRect();

    const clone = sourceCard.cloneNode(true);
    clone.classList.add('card-fly-clone');

    Object.assign(clone.style, {
        position: 'fixed',
        left: sourceRect.left + 'px',
        top: sourceRect.top + 'px',
        width: sourceRect.width + 'px',
        height: sourceRect.height + 'px',
        margin: '0',
        zIndex: '500',
        pointerEvents: 'none',
        transition: 'all 0.3s cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    });
    document.body.appendChild(clone);

    clone.offsetHeight;

    clone.style.left =
        poolRect.left + poolRect.width / 2 - sourceRect.width / 2 + 'px';
    clone.style.top =
        poolRect.top + poolRect.height / 2 - sourceRect.height / 2 + 'px';
    clone.style.opacity = '0';
    clone.style.transform = 'scale(0.8)';

    clone.addEventListener('transitionend', () => {
        clone.remove();
        isAnimating = false;
        if (onComplete) onComplete();
    }, { once: true });

    setTimeout(() => {
        if (clone.parentNode) {
            clone.remove();
            isAnimating = false;
            if (onComplete) onComplete();
        }
    }, 500);
}

/**
 * 事件委托：点击词条池卡片 → 飞入倍率区
 */
function handlePoolClick(event) {
    const card = event.target.closest('.term-card');
    if (!card) return;
    // 排除已在倍率区的卡片
    if (card.classList.contains('in-multiplier')) return;
    // 动画进行中或卡片已隐藏（已放入倍率区）
    if (isAnimating || card.style.display === 'none') return;

    const index = parseInt(card.getAttribute('data-index'));
    if (isNaN(index)) return;

    flyCardToMultiplier(card, () => {
        addTermToMultiplier(index);
    });
}

/**
 * 事件委托：点击倍率区卡片 → 飞回词条池
 */
function handleMultiplierClick(event) {
    const card = event.target.closest('.term-card.in-multiplier');
    if (!card) return;

    const slotIndex = parseInt(card.getAttribute('data-slot-index'));
    if (isNaN(slotIndex) || isAnimating) return;

    flyCardToPool(card, () => {
        removeTermFromMultiplier(slotIndex);
    });
}

// ═══════════════════════════════════════════════════════════
// 倍率区内触摸拖拽排序
// ═══════════════════════════════════════════════════════════

const REORDER_THRESHOLD = 8; // px

function reorderTouchStart(event) {
    const card = event.target.closest('.term-card.in-multiplier');
    if (!card || isAnimating) return;
    reorderTarget = card;
    reorderStartY = event.touches[0].clientY;
    // 不调 preventDefault() — 先等 touchmove 确认是拖拽还是点击
}

function reorderTouchMove(event) {
    if (!reorderTarget) return;

    const touch = event.touches[0];
    const deltaY = touch.clientY - reorderStartY;

    // 超过阈值：锁定滚动，进入拖拽态
    if (Math.abs(deltaY) > REORDER_THRESHOLD && !reorderTarget.classList.contains('reordering')) {
        reorderTarget.classList.add('reordering');
    }

    if (reorderTarget.classList.contains('reordering')) {
        event.preventDefault();
        reorderTarget.style.transform = `translateY(${deltaY}px)`;
        reorderTarget.style.zIndex = '100';
        updateInsertIndicator();
    }
}

const CARD_UNIT = 52; // px，单张卡片高度 + 间距，用于计算移位

/**
 * 在 touchMove 中动态显示插入位置：
 * 非拖拽卡片通过 transform 上下移位，腾出空位，容器大小保持不变
 */
function updateInsertIndicator() {
    const oldIndex = parseInt(reorderTarget.getAttribute('data-slot-index'));
    const allCards = [
        ...document.querySelectorAll('#multiplier-slots .term-card.in-multiplier')
    ];

    const draggedCard = allCards.find(
        c => parseInt(c.getAttribute('data-slot-index')) === oldIndex
    );
    if (!draggedCard) return;

    const draggedRect = draggedCard.getBoundingClientRect();
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    // 计算插入位置（以 slot-index 为准）
    let insertPos = allCards.length; // 默认末尾
    for (const card of allCards) {
        const idx = parseInt(card.getAttribute('data-slot-index'));
        if (idx === oldIndex) continue;
        const rect = card.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        if (draggedCenterY < centerY) {
            insertPos = idx;
            break;
        }
    }

    // 对其他卡片施加 transform 移位，腾出空位
    allCards.forEach(card => {
        if (card === draggedCard) return; // 拖拽卡片由 reorderTouchMove 控制
        const idx = parseInt(card.getAttribute('data-slot-index'));
        let shift = 0;

        if (insertPos > oldIndex) {
            // 向下拖：oldIndex+1 ~ insertPos-1 的卡片上移一格
            if (idx > oldIndex && idx < insertPos) {
                shift = -CARD_UNIT;
            }
        } else if (insertPos < oldIndex) {
            // 向上拖：insertPos ~ oldIndex-1 的卡片下移一格
            if (idx >= insertPos && idx < oldIndex) {
                shift = CARD_UNIT;
            }
        }

        card.style.transform = shift !== 0 ? `translateY(${shift}px)` : '';
        card.style.transition = 'transform 0.15s ease';
    });
}

function reorderTouchEnd(event) {
    if (!reorderTarget) return;

    const wasReordering = reorderTarget.classList.contains('reordering');
    const oldIndex = parseInt(reorderTarget.getAttribute('data-slot-index'));

    // ── 在重置 transform 之前计算插入位置（此时卡片还在手指拖拽后的位置）──
    let insertPos = oldIndex;
    if (wasReordering && !isNaN(oldIndex)) {
        const allCards = [
            ...document.querySelectorAll('#multiplier-slots .term-card.in-multiplier')
        ];
        const draggedCard = allCards.find(
            c => parseInt(c.getAttribute('data-slot-index')) === oldIndex
        );
        if (draggedCard) {
            const draggedRect = draggedCard.getBoundingClientRect();
            const draggedCenterY = draggedRect.top + draggedRect.height / 2;

            insertPos = allCards.length; // 默认插入末尾
            for (const card of allCards) {
                const idx = parseInt(card.getAttribute('data-slot-index'));
                if (idx === oldIndex) continue;
                const rect = card.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                if (draggedCenterY < centerY) {
                    insertPos = idx;
                    break;
                }
            }
        }
    }

    // 重置所有卡片样式（拖拽卡片 + 被移位的卡片）
    document.querySelectorAll('#multiplier-slots .term-card.in-multiplier').forEach(c => {
        c.classList.remove('reordering');
        c.style.transform = '';
        c.style.zIndex = '';
        c.style.transition = '';
    });

    reorderTarget = null;

    // 未进入拖拽态 = 轻触，留给 click 处理
    if (!wasReordering || isNaN(oldIndex)) return;

    // 执行重排
    if (insertPos !== oldIndex) {
        const [moved] = selectedTerms.splice(oldIndex, 1);
        const targetIdx = insertPos > oldIndex ? insertPos - 1 : insertPos;
        selectedTerms.splice(targetIdx, 0, moved);
        renderMultiplierSlots();
    }
}

function adjustChip(factor) {
    if (factor > 1) {
        // 乘操作：将累计筹码尽可能多地添加到基础筹码（最多乘 factor 倍）
        const maxIncrease = Math.round(baseChip * (factor - 1));
        const actualIncrease = Math.min(maxIncrease, totalChips);
        if (actualIncrease > 0) {
            totalChips -= actualIncrease;
            baseChip += actualIncrease;
            updateChipDisplay();
            sfx_coinDouble();
        } else {
            showToast('累计筹码不足');
        }
    } else {
        const newChip = Math.round(baseChip * factor);
        const refund = baseChip - newChip;
        if (newChip >= 1) {
            totalChips += refund;
            baseChip = newChip;
            updateChipDisplay();
            sfx_coinHalf();
        } else {
            showToast('基础筹码不能低于1');
        }
    }
}

function allIn() {
    if (allInUsed) {
        showToast('每局只能ALL IN一次');
        return;
    }

    if (totalChips <= 0) {
        showToast('没有可押的筹码');
        return;
    }

    const betAmount = totalChips;
    baseChip += totalChips;
    totalChips = 0;
    allInUsed = true;
    updateChipDisplay();

    // 按钮爆发动画
    const btn = document.querySelector('.btn-allin');
    btn.classList.add('allin-triggered');
    setTimeout(() => btn.classList.remove('allin-triggered'), 500);

    // 全屏金色闪光
    const flash = document.createElement('div');
    flash.className = 'allin-screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // 筹码粒子从按钮位置爆发
    spawnAllinParticles(btn);

    // 屏幕震动
    document.body.classList.add('allin-shake');
    setTimeout(() => document.body.classList.remove('allin-shake'), 350);

    // ALL IN 音效（钱币倾泻）
    sfx_allIn();

    // 霸气 toast
    showToast(`ALL IN! 押上 ${betAmount} 筹码 🔥`);

    if (navigator.vibrate) {
        navigator.vibrate([80, 40, 80, 40, 120]);
    }
}

function spawnAllinParticles(btn) {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const container = document.createElement('div');
    container.className = 'allin-particles';
    container.style.left = cx + 'px';
    container.style.top = cy + 'px';
    document.body.appendChild(container);

    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFD700', '#FFF', '#FFD700'];
    for (let i = 0; i < 18; i++) {
        const particle = document.createElement('div');
        particle.className = 'allin-particle';
        const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.5;
        const distance = 40 + Math.random() * 60;
        particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
        particle.style.background = colors[i % colors.length];
        particle.style.width = (8 + Math.random() * 10) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
        container.appendChild(particle);
    }

    setTimeout(() => container.remove(), 800);
}

function updateChipDisplay() {
    document.getElementById('chips-value').textContent = totalChips;
    document.getElementById('current-chip-text').textContent = `当前筹码: ${baseChip}`;
}

function openCards() {
    if (selectedTerms.length === 0) {
        showToast('至少选择一个词条');
        return;
    }

    // 设置结算界面的题目图片
    const question = questions[currentQuestionIndex % questions.length];
    const resultImage = document.getElementById('result-gem-image');
    if (question.image) {
        resultImage.src = question.image;
        resultImage.style.display = 'block';
    } else {
        resultImage.style.display = 'none';
    }

    // 隐藏宝石名称提示（答错时才显示）
    const gemNameHint = document.getElementById('gem-name-hint');
    gemNameHint.style.display = 'none';

    gameScreen.style.display = 'none';
    resultScreen.style.display = 'flex';
    animateReveal(question.gemName);
}

async function animateReveal(gemName) {
    const multiplierDisplay = document.getElementById('multiplier-display');
    const scoreDisplay = document.getElementById('score-display');
    const revealedTerms = document.getElementById('revealed-terms');
    const gemNameHint = document.getElementById('gem-name-hint');

    revealedTerms.innerHTML = '';
    multiplierDisplay.textContent = '×1.0';
    scoreDisplay.textContent = '+0';

    // ── 防御：校验所有选中词条的 multiplier 合法性 ──
    for (let i = 0; i < selectedTerms.length; i++) {
        const t = selectedTerms[i];
        if (t.multiplier === undefined || t.multiplier === null || !Number.isFinite(t.multiplier)) {
            console.error('[animateReveal] 无效 multiplier，强制置零', { index: i, term: t });
            t.multiplier = 0;
        }
    }
    if (baseChip === undefined || baseChip === null || !Number.isFinite(baseChip) || baseChip < 1) {
        console.error('[animateReveal] 无效 baseChip，重置为 1', { baseChip });
        baseChip = 1;
    }

    let totalMultiplier = 1;
    let hasZero = false;
    let stoppedEarly = false;

    for (let i = 0; i < selectedTerms.length; i++) {
        if (hasZero) break;

        const term = selectedTerms[i];
        const m = Number(term.multiplier);
        totalMultiplier *= m;

        const card = document.createElement('div');
        card.className = 'revealed-term' + (term._isEasterEgg ? ' easter-reveal' : '');
        card.innerHTML = `
            <span class="term-text">${term.text}</span>
            <span class="multiplier-value ${getMultiplierClass(m)}">
                ${term._isEasterEgg ? '🌟' : getMultiplierIcon(m)} ×${m}
            </span>
        `;
        revealedTerms.appendChild(card);

        multiplierDisplay.textContent = `×${totalMultiplier.toFixed(2)}`;
        multiplierDisplay.style.animation = 'none';
        void multiplierDisplay.offsetWidth;
        multiplierDisplay.style.animation = 'pulse 0.25s ease-in-out';

        const runningScore = Math.floor(baseChip * totalMultiplier);
        scoreDisplay.textContent = runningScore >= 0 ? `+${runningScore}` : `${runningScore}`;
        scoreDisplay.style.animation = 'none';
        void scoreDisplay.offsetWidth;
        scoreDisplay.style.animation = 'pulse 0.25s ease-in-out';

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        // 用 Number() 包裹确保严格数值比较（防御字符串/类型异常）
        if (m === 0) {
            hasZero = true;
            stoppedEarly = true;
            sfx_revealBust();
            const bustText = document.createElement('div');
            bustText.className = 'bust-text';
            bustText.textContent = 'BUST!';
            revealedTerms.appendChild(bustText);

            resultContent.classList.add('red-flash');
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            setTimeout(() => {
                resultContent.classList.remove('red-flash');
            }, 300);

            break;
        }

        if (m < 0) {
            stoppedEarly = true;
            sfx_revealNegative();
            const bustText = document.createElement('div');
            bustText.className = 'bust-text';
            bustText.textContent = 'NEGATIVE!';
            revealedTerms.appendChild(bustText);

            resultContent.classList.add('red-flash');
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            setTimeout(() => {
                resultContent.classList.remove('red-flash');
            }, 300);

            break;
        }

        // 正确词条音效
        sfx_revealCorrect();
        await sleep(800);
    }

    // 答错时显示宝石名称
    if (stoppedEarly && gemName) {
        gemNameHint.textContent = `正确答案：${gemName}`;
        gemNameHint.style.display = 'block';
    }

    let finalScore = hasZero ? 0 : Math.floor(baseChip * totalMultiplier);
    // 正倍率保底：防止多个 <1 的正小数倍率组合积过小，被 Math.floor 截断为 0
    if (finalScore === 0 && totalMultiplier > 0 && !hasZero) {
        finalScore = 1;
    }
    totalChips += finalScore;

    scoreDisplay.textContent = finalScore >= 0 ? `+${finalScore}` : `${finalScore}`;
    scoreDisplay.style.animation = 'pulse 0.5s ease-in-out';

    selectedTerms.forEach(term => {
        if (term.desc) {
            const descDiv = document.createElement('div');
            descDiv.className = 'description';
            descDiv.innerHTML = `<strong>${term.text}：</strong>${term.desc}`;
            revealedTerms.appendChild(descDiv);
        }
    });
}

function getMultiplierClass(multiplier) {
    if (multiplier === 0) return 'zero';
    return multiplier > 0 ? 'positive' : 'negative';
}

function getMultiplierIcon(multiplier) {
    if (multiplier === 0) return '💀';
    return multiplier > 0 ? '✅' : '❌';
}

function nextRound() {
    resultScreen.style.display = 'none';
    
    if (totalChips <= 0) {
        showFinalScreen();
        return;
    }
    
    gameScreen.style.display = 'flex';
    
    currentRound++;
    currentQuestionIndex++;
    baseChip = 10;
    
    if (currentRound > 10) {
        showFinalScreen();
    } else {
        loadQuestion();
    }
}

function showFinalScreen() {
    resultScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    
    saveToLeaderboard(totalChips);
    
    document.getElementById('final-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = totalChips;
    
    const reason = totalChips <= 0 ? '筹码归零' : '已完成10题';
    document.getElementById('final-reason').textContent = reason;
    
    const rank = getRank(totalChips);
    document.getElementById('rank-badge').textContent = `本次排名: 第${rank}名`;
}

function saveToLeaderboard(score) {
    const leaderboard = JSON.parse(localStorage.getItem('gemLeaderboard') || '[]');

    // 相同得分只保留最近一次：先移除旧记录
    const existingIdx = leaderboard.findIndex(item => item.score === score);
    if (existingIdx !== -1) {
        leaderboard.splice(existingIdx, 1);
    }

    leaderboard.push({
        score: score,
        date: new Date().toLocaleDateString('zh-CN')
    });
    leaderboard.sort((a, b) => b.score - a.score);

    // 超过 100 条时去除最低分
    localStorage.setItem('gemLeaderboard', JSON.stringify(leaderboard.slice(0, 100)));
}

function getRank(score) {
    const leaderboard = JSON.parse(localStorage.getItem('gemLeaderboard') || '[]');
    let rank = 1;
    for (const item of leaderboard) {
        if (item.score > score) {
            rank++;
        }
    }
    return rank;
}

function restartGame() {
    finalScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    loadLeaderboard();
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
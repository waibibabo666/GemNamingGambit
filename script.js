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
    document.getElementById('rules-btn').addEventListener('click', toggleRules);
    document.getElementById('start-btn').addEventListener('click', startGame);

    const multiplierArea = document.getElementById('multiplier-area');
    multiplierArea.addEventListener('dragover', dragOver);
    multiplierArea.addEventListener('drop', drop);
    multiplierArea.addEventListener('touchmove', touchMove, { passive: false });

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

    // 移动端触摸事件
    document.addEventListener('touchstart', touchStart, { passive: false });
    document.addEventListener('touchmove', touchMove, { passive: false });
    document.addEventListener('touchend', touchEnd);
}

function toggleRules() {
    const panel = document.getElementById('rules-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
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
    multiplierSlots.innerHTML = '<div class="multiplier-slot">拖拽词条到这里</div>';
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

    // 用唯一索引 _idx 精确定位词条池卡片，防止同名 text 导致匹配错误
    const originalIndex = removedTerm._idx;
    if (originalIndex !== undefined) {
        const cardToShow = document.querySelector(`#terms-grid .term-card[data-index="${originalIndex}"]`);
        if (cardToShow) cardToShow.style.display = 'flex';
    }
    showToast('已移除词条');
}

// ── 移动端触摸拖拽 ──

function touchStart(event) {
    const target = event.target.closest('.term-card');
    if (!target) return;

    target.classList.add('dragging');
    // 记录触摸起点，用于后续判断
    const touch = event.touches[0];
    target.dataset.touchStartX = touch.clientX;
    target.dataset.touchStartY = touch.clientY;
    event.preventDefault();
}

function touchMove(event) {
    const target = event.target.closest('.term-card.dragging');
    if (!target) {
        event.preventDefault();
        return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const deltaX = touch.clientX - parseFloat(target.dataset.touchStartX || 0);
    const deltaY = touch.clientY - parseFloat(target.dataset.touchStartY || 0);

    // 视觉跟随手指
    target.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    target.style.zIndex = '100';

    // 高亮当前悬浮区域
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    if (elementBelow) {
        const dropZone = elementBelow.closest('#drop-zone');
        const multiplierArea = elementBelow.closest('#multiplier-area');
        if (dropZone) {
            dropZone.classList.add('drag-over');
        } else if (multiplierArea) {
            multiplierArea.classList.add('drag-over');
        }
    }
}

function touchEnd(event) {
    const target = event.target.closest('.term-card.dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

    if (!target) return;

    target.classList.remove('dragging');
    target.style.transform = '';
    target.style.zIndex = '';

    const touch = event.changedTouches[0];
    const elementAtEnd = document.elementFromPoint(touch.clientX, touch.clientY);

    if (!elementAtEnd) return;

    // 处理放置到倍率区
    const multiplierArea = elementAtEnd.closest('#multiplier-area');
    if (multiplierArea && target.classList.contains('term-card')) {
        const question = questions[currentQuestionIndex % questions.length];
        const isFromMultiplier = target.classList.contains('in-multiplier');
        const slotIndex = parseInt(target.getAttribute('data-slot-index'));

        if (isFromMultiplier && !isNaN(slotIndex)) {
            // 倍率区内重排 — 暂时用末尾插入简化
            const movedTerm = selectedTerms.splice(slotIndex, 1)[0];
            if (movedTerm) {
                selectedTerms.push(movedTerm);
                renderMultiplierSlots();
            }
        } else if (!isFromMultiplier) {
            const index = parseInt(target.getAttribute('data-index'));
            const term = question.terms[index];
            if (term && selectedTerms.length < 8 && !selectedTerms.some(t => t._idx === term._idx)) {
                selectedTerms.push(term);
                renderMultiplierSlots();
                const cardToHide = document.querySelector(`#terms-grid .term-card[data-index="${index}"]`);
                if (cardToHide) cardToHide.style.display = 'none';
            }
        }
        return;
    }

    // 处理放置到词条池（拖回移除）
    const dropZone = elementAtEnd.closest('#drop-zone');
    const termsPool = elementAtEnd.closest('.terms-pool');
    if ((dropZone || termsPool) && target.classList.contains('in-multiplier')) {
        const slotIndex = parseInt(target.getAttribute('data-slot-index'));
        if (!isNaN(slotIndex)) {
            removeTermFromMultiplier(slotIndex);
        }
    }
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
}

function dragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const slot = event.target.closest('.multiplier-slot');
    if (slot) {
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
    document.querySelectorAll('.multiplier-slot').forEach(slot => slot.classList.remove('drag-over'));

    const index = parseInt(event.dataTransfer.getData('text/plain'));
    const fromMultiplier = event.dataTransfer.getData('fromMultiplier') === 'true';
    const sourceSlotIndex = parseInt(event.dataTransfer.getData('slotIndex'));

    const question = questions[currentQuestionIndex % questions.length];

    if (fromMultiplier) {
        // 倍率区内重排序
        const targetSlot = event.target.closest('.multiplier-slot');
        if (targetSlot) {
            const targetSlotIndex = targetSlot.getAttribute('data-slot-index');
            let targetIndex;

            if (targetSlotIndex !== null) {
                targetIndex = parseInt(targetSlotIndex);
            } else {
                targetIndex = selectedTerms.length;
            }

            if (sourceSlotIndex !== targetIndex && !isNaN(sourceSlotIndex)) {
                const movedTerm = selectedTerms.splice(sourceSlotIndex, 1)[0];
                if (movedTerm) {
                    selectedTerms.splice(targetIndex, 0, movedTerm);
                    renderMultiplierSlots();
                }
            }
        }
        // 注：从倍率区拖回词条池由 dropToTermsPool / dropToDropZone 处理
    } else {
        if (selectedTerms.length >= 8) {
            showToast('最多选择8个词条');
            return;
        }

        const term = question.terms[index];

        if (!term) return;

        if (selectedTerms.some(t => t._idx === term._idx)) {
            showToast('该词条已选择');
            return;
        }

        selectedTerms.push(term);
        renderMultiplierSlots();

        // 按 data-index 查找卡片（洗牌后 DOM 位置 ≠ data-index）
        const cardToHide = document.querySelector(`#terms-grid .term-card[data-index="${index}"]`);
        if (cardToHide) cardToHide.style.display = 'none';
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
        multiplierSlots.innerHTML = '<div class="multiplier-slot">拖拽词条到这里</div>';
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

function adjustChip(factor) {
    const newChip = Math.round(baseChip * factor);
    
    if (factor > 1) {
        const cost = newChip - baseChip;
        if (totalChips >= cost) {
            totalChips -= cost;
            baseChip = newChip;
            updateChipDisplay();
        } else {
            showToast('累计筹码不足');
        }
    } else {
        const refund = baseChip - newChip;
        if (newChip >= 1) {
            totalChips += refund;
            baseChip = newChip;
            updateChipDisplay();
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

    gameScreen.style.display = 'none';
    resultScreen.style.display = 'flex';
    animateReveal();
}

async function animateReveal() {
    const multiplierDisplay = document.getElementById('multiplier-display');
    const scoreDisplay = document.getElementById('score-display');
    const revealedTerms = document.getElementById('revealed-terms');

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

        await sleep(800);
    }

    const finalScore = hasZero ? 0 : Math.floor(baseChip * totalMultiplier);
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
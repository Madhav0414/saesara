const boardSize = 8;
let board = [];
let currentNumber = 1;
let gameActive = false;

let players = [];
let currentPlayerIndex = 0;
let secretRule = '';
let lastMove = { x: -1, y: -1 };

const allRules = [
    'no_adjacent',
    'black_squares_only',
    'corners_only',
    'center_four_blocks_only',
    'first_two_rows_only',
    'diagonal_only',
    'not_border_cells',
    'not_center_cells'
];

const gameBoard = document.getElementById('game-board');
const message = document.getElementById('message');
const guessRuleBtn = document.getElementById('guess-rule-btn');
const giveUpBtn = document.getElementById('give-up-btn');
const restartBtn = document.getElementById('restart-btn');
const turnIndicator = document.getElementById('turn-indicator');
const scoreboard = document.getElementById('scoreboard');
const guessOptionsContainer = document.getElementById('guess-options');
const startButton = document.getElementById('start-btn');
const playerBoxes = document.getElementById('player-boxes');
const giveUpBox = document.getElementById('give-up-confirmation');
const confirmGiveUpBtn = document.getElementById('confirm-give-up');
const cancelGiveUpBtn = document.getElementById('cancel-give-up');

startButton.addEventListener('click', startGame);
guessRuleBtn.addEventListener('click', showGuessOptions);
giveUpBtn.addEventListener('click', () => giveUpBox.style.display = 'block');
confirmGiveUpBtn.addEventListener('click', confirmGiveUp);
cancelGiveUpBtn.addEventListener('click', () => giveUpBox.style.display = 'none');
restartBtn.addEventListener('click', () => location.reload());

document.getElementById('players').addEventListener('change', displayPlayerBoxes);

function displayPlayerBoxes() {
    const numPlayers = parseInt(document.getElementById('players').value);
    playerBoxes.innerHTML = '';

    if (numPlayers === 3 || numPlayers === 4 || numPlayers === 5) {
        let row1 = document.createElement('div');
        row1.classList.add('player-row');

        for (let i = 1; i <= Math.min(3, numPlayers); i++) {
            const box = document.createElement('div');
            box.classList.add('player-box');
            box.textContent = `Player ${i}`;
            row1.appendChild(box);
        }
        playerBoxes.appendChild(row1);

        if (numPlayers > 3) {
            let row2 = document.createElement('div');
            row2.classList.add('player-row');

            for (let i = 4; i <= numPlayers; i++) {
                const box = document.createElement('div');
                box.classList.add('player-box');
                box.textContent = `Player ${i}`;
                row2.appendChild(box);
            }
            playerBoxes.appendChild(row2);
        }
    }
}

function startGame() {
    let numPlayers = parseInt(document.getElementById('players').value);
    secretRule = allRules[Math.floor(Math.random() * allRules.length)];

    players = [];
    for (let i = 1; i <= numPlayers; i++) {
        players.push({ name: `Player ${i}`, score: 0, eliminated: false, roundsPlayed: 0, gaveUp: false });
    }

    currentPlayerIndex = 0;
    currentNumber = 1;
    gameActive = true;

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    createBoard();
    updateTurnIndicator();
    updateScoreboard();
}

function createBoard() {
    gameBoard.innerHTML = '';
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.x = i;
            cell.dataset.y = j;
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

function handleCellClick(e) {
    if (!gameActive) return;

    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);

    if (board[x][y] !== 0) {
        message.textContent = 'Cell already taken!';
        return;
    }

    if (isMoveValid(x, y)) {
        players[currentPlayerIndex].score += 1;
        message.textContent = `${players[currentPlayerIndex].name} made a valid move!`;

        board[x][y] = currentNumber;
        e.target.textContent = currentNumber;
        e.target.classList.add('taken');
        lastMove = { x, y };

        updateScoreboard();

        if (currentNumber === 20) {
            message.textContent = 'Game over! Number 20 placed.';
            endGame();
            return;
        }

        if (!hasValidMoves()) {
            declareHighestScorer();
            return;
        }

        currentNumber++;
    } else {
        message.textContent = `${players[currentPlayerIndex].name} made an invalid move! No points awarded.`;
    }

    players[currentPlayerIndex].roundsPlayed += 1;

    if (players[currentPlayerIndex].roundsPlayed >= 1 && !players[currentPlayerIndex].eliminated && !players[currentPlayerIndex].gaveUp) {
        guessRuleBtn.style.display = 'inline-block';
    } else {
        guessRuleBtn.style.display = 'none';
    }

    nextPlayer();
}

function isMoveValid(x, y) {
    if (secretRule === 'no_adjacent') {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        for (let dir of directions) {
            const nx = x + dir[0];
            const ny = y + dir[1];
            if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize && board[nx][ny] !== 0) {
                return false;
            }
        }
        return true;

    } else if (secretRule === 'black_squares_only') {
        return (x + y) % 2 === 0;

    } else if (secretRule === 'corners_only') {
        return (x === 0 && y === 0) || (x === 0 && y === boardSize - 1) || (x === boardSize - 1 && y === 0) || (x === boardSize - 1 && y === boardSize - 1);

    } else if (secretRule === 'center_four_blocks_only') {
        return (x >= 3 && x <= 4 && y >= 3 && y <= 4);

    } else if (secretRule === 'first_two_rows_only') {
        return x < 2;

    } else if (secretRule === 'diagonal_only') {
        return (x === y) || (x + y === boardSize - 1);

    } else if (secretRule === 'not_border_cells') {
        return x > 0 && x < boardSize - 1 && y > 0 && y < boardSize - 1;

    } else if (secretRule === 'not_center_cells') {
        return !(x >= 3 && x <= 4 && y >= 3 && y <= 4);
    }

    return true;
}

function hasValidMoves() {
    return board.some((row, i) =>
        row.some((cell, j) => cell === 0 && isMoveValid(i, j))
    );
}

function declareHighestScorer() {
    let maxScore = Math.max(...players.map(p => p.score));
    let winners = players.filter(p => p.score === maxScore && !p.eliminated && !p.gaveUp);

    if (winners.length === 1) {
        message.textContent = `No valid moves left. ${winners[0].name} wins with ${winners[0].score} points!`;
    } else if (winners.length > 1) {
        let winnerNames = winners.map(p => p.name).join(' & ');
        message.textContent = `It's a tie! ${winnerNames} win with ${maxScore} points!`;
    } else {
        message.textContent = `No valid moves left. No winner this round.`;
    }

    endGame();
}

function nextPlayer() {
    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (players[currentPlayerIndex].eliminated || players[currentPlayerIndex].gaveUp);

    updateTurnIndicator();
}

function updateTurnIndicator() {
    turnIndicator.textContent = `${players[currentPlayerIndex].name}'s Turn`;
}

function updateScoreboard() {
    scoreboard.innerHTML = '';
    players.forEach(p => {
        if (!p.eliminated && !p.gaveUp) {
            const scoreBox = document.createElement('div');
            scoreBox.classList.add('score-player-box');
            scoreBox.textContent = `${p.name}: ${p.score} points`;
            scoreboard.appendChild(scoreBox);
        }
    });
}

function showGuessOptions() {
    guessOptionsContainer.innerHTML = '';
    const randomRules = [...allRules].sort(() => 0.5 - Math.random()).slice(0, 7);

    if (!randomRules.includes(secretRule)) {
        randomRules.push(secretRule);
    }

    const options = randomRules.sort(() => 0.5 - Math.random());

    options.forEach(rule => {
        const optionBox = document.createElement('div');
        optionBox.classList.add('guess-option');
        optionBox.textContent = rule;
        optionBox.addEventListener('click', () => evaluateGuess(rule));
        guessOptionsContainer.appendChild(optionBox);
    });
}

function evaluateGuess(selectedRule) {
    if (selectedRule === secretRule) {
        message.textContent = `${players[currentPlayerIndex].name} guessed correctly and wins the game!`;
        endGame();
    } else {
        message.textContent = `${players[currentPlayerIndex].name} guessed wrong and is eliminated!`;
        players[currentPlayerIndex].eliminated = true;

        if (players.filter(p => !p.eliminated && !p.gaveUp).length === 0) {
            message.textContent = `All players eliminated or gave up. The secret rule was: ${secretRule}`;
            endGame();
        }
    }

    guessRuleBtn.style.display = 'none';
    guessOptionsContainer.innerHTML = '';
    updateScoreboard();
    nextPlayer();
}

function confirmGiveUp() {
    players[currentPlayerIndex].gaveUp = true;
    giveUpBox.style.display = 'none';

    if (players.filter(p => !p.eliminated && !p.gaveUp).length === 0) {
        message.textContent = `All players gave up. The secret rule was: ${secretRule}`;
        endGame();
    } else {
        nextPlayer();
        updateScoreboard();
    }
}

function endGame() {
    gameActive = false;
    restartBtn.style.display = 'inline-block';
}

function giveUp() {
    giveUpBox.style.display = 'block';
}
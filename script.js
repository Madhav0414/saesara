const boardSize = 8;
let board = [];
let currentNumber = 0;
let gameActive = false;

let players = [];
let currentPlayerIndex = 0;

let secretRule = '';

const allRules = [
    'no_adjacent',
    'corners_only',
    'center_four_blocks_only',
    'first_two_rows_only',
    'diagonal_only',
    'not_border_cells',
    'not_center_cells',
    'top_four_even_bottom_four_odd',
    'top_two_multiple_of_three',
    'bottom_two_perfect_squares',
    'left_four_columns_even',
    'right_four_columns_odd',
    'main_diagonal_multiples_of_four',
    'anti_diagonal_primes_only',
    'center_four_even_squares',
    'border_multiples_of_five'
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

    if (numPlayers >= 3 && numPlayers <= 5) {
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
    players = [];
    for (let i = 1; i <= numPlayers; i++) {
        players.push({ name: `Player ${i}`, score: 0, gaveUp: false });
    }

    secretRule = allRules[Math.floor(Math.random() * allRules.length)];
    currentPlayerIndex = 0;
    currentNumber = 0;
    gameActive = true;

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    createBoard();
    placeInitialZero();
    updateTurnIndicator();
    updateScoreboard();
    message.textContent = '';
}

function placeInitialZero() {
    let validCells = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (isMoveValid(i, j, 0)) {
                validCells.push({ x: i, y: j });
            }
        }
    }

    if (validCells.length > 0) {
        let randomCell = validCells[Math.floor(Math.random() * validCells.length)];
        board[randomCell.x][randomCell.y] = 0;
        let cellElement = document.querySelector(`.cell[data-x="${randomCell.x}"][data-y="${randomCell.y}"]`);
        cellElement.textContent = 0;
        cellElement.classList.add('taken');
        currentNumber++;
    }
}

function createBoard() {
    gameBoard.innerHTML = '';
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

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

    if (board[x][y] !== null) {
        message.textContent = 'Cell already taken!';
        return;
    }

    if (isMoveValid(x, y, currentNumber)) {
        board[x][y] = currentNumber;
        e.target.textContent = currentNumber;
        e.target.classList.add('taken');
        message.textContent = `${players[currentPlayerIndex].name} made a valid move.`;

        if (currentNumber === 20) {
            message.textContent = 'Game over! Number 20 placed.';
            endGame();
            return;
        }

        if (!hasValidMoves()) {
            message.textContent = 'No valid moves left. Game over.';
            endGame();
            return;
        }

        currentNumber++;
    } else {
        message.textContent = `${players[currentPlayerIndex].name} made an invalid move.`;
    }

    guessRuleBtn.style.display = 'inline-block';
    nextPlayer();
}

function isMoveValid(x, y, num) {
    if (secretRule === 'no_adjacent') {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ];
        for (let dir of directions) {
            const nx = x + dir[0];
            const ny = y + dir[1];
            if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize && board[nx][ny] !== null) {
                return false;
            }
        }
        return true;

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

    } else if (secretRule === 'top_four_even_bottom_four_odd') {
        if (x < 4) {
            return num % 2 === 0;
        } else {
            return num % 2 !== 0;
        }

    } else if (secretRule === 'top_two_multiple_of_three') {
        if (x < 2) {
            return num % 3 === 0;
        } else {
            return true;
        }

    } else if (secretRule === 'bottom_two_perfect_squares') {
        if (x >= 6) {
            return Number.isInteger(Math.sqrt(num));
        } else {
            return true;
        }

    } else if (secretRule === 'left_four_columns_even') {
        if (y < 4) {
            return num % 2 === 0;
        } else {
            return true;
        }

    } else if (secretRule === 'right_four_columns_odd') {
        if (y >= 4) {
            return num % 2 !== 0;
        } else {
            return true;
        }

    } else if (secretRule === 'main_diagonal_multiples_of_four') {
        if (x === y) {
            return num % 4 === 0;
        } else {
            return true;
        }

    } else if (secretRule === 'anti_diagonal_primes_only') {
        if (x + y === boardSize - 1) {
            return isPrime(num);
        } else {
            return true;
        }

    } else if (secretRule === 'center_four_even_squares') {
        if (x >= 3 && x <= 4 && y >= 3 && y <= 4) {
            return Number.isInteger(Math.sqrt(num)) && num % 2 === 0;
        } else {
            return true;
        }

    } else if (secretRule === 'border_multiples_of_five') {
        if (x === 0 || x === boardSize - 1 || y === 0 || y === boardSize - 1) {
            return num % 5 === 0;
        } else {
            return true;
        }
    }

    return true;
}

function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

function hasValidMoves() {
    return board.some((row, i) =>
        row.some((cell, j) => cell === null && isMoveValid(i, j, currentNumber))
    );
}

function nextPlayer() {
    do {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    } while (players[currentPlayerIndex].gaveUp);

    updateTurnIndicator();
}

function updateTurnIndicator() {
    turnIndicator.textContent = `${players[currentPlayerIndex].name}'s Turn`;
}

function updateScoreboard() {
    scoreboard.innerHTML = '';
    players.forEach(p => {
        const scoreBox = document.createElement('div');
        scoreBox.classList.add('score-player-box');
        scoreBox.textContent = `${p.name}: ${p.score} points`;
        scoreboard.appendChild(scoreBox);
    });
}

function showGuessOptions() {
    guessOptionsContainer.innerHTML = '';
    const randomRules = [...allRules].sort(() => 0.5 - Math.random()).slice(0, 14);

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
        const points = Math.ceil(currentNumber / 2);
        players[currentPlayerIndex].score += points;

        message.textContent = `${players[currentPlayerIndex].name} guessed correctly and wins the game! Scored ${points} points.`;
        updateScoreboard();
        endGame();
    } else {
        message.textContent = `${players[currentPlayerIndex].name} guessed wrong! Please provide a counterexample.`;

        guessRuleBtn.style.display = 'none';
        guessOptionsContainer.innerHTML = '';
        updateScoreboard();
        nextPlayer();
    }
}

function confirmGiveUp() {
    players[currentPlayerIndex].gaveUp = true;
    giveUpBox.style.display = 'none';

    if (players.every(p => p.gaveUp)) {
        message.textContent = `All players gave up. The secret rule was: ${secretRule}`;
        endGame();
    } else {
        nextPlayer();
        updateScoreboard();
    }
}

function endGame() {
    gameActive = false;
    guessRuleBtn.style.display = 'none';
    guessOptionsContainer.innerHTML = '';
    restartBtn.style.display = 'inline-block';
}

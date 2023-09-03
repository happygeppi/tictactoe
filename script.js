let DIM = prompt("DIM?");
let board;

const $ = (id) => document.getElementById(id);
const $$ = (q) => document.querySelector(q);
const $$$ = (q) => document.querySelectorAll(q);

const html = {
  board: $("board"),
};

let turn = 1;
const players = ["", "X", "O"];
const drawSymbol = "\u00bd"; // 1/2
let done = false;

let autoplay = false;

function Init() {
  CreateBoardHTML();
  CreateBoardData();
}

function CreateBoardData() {
  board = 0;
  CreateDataLayer(1);
}

function CreateDataLayer(n) {
  const nextBoard = [];
  for (let i = 0; i < 9; i++) nextBoard[i] = board.copy();
  board = nextBoard;
  if (n < DIM) CreateDataLayer(n + 1);
}

function CreateBoardHTML() {
  CreateLayer(0);
}

function CreateLayer(n) {
  if (n == DIM) return CreateCells();

  if (n == 0) {
    const Game = document.createElement("div");
    Game.classList.add("game");
    html.board.append(Game);
    Game.style.setProperty("--gap", `${Gap(n)}px`);
  } else {
    const games = $$$(GameLayer(n));
    for (let g = 0; g < games.length; g++) {
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 3; i++) {
          const Game = document.createElement("div");
          Game.classList.add("game");
          games[g].append(Game);
          Game.style.setProperty("--gap", `${Gap(n)}px`);
        }
      }
    }
  }

  CreateLayer(n + 1);
}

function CreateCells() {
  const games = $$$(GameLayer(DIM)).toArray();
  let CellSize;
  for (let g = 0; g < games.length; g++) {
    for (let i = 0; i < 9; i++) {
      const Cell = document.createElement("div");
      Cell.classList.add("cell");
      Cell.classList.add("next");
      Cell.classList.add("playable");
      Cell.addEventListener("click", () => Place(g, i, Cell));
      games[g].append(Cell);
      if (g == 0 && i == 0) CellSize = Cell.getBoundingClientRect().width;
      Cell.style.setProperty("--cell-size", `${CellSize}px`);
    }
  }
}

function GameLayer(n) {
  let query = ".game";
  for (let i = 1; i < n; i++) query += " > .game";
  return query;
}

function Gap(n) {
  return 1 + ((DIM - n) * 4) / DIM;
}

function Autoplay() {
  if (done) return;
  const possibleCells = $$$(".next.playable").toArray();
  const Cell = possibleCells[Math.floor(Math.random() * possibleCells.length)];
  Cell.click();
  if (autoplay) requestAnimationFrame(Autoplay);
}

document.addEventListener("keypress", (e) => {
  if (e.key == " ") {
    autoplay = !autoplay;
    if (autoplay) Autoplay();
  } else {
    autoplay = false;
    Autoplay();
  }
});

function Place(gameIndex, cellIndex, Cell) {
  if (!Cell.classList.contains("playable") || !Cell.classList.contains("next"))
    return;

  // fill cell with X or O
  Cell.classList.remove("playable");
  Cell.innerHTML = players[turn];

  // remove next class from all cells
  const allCells = $$$(".cell").toArray();
  for (const c of allCells) c.classList.remove("next");

  // update board data
  UpdateBoard(gameIndex, cellIndex);

  // check if 3 in a row in this game
  CheckWin(Indices(gameIndex));

  // next cells:
  NextGame(gameIndex, cellIndex);

  // next players turn
  turn = 3 - turn;
}

function NextGame(gameIndex, cellIndex) {
  const i = Indices(gameIndex);
  i.push(cellIndex);
  NextClass(SelectGame(NextGameIndices(i)));
}

function NextClass(nextGame) {
  if (nextGame == null) return;

  const nextCells = nextGame.children;
  for (const c of nextCells) {
    if (!c.classList.contains("cell")) NextClass(c);
    else c.classList.add("next");
  }
}

function NextGameIndices(i) {
  if (typeof board.at(i.copy().slice(0, i.length - 1)) == "number")
    return NextGameIndices(i.slice(0, i.length - 1));

  i.splice(i.length - 2, 1);
  if (typeof board.at(i) == "number") return i.slice(0, i.length - 1);

  return i;
}

function UpdateHTML(gameIndices, winner) {
  SelectGame(gameIndices).remove();
  const Cell = document.createElement("div");
  Cell.classList.add("cell");

  if (gameIndices.length == 0) html.board.append(Cell);
  else {
    if (gameIndices[gameIndices.length - 1] == 8) {
      const parent = SelectGame(gameIndices.slice(0, gameIndices.length - 1));
      parent.append(Cell);
    } else {
      const parent = SelectGame(gameIndices).parentElement;
      const before = parent.children[gameIndices[gameIndices.length - 1]];
      parent.insertBefore(Cell, before);
    }
  }

  Cell.innerHTML = winner == -1 ? drawSymbol : players[winner];
  const CellSize = Cell.getBoundingClientRect().width;
  Cell.style.setProperty("--cell-size", `${CellSize}px`);
}

function SelectGame(gameIndices) {
  if (gameIndices.length == 0) return $$(".game");

  let current = $$(".game");
  for (const i of gameIndices) current = current.children[i];
  return current;
}

function CheckWin(gameIndices) {
  let winner = CheckWinGame(board.at(gameIndices));
  if (!winner && CheckDraw(board.at(gameIndices))) winner = -1;

  if (winner != 0) {
    UpdateHTML(gameIndices, winner);
    if (gameIndices.length == 0) {
      done = true;
      if (winner == -1) return console.log("It's a draw!");
      return console.log(`Congragulations, player ${players[winner]}!`);
    }

    const GameWon = gameIndices[gameIndices.length - 1];
    const parentGame = gameIndices.slice(0, gameIndices.length - 1);
    board.at(parentGame)[GameWon] = winner;

    CheckWin(parentGame);
  }
}

function CheckDraw(game) {
  for (const cell of game) if (typeof cell == "object" || cell === 0) return false;
  return true;
}

function CheckWinGame(game) {
  return CheckRows(game) || CheckCols(game) || CheckDiag(game);
}

function CheckRows(game) {
  for (let row = 0; row < 3; row++)
    if (
      game[3 * row] == game[3 * row + 1] &&
      game[3 * row + 1] == game[3 * row + 2] &&
      game[3 * row] > 0 &&
      typeof game[3 * row] == "number"
    )
      return game[3 * row];
  return false;
}

function CheckCols(game) {
  for (let col = 0; col < 3; col++)
    if (
      game[0 + col] == game[3 + col] &&
      game[3 + col] == game[6 + col] &&
      game[0 + col] > 0 &&
      typeof game[0 + col] == "number"
    )
      return game[0 + col];
  return false;
}

function CheckDiag(game) {
  if (
    game[0] == game[4] &&
    game[4] == game[8] &&
    game[0] > 0 &&
    typeof game[0] == "number"
  )
    return game[0];
  if (
    game[2] == game[4] &&
    game[4] == game[6] &&
    game[2] > 0 &&
    typeof game[2] == "number"
  )
    return game[2];
  return false;
}

function UpdateBoard(gameIndex, cellIndex) {
  board.at(Indices(gameIndex))[cellIndex] = turn;
}

function Indices(gameIndex) {
  const indices = [];
  for (let power = DIM - 2; power >= 0; power--) {
    const index = Math.floor(gameIndex / 9 ** power);
    indices.push(index);
    gameIndex -= index * 9 ** power;
  }
  return indices;
}

NodeList.prototype.toArray = function () {
  const arr = [];
  for (let i = 0; i < this.length; i++) arr.push(this[i]);
  return arr;
};

Array.prototype.sortByPosition = function () {
  this.sort(
    (a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y
  );
  return this;
};

Array.prototype.copy = function () {
  const copy = [];
  for (const elem of this)
    if (elem.constructor.name == "Array") copy.push(elem.copy());
    else copy.push(elem);
  return copy;
};

Number.prototype.copy = function () {
  return this.valueOf();
};

Array.prototype.at = function (index) {
  if (index.length == 0) return this;
  index = index.copy();
  if (typeof index == "number") return this[index];
  if (typeof index == "object") {
    if (index.length == 1) return this[index[0]];
    const index0 = index.splice(0, 1);
    if (typeof this[index0] != "object") return this[index0];
    return this[index0].at(index);
  }
};

Array.prototype.spliceLast = function () {
  this.splice(this.lenght - 1, 1);
  return this;
};

Init();

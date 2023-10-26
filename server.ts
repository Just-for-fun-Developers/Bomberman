import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:8080",
    methods: ["GET", "POST"],
  },
});

const players: any = {};

interface Maze {
  data: number[][];
  columns: number;
  rows: number;
}

let game_maze: Maze = {} as Maze;

//To position a new player in a random free place
function CreateNewPlayer(socketId: string) {
  let isIn: boolean;
  isIn = true;
  while (isIn) {
    const rangValue = game_maze.rows * game_maze.columns - 1;
    let randomValue = Math.floor(Math.random() * rangValue);
    const row = Math.floor(randomValue / game_maze.rows);
    const col = Math.floor(randomValue % game_maze.columns);
    if (game_maze.data[row][col] === 0) {
      game_maze.data[row][col] = 2;
      players[socketId] = {
        x: col * 64 + 64,
        y: row * 64 + 64,
        playerId: socketId,
      };
      isIn = false;
    }
  }
}
let newMaze: number[][] | undefined = undefined;
const ROWS = 10;
const COLS = 10;
const PERCENTAGE_OCCUPIED = 0.5;

io.on("connection", (socket) => {
  console.log(`connect ${socket.id}`);

  if (newMaze === undefined) {
    newMaze = createMaze(ROWS, COLS, PERCENTAGE_OCCUPIED);
    game_maze = { data: newMaze, columns: COLS, rows: ROWS };
  }

  CreateNewPlayer(socket.id);

  socket.on("ping", (cb) => {
    console.log("ping");
    cb();
  });

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", () => {
    console.log(`disconnect ${socket.id}`);
    delete players[socket.id];
    io.emit("disconnect_player", socket.id);
  });

  socket.emit("game_maze", game_maze);

  socket.on("playerMovement", (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    socket.broadcast.emit("playerMoved", {
      player: players[socket.id],
      action: movementData.action,
    });
  });
});

// TODO: Move this function to a helper function files
function swapValues(arr: number[], index1: number, index2: number): void {
  let temp = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = temp;
}

// This is a replacement for the function Phaser.Math.Between
function between(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// rows: number of rows
// cols: number of columns
// occupiedPer: percentage of cells occupied, should be a float between [0,1]
function createMaze(rows: number, cols: number, occupiedPer: number) {
  let cells: number[] = [];
  let maze: number[][] = [];
  for (let cellId = 0; cellId < rows * cols; cellId++) {
    cells.push(cellId);
  }

  // Filling maze with empty cells
  for (let row = 0; row < rows; row++) {
    maze.push([]);
    for (let col = 0; col < cols; col++) {
      maze[row].push(0);
    }
  }

  let numberBlockedCells = Math.floor(rows * cols * occupiedPer);
  let currentNumberBlockedCells = 0;
  while (numberBlockedCells > currentNumberBlockedCells) {
    // TODO: think if is convenient to use a function from Phaser here
    let nextRandomCell = between(currentNumberBlockedCells, rows * cols - 1);
    swapValues(cells, nextRandomCell, currentNumberBlockedCells);

    const cellId = cells[currentNumberBlockedCells];
    const row = Math.floor(cellId / rows);
    const col = Math.floor(cellId % cols);

    // make this cellId block cell
    maze[row][col] = 1;

    // return;
    // Check if there is just 1 connected component
    const numberCC = numberConnectedComponents(rows, cols, maze);
    if (numberCC === 1) {
      currentNumberBlockedCells++;
    } else {
      // looks like this cell create 2 components
      maze[row][col] = 0;
    }
  }
  return maze;
}

function numberConnectedComponents(
  rows: number,
  cols: number,
  maze: number[][]
) {
  let visited: boolean[][] = [];

  for (let row = 0; row < rows; row++) {
    visited.push([]);
    for (let col = 0; col < cols; col++) {
      visited[row].push(false);
    }
  }

  let numberCC = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // empty cell and not visited
      if (maze[row][col] === 0 && !visited[row][col]) {
        dfs(row, col, rows, cols, maze, visited);
        numberCC++;
      }
    }
  }

  return numberCC;
}

const X = [1, 0, -1, 0];
const Y = [0, -1, 0, 1];

function dfs(
  row: number,
  col: number,
  rows: number,
  cols: number,
  maze: number[][],
  visited: boolean[][]
) {
  visited[row][col] = true;
  for (let dir = 0; dir < 4; dir++) {
    const newRow = row + X[dir];
    const newCol = col + Y[dir];
    // Check if newRow and newCol is inside the maze
    if (0 <= newRow && newRow < rows && 0 <= newCol && newCol < cols) {
      // check if cell is not visited and new cell is empty
      if (!visited[newRow][newCol] && maze[newRow][newCol] === 0) {
        dfs(newRow, newCol, rows, cols, maze, visited);
      }
    }
  }
}

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

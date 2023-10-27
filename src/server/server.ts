import { Server } from "socket.io";
import { createServer } from "http";
import { createMaze } from "./Maze";
import { Maze, PlayerInfo } from "../common/interfaces";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:8080",
    methods: ["GET", "POST"],
  },
});

const players: { [key: string]: PlayerInfo } = {};

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

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

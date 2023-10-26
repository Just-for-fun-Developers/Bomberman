import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:8080",
    methods: ["GET", "POST"],
  },
});

const players:any = {};

interface Maze {
  data: number[][];
  columns: number;
  rows: number;
}

const game_maze: Maze = {
  data: [
    [0, 1, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0],
    [1, 0, 0, 1, 0, 1, 0, 0],
  ],
  columns: 8,
  rows: 8,
};
//To position a new player in a random free place
function CreateNewPlayer(socketId: string) {
  let isIn:boolean;
  isIn = true;
  while (isIn) {
    const rangValue = game_maze.rows * game_maze.columns - 1;
    let randomValue = Math.floor(Math.random()*rangValue);
    const row = Math.floor(randomValue / game_maze.rows);
    const col = Math.floor(randomValue % game_maze.columns);
    if (game_maze.data[row][col] === 0) {
      game_maze.data[row][col] = 2;
      players[socketId] = {
        x:col * 64 + 64,
        y:row * 64 + 64,
        playerId: socketId
      }
      isIn = false;
    }
  }
}

io.on("connection", (socket) => {
  console.log(`connect ${socket.id}`);

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
    socket.broadcast.emit("playerMoved", {player:players[socket.id], action: movementData.action});
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

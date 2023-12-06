import { Server } from "socket.io";
import { createServer } from "http";
import { createMaze } from "./Maze";
import { Maze, PlayerInfo } from "../common/interfaces";
import express from "express";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.static("build"));

const players: { [key: string]: PlayerInfo } = {};

let game_maze: Maze = {} as Maze;

//To position a new player in a random free place
function CreateNewPlayer(socketId: string, playerName: any) {
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
        color: getRandomColor(),
        lifes: 4,
        name: playerName,
      };
      isIn = false;
    }
  }
}

function getRandomColor() {
  const letters = "0123456789abcdef";
  let color = "0x";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

let newMaze: number[][] | undefined = undefined;
const ROWS = 10;
const COLS = 10;
const PERCENTAGE_OCCUPIED = 0.5;

let sessionMap: Map<string, string> = new Map();

io.on("connection", (socket) => {
  //console.log(`connect ${socket.id}`);

  if (newMaze === undefined) {
    newMaze = createMaze(ROWS, COLS, PERCENTAGE_OCCUPIED);
    game_maze = { data: newMaze, columns: COLS, rows: ROWS };
  }
  socket.on("initPlayer", (playerInfo: { name: string; session: number }) => {
    console.log(
      `connect player: ${playerInfo.name} to the session: ${playerInfo.session}`
    );
    CreateNewPlayer(socket.id, playerInfo.name);
    sessionMap.set(socket.id, playerInfo.session.toString());
    socket.join(sessionMap.get(socket.id));
    io.to(socket.id).emit("game_maze", game_maze);
    socket.to(sessionMap.get(socket.id)).emit("newPlayer", players[socket.id]);

    const sessionPlayers = Object.entries(players)
      .filter(
        ([key, _]) => sessionMap.get(key) === playerInfo.session.toString()
      )
      .map(([key, value]) => {
        return { key, ...value };
      });
    io.to(sessionMap.get(socket.id)).emit("currentPlayers", sessionPlayers);
  });

  socket.on("bomb_activated", (bomb: { x: Number; y: number }) => {
    io.to(sessionMap.get(socket.id)).emit("bomb_activated", bomb);
  });

  socket.on("disconnect", () => {
    console.log(`disconnect ${players[socket.id].name}`);
    delete players[socket.id];
    io.to(sessionMap.get(socket.id)).emit("disconnect_player", socket.id);
    socket.leave(sessionMap.get(socket.id));
    sessionMap.delete(socket.id);
  });

  socket.on("playerMovement", (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    socket.to(sessionMap.get(socket.id)).emit("playerMoved", {
      player: players[socket.id],
      action: movementData.action,
    });
  });

  socket.on("updateScore", () => {
    players[socket.id].lifes--;
    io.to(sessionMap.get(socket.id)).emit("changeScore", {
      player: players[socket.id],
    });
  });
});
//For production
const PORT = process.env.SERVER_PORT;
//For dev
//const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io:bomberman-app server running on port --> ${PORT}`);
});

import { Server } from "socket.io";
import { createServer } from "http";
import { createMaze } from "./Maze";
import { Maze, PlayerInfo } from "../common/interfaces";
import express from "express";
import { logger } from "./logger";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use(express.static("build"));

const players: { [key: string]: PlayerInfo } = {};

let game_maze: Maze = {} as Maze;

//To position a new player in a random free place
function CreateNewPlayer(socketId: string, playerName: string) {
  let isIn: boolean;
  isIn = true;
  while (isIn) {
    const rangValue = game_maze.rows * game_maze.columns - 1;
    const randomValue = Math.floor(Math.random() * rangValue);
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

const sessionMap: Map<string, string> = new Map();
const gameStartedSession: Map<string, boolean> = new Map();
const activePlayersSession: Map<string, number> = new Map();

let activePlayers: number;

io.on("connection", (socket) => {
  if (newMaze === undefined) {
    newMaze = createMaze(ROWS, COLS, PERCENTAGE_OCCUPIED);
    game_maze = { data: newMaze, columns: COLS, rows: ROWS };
  }
  socket.on("sessionHash", () => {
    socket.emit("sessionHash", gameStartedSession);
  });
  socket.on(
    "initPlayer",
    (playerInfo: { name: string; session: number; newSession: boolean }) => {
      if (playerInfo.newSession) {
        gameStartedSession.set(playerInfo.session.toString(), false);
        activePlayers = 0;
      }
      if (!gameStartedSession.get(playerInfo.session.toString())) {
        logger.info(
          `connect player: ${playerInfo.name} to the session: ${playerInfo.session}`
        );
        CreateNewPlayer(socket.id, playerInfo.name);
        sessionMap.set(socket.id, playerInfo.session.toString());
        socket.join(sessionMap.get(socket.id));
        if (activePlayers == 0) {
          activePlayers = 1;
        } else {
          activePlayers =
            activePlayersSession.get(playerInfo.session.toString()) + 1;
        }
        activePlayersSession.set(playerInfo.session.toString(), activePlayers);

        io.to(socket.id).emit("game_maze", game_maze);
        socket
          .to(sessionMap.get(socket.id))
          .emit("newPlayer", players[socket.id]);

        const sessionPlayers = Object.entries(players)
          .filter(
            ([key, _]) => sessionMap.get(key) === playerInfo.session.toString()
          )
          .map(([key, value]) => {
            return { key, ...value };
          });
        socket.emit("currentPlayers", sessionPlayers);
      } else {
        logger.info(
          `Player ${playerInfo.name} tried to connect to session ${playerInfo.session}, access denied (Game Already Started)`
        );
        socket.emit("gameAlreadyStarted");
      }
    }
  );

  socket.on("start_game", (data: { session: string }) => {
    logger.info("start game for session = ", data.session);
    gameStartedSession.set(data.session.toString(), true);
    io.to(sessionMap.get(socket.id)).emit("start_game", {});
  });

  socket.on("bomb_activated", (bomb: { x: number; y: number }) => {
    io.to(sessionMap.get(socket.id)).emit("bomb_activated", bomb);
  });

  socket.on("disconnect", () => {
    logger.info(`disconnect player: ${players[socket.id].name}`);
    delete players[socket.id];
    io.to(sessionMap.get(socket.id)).emit("disconnect_player", socket.id);
    socket.leave(sessionMap.get(socket.id));

    const aux = activePlayersSession.get(sessionMap.get(socket.id));
    activePlayersSession.set(sessionMap.get(socket.id), aux - 1);

    sessionMap.delete(socket.id);
  });

  socket.on("playerGameOver", () => {});

  socket.on("playerMovement", (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    socket.to(sessionMap.get(socket.id)).emit("playerMoved", {
      player: players[socket.id],
      action: movementData.action,
    });
  });

  socket.on("updateScore", () => {
    console.log(`updateScore!`);
    players[socket.id].lifes--;
    io.to(sessionMap.get(socket.id)).emit("changeScore", {
      player: players[socket.id],
    });
    if (players[socket.id].lifes == 0) {
      const aux = activePlayersSession.get(sessionMap.get(socket.id));
      activePlayersSession.set(sessionMap.get(socket.id), aux - 1);
      logger.info(`End Game for the Session:  ${sessionMap.get(socket.id)}`);
      if (aux - 1 == 1) {
        const winner = Object.entries(players)
          .filter(
            ([key, _]) => sessionMap.get(key) === sessionMap.get(socket.id)
          )
          .map(([key, value]) => {
            return { key, ...value };
          })
          .filter((player) => player.lifes > 0);

        io.to(sessionMap.get(socket.id)).emit("endGame", winner[0]);
      }
    }
  });
});

const PORT = process.env.SERVER_PORT;

httpServer.listen(PORT, () => {
  console.log(`Socket.io:bomberman-app server running on port --> ${PORT}`);
});

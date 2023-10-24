import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://127.0.0.1:8080",
    methods: ["GET", "POST"],
  },
});

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


io.on("connection", (socket) => {
  console.log(`connect ${socket.id}`);

  socket.on("ping", (cb) => {
    console.log("ping");
    cb();
  });

  socket.on("disconnect", () => {
    console.log(`disconnect ${socket.id}`);
  });

  socket.emit("game_maze", game_maze);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

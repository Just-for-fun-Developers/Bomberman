import { io } from "socket.io-client";

const socket = io(`${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);

export default socket;
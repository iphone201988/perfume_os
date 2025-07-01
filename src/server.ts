import app from "./app";
import http from "http";
import { Server } from "socket.io";
import { connectDataBase } from "./config/db";
import { initSocketIO, setSocketServerInstance, } from "./services/socketManager";
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});


initSocketIO(io);
setSocketServerInstance(io);

const port = process.env.PORT || 3000

server.listen(port, () => {
  connectDataBase();
  console.log(`Server running on port ${port}`);
});
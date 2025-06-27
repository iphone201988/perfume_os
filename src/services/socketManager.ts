import { Server, Socket } from "socket.io";

let io: Server; // This will be set via setSocketServerInstance

const userSocketMap = new Map<string, string>(); // userId -> socketId

export function initSocketIO(ioInstance: Server) {
    ioInstance.on("connection", (socket: Socket) => {
        const userId = socket.handshake.query.userId as string;
        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`🟢 User connected: ${userId} → ${socket.id}`);
        }

        socket.on("disconnect", () => {
            for (const [uid, sid] of userSocketMap.entries()) {
                if (sid === socket.id) {
                    userSocketMap.delete(uid);
                    console.log(`🔴 User disconnected: ${uid}`);
                    break;
                }
            }
        });
    });
}

// 👇 This function will allow you to set the global `io` instance
export function setSocketServerInstance(ioInstance: Server) {
    io = ioInstance;
}

export function getSocketId(userId: string): string | undefined {
    return userSocketMap.get(userId);
}

export function emitProgress(userId: string, data: any) {
    const socketId = getSocketId(userId);
    if (socketId && io) {
        console.log("📡 Emitting:", { userId, socketId, data });
        io.to(socketId).emit("progress", data);
    } else {
        console.log(`⚠️ Cannot emit. Missing socket or io instance for ${userId}`);
        io.to(socketId).emit("error", "Missing socket or io instance");
    }
}

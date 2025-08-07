import { Server, Socket } from "socket.io";
import { findUserById } from "../utils/utills";
import { getUserProfile } from "../controller/user";

let io: Server; // This will be set via setSocketServerInstance

const userSocketMap = new Map<string, string>(); // userId -> socketId
const storeUserSocketMap = new Map<string, string>();// socketId -> userId


export function initSocketIO(ioInstance: Server) {
    ioInstance.on("connection", async (socket: Socket) => {
        const userId = socket.handshake.query.userId as string;

        if (userId) {
            try {
                // Try to find the user
                const user = await findUserById(userId);
                if (!user) {
                    socket.emit("error", "User not found");
                    return;
                }

                // Attach user to socket data
                socket.data.user = user;

                // Store user socket information
                userSocketMap.set(userId, socket.id);
                storeUserSocketMap.set(socket.id, userId);
                console.log(`🟢 User connected: ${userId} → ${socket.id}`);

                // Fetch user profile and emit it
                const data = await getUserProfile(userId, user);
                socket.emit("userProfile", data);
            } catch (error) {
                console.error("Error fetching user or profile:", error);
                socket.emit("error", "An error occurred while retrieving user profile.");
            }
        } else {
            socket.emit("error", "No userId provided.");
        }
        socket.on("userProfile", async () => {
            try {
                const userId = socket.data.user._id;
                const data = await getUserProfile(userId, socket.data.user);
                socket.emit("userProfile", data);
            } catch (error) {
                console.error("Error fetching user or profile:", error);
                socket.emit("error", "An error occurred while retrieving user profile.");
            }
        });
        socket.on("disconnect", () => {
            for (const [uid, sid] of userSocketMap.entries()) {
                if (sid === socket.id) {
                    userSocketMap.delete(uid);
                    storeUserSocketMap.delete(sid);
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
//get userId from socketId
export function getUserId(socketId: string): string | undefined {
    return storeUserSocketMap.get(socketId);
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
};
export function emitGetProfile(userId: string, data: any) {
    const socketId = getSocketId(userId);
    if (socketId && io) {
        console.log("📡 Emitting:", { userId, socketId, data });
        io.to(socketId).emit("userProfile", data);
    } else {
        console.log(`⚠️ Cannot emit. Missing socket or io instance for ${userId}`);
        io.to(socketId).emit("error", "Missing socket or io instance");
    }
};
export function emitNotificationCount(userId: string, data: any) {
    const socketId = getSocketId(userId);
    if (socketId && io) {
        console.log("📡 Emitting:", { userId, socketId, data });
        io.to(socketId).emit("notificationCount", data);
    } else {
        console.log(`⚠️ Cannot emit. Missing socket or io instance for ${userId}`);
        io.to(socketId).emit("error", "Missing socket or io instance");
    }
};
export function emitJoinRoom(userId: string, roomId: string, data: any) {
    const socketId = getSocketId(userId);
    if (socketId && io) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            socket.join(roomId);
            console.log("📡 User joined room:", { userId, socketId, roomId });
            io.to(roomId).emit("joinRoom", {roomId, data});
        }
    } else {
        console.log(`⚠️ Cannot emit. Missing socket or io instance for ${userId}`);
        io.to(socketId).emit("error", "Missing socket or io instance");
    }
};

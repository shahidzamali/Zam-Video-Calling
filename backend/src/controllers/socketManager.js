import { Server } from "socket.io";

// ✅ Store active connections, messages, and user online time
let connections = {}; // { roomId: [socketId1, socketId2, ...] }
let messages = {}; // { roomId: [{ sender, data, socketId }, ...] }
let timeOnline = {}; // { socketId: timestamp }

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`✅ New connection established: ${socket.id}`);

        // ✅ Event: User joins a call/room
        socket.on("join-call", (roomId) => {
            console.log(`👤 User ${socket.id} joining room: ${roomId}`);

            // Initialize room if it doesn't exist
            if (!connections[roomId]) {
                connections[roomId] = [];
            }

            // Add user to room
            connections[roomId].push(socket.id);
            
            // Track when user came online
            timeOnline[socket.id] = new Date();

            // Notify all users in room about new user
            connections[roomId].forEach((userId) => {
                io.to(userId).emit("user-joined", socket.id, connections[roomId]);
            });

            // Send previous chat messages to newly joined user
            if (messages[roomId]) {
                messages[roomId].forEach((msg) => {
                    io.to(socket.id).emit(
                        "chat-message", 
                        msg.data, 
                        msg.sender, 
                        msg.socketId
                    );
                });
            }

            console.log(`📊 Room ${roomId} now has ${connections[roomId].length} users`);
        });

        // ✅ Event: WebRTC signaling (for video/audio)
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // ✅ Event: Chat message
        socket.on("chat-message", (data, sender) => {
            // Find which room the user belongs to
            const roomId = findUserRoom(socket.id);

            if (roomId) {
                // Initialize messages array for room if needed
                if (!messages[roomId]) {
                    messages[roomId] = [];
                }

                // Store message
                const messageObj = {
                    sender: sender,
                    data: data,
                    socketId: socket.id,
                    timestamp: new Date()
                };

                messages[roomId].push(messageObj);

                console.log(`💬 Message in room ${roomId} from ${sender}: ${data}`);

                // Broadcast message to all users in room
                connections[roomId].forEach((userId) => {
                    io.to(userId).emit("chat-message", data, sender, socket.id);
                });
            } else {
                console.log(`⚠️ User ${socket.id} not in any room`);
            }
        });

        // ✅ Event: User disconnects
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.id}`);

            // Calculate time user was online
            if (timeOnline[socket.id]) {
                const onlineDuration = Math.abs(new Date() - timeOnline[socket.id]);
                const minutes = Math.floor(onlineDuration / 60000);
                const seconds = Math.floor((onlineDuration % 60000) / 1000);
                console.log(`⏱️ User was online for: ${minutes}m ${seconds}s`);
                
                delete timeOnline[socket.id];
            }

            // Find and remove user from their room
            const roomId = findUserRoom(socket.id);

            if (roomId) {
                // Notify other users
                connections[roomId].forEach((userId) => {
                    io.to(userId).emit("user-left", socket.id);
                });

                // Remove user from room
                connections[roomId] = connections[roomId].filter(
                    (userId) => userId !== socket.id
                );

                console.log(`📊 Room ${roomId} now has ${connections[roomId].length} users`);

                // Delete room if empty
                if (connections[roomId].length === 0) {
                    delete connections[roomId];
                    delete messages[roomId]; // Clean up messages too
                    console.log(`🗑️ Room ${roomId} deleted (empty)`);
                }
            }
        });

        // ✅ Event: User manually leaves call
        socket.on("leave-call", (roomId) => {
            console.log(`👋 User ${socket.id} leaving room: ${roomId}`);

            if (connections[roomId]) {
                // Notify other users
                connections[roomId].forEach((userId) => {
                    if (userId !== socket.id) {
                        io.to(userId).emit("user-left", socket.id);
                    }
                });

                // Remove user from room
                connections[roomId] = connections[roomId].filter(
                    (userId) => userId !== socket.id
                );

                // Delete room if empty
                if (connections[roomId].length === 0) {
                    delete connections[roomId];
                    delete messages[roomId];
                    console.log(`🗑️ Room ${roomId} deleted (empty)`);
                }
            }
        });

        // ✅ Event: Get room info
        socket.on("get-room-info", (roomId) => {
            const roomInfo = {
                userCount: connections[roomId]?.length || 0,
                users: connections[roomId] || [],
                messageCount: messages[roomId]?.length || 0
            };
            
            io.to(socket.id).emit("room-info", roomInfo);
        });
    });

    return io;
};

// ✅ Helper function: Find which room a user is in
const findUserRoom = (socketId) => {
    for (const [roomId, users] of Object.entries(connections)) {
        if (users.includes(socketId)) {
            return roomId;
        }
    }
    return null;
};

// ✅ Optional: Get all active rooms (for debugging)
export const getActiveRooms = () => {
    return Object.keys(connections).map((roomId) => ({
        roomId,
        userCount: connections[roomId].length,
        messageCount: messages[roomId]?.length || 0
    }));
};
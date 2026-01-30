import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import dotenv from "dotenv";

// ✅ Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// ✅ Set port from environment variable
app.set("port", process.env.PORT || 8000);

// ✅ Middlewares
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ✅ Routes
app.use("/api/v1/users", userRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
    res.json({ 
        message: "Zoom App Backend is running! 🚀", 
        status: "ok",
        port: app.get("port")
    });
});

// ✅ 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ 
        error: "Route not found",
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.stack);
    res.status(err.status || 500).json({ 
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    });
});

// ✅ Start server function
const start = async () => {
    try {
        // Check if MONGO_URI exists
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env file");
        }

        // ✅ Connect to MongoDB using .env variable
        const connectionDb = await mongoose.connect(process.env.MONGO_URI);

        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`📦 Database Host: ${connectionDb.connection.host}`);
        console.log(`🗄️  Database Name: ${connectionDb.connection.name}`);

        // ✅ Start server
        server.listen(app.get("port"), () => {
            console.log(`🚀 Server is running on PORT ${app.get("port")}`);
            console.log(`🌐 Local: http://localhost:${app.get("port")}`);
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1); // Exit process if connection fails
    }
};

// ✅ Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err);
    server.close(() => process.exit(1));
});

start();
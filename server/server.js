require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dns = require("node:dns");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const registerRoutes = require("./routes/register");
const postRoutes = require("./routes/post");
const marketUserRoutes = require("./routes/marketUser");
const sellItemRoutes = require("./routes/sellItem");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/Order");
const chatRoutes = require("./routes/chat");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

const server = http.createServer(app);
const onlineUsers = new Map();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) =>
    console.error(
      "❌ MongoDB connection error:",
      err.message
    )
  );

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://student-connect-eta.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

app.use("/api/register", registerRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/market", marketUserRoutes);
app.use("/api/market", sellItemRoutes);
app.use("/api/market", cartRoutes);
app.use("/api/market/orders", orderRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("StudyConnect API is running...");
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://student-connect-eta.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    const id = userId.toString();

    socket.join(id);

    if (!onlineUsers.has(id)) {
      onlineUsers.set(id, new Set());
    }

    onlineUsers.get(id).add(socket.id);

    socket.emit(
      "onlineUsers",
      Array.from(onlineUsers.keys())
    );

    if (onlineUsers.get(id).size === 1) {
      socket.broadcast.emit("userOnline", id);
    }
  });

  // ===============================
  // USER IS TYPING
  // ===============================
  socket.on("typing", ({ receiverId, senderId }) => {
    socket.to(receiverId.toString()).emit("userTyping", {
      senderId: senderId.toString(),
    });
  });

  // ===============================
  // USER STOPPED TYPING
  // ===============================
  socket.on("stopTyping", ({ receiverId, senderId }) => {
    socket.to(receiverId.toString()).emit("userStoppedTyping", {
      senderId: senderId.toString(),
    });
  });

  // ===============================
  // DISCONNECT
  // ===============================
  socket.on("disconnect", () => {
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);

        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("userOffline", userId);
        }

        break;
      }
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 7000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
require("dotenv").config();

const express = require("express");
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


dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

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

app.get("/", (req, res) => {
  res.send("StudyConnect API is running...");
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
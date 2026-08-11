require("dotenv").config();

const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const registerRoutes = require("./routes/register");
const postRoutes = require("./routes/post");

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
      "http://localhost:5174",
      "https://student-connect-eta.vercel.app",
    ],
    credentials: true,
  })
);

app.use(cookieParser());

app.use("/api/register", registerRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("StudyConnect API is running...");
});

const PORT = process.env.PORT || 7000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
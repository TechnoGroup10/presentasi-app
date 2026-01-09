require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/presentations", require("./routes/presentations"));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Serve frontend (optional, jika digabung)
app.use(express.static(path.join(__dirname, "../client")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.listen(PORT, () => {
    console.log(`Server berjalan pada http://localhost:${PORT}`);
});

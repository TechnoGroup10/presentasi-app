require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

console.log("🚀 Backend starting...");

/* ==========================
   CORS CONFIG (WAJIB)
========================== */
app.use(cors({
    origin: [
        "https://presentasi-app.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.options("*", cors());


/* ==========================
   BODY PARSER
========================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===== ROUTES ===== */
app.use("/auth", require("./routes/auth"));
app.use("/presentations", require("./routes/presentations"));

/* ===== HEALTH CHECK ===== */
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

/* ===== LISTEN ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("✅ Server listening on port", PORT);
});

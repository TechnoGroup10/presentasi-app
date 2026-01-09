const express = require("express");
const cors = require("cors");

const app = express();

/* ===== CORS CONFIG (WAJIB DI ATAS) ===== */
app.use(cors({
    origin: [
        "https://presentasi-nqbodj3pl-ikys-projects-7b9255e9.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

/* Preflight */
app.options("*", cors());

/* Middleware lain */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Routes */
app.use("/auth", require("./routes/auth"));
app.use("/presentations", require("./routes/presentations"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});

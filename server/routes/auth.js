const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("LOGIN:", username);

        if (!username || !password) {
            return res.status(400).json({ message: "Username & password wajib diisi" });
        }

        const [rows] = await db.query(
            "SELECT id, username, password FROM users WHERE username = ? LIMIT 1",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "User tidak ditemukan" });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || "dev_secret",
            { expiresIn: process.env.JWT_EXPIRES || "8h" }
        );

        res.json({ token });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const db = require("../db");
const { uploadToB2, deleteFromB2 } = require("../services/b2");

/* ==========================
   MULTER CONFIG
========================== */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10
    }
});

/* ==========================
   GET ALL PRESENTATIONS
========================== */
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, nama, judul, tanggal, file_url FROM presentations ORDER BY tanggal DESC"
        );
        res.json({ data: rows });
    } catch (err) {
        console.error("❌ DB ERROR:", err);
        res.status(500).json({
            message: "Gagal mengambil data",
            error: err.message
        });
    }
});

/* ==========================
   CREATE – MULTIPLE FILES
   URUTAN BENAR: auth → upload → handler
========================== */
router.post(
    "/",
    auth,
    upload.array("files", 10),
    async (req, res) => {
        try {
            const { nama, judul, tanggal } = req.body;
            const files = req.files;

            if (!nama || !judul || !tanggal) {
                return res.status(400).json({
                    message: "Nama, judul, dan tanggal wajib diisi"
                });
            }

            if (!files || files.length === 0) {
                return res.status(400).json({
                    message: "File wajib diupload"
                });
            }

            const insertPromises = [];

            for (const file of files) {
                const key = `presentations/${Date.now()}-${file.originalname}`;

                const fileUrl = await uploadToR2(
                    file.buffer,
                    key,
                    file.mimetype
                );

                insertPromises.push(
                    db.query(
                        "INSERT INTO presentations (nama, judul, tanggal, file_url) VALUES (?, ?, ?, ?)",
                        [nama, judul, tanggal, fileUrl]
                    )
                );
            }

            await Promise.all(insertPromises);

            res.json({
                message: `${files.length} file berhasil diupload`,
                count: files.length
            });

        } catch (err) {
            console.error("POST presentations error:", err.message);
            res.status(500).json({ message: "Upload gagal" });
        }
    }
);

/* ==========================
   DELETE – LOGIN REQUIRED
========================== */
router.delete("/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        const [[row]] = await db.query(
            "SELECT file_url FROM presentations WHERE id = ?",
            [id]
        );

        if (!row) {
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }

        // Ambil key setelah bucket name
        const key = decodeURIComponent(
            row.file_url.split(`/${process.env.R2_BUCKET_NAME}/`)[1]
        );

        await deleteFromR2(key);
        await db.query("DELETE FROM presentations WHERE id = ?", [id]);

        res.json({ message: "Data berhasil dihapus" });

    } catch (err) {
        console.error("DELETE presentations error:", err.message);
        res.status(500).json({ message: "Gagal menghapus data" });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const db = require("../db");
const {
    uploadToB2,
    deleteFromB2,
    getSignedFileUrl
} = require("../services/b2");

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
   → GENERATE SIGNED URL
========================== */
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, nama, judul, tanggal, file_key FROM presentations ORDER BY tanggal DESC"
        );

        const data = await Promise.all(
            rows.map(async row => ({
                id: row.id,
                nama: row.nama,
                judul: row.judul,
                tanggal: row.tanggal,
                file_url: await getSignedFileUrl(row.file_key, 600) // 10 menit
            }))
        );

        res.json({ data });

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

                // ✅ Upload ke Backblaze B2 (PRIVATE)
                const fileKey = await uploadToB2(
                    file.buffer,
                    key,
                    file.mimetype
                );

                insertPromises.push(
                    db.query(
                        "INSERT INTO presentations (nama, judul, tanggal, file_key) VALUES (?, ?, ?, ?)",
                        [nama, judul, tanggal, fileKey]
                    )
                );
            }

            await Promise.all(insertPromises);

            res.json({
                message: `${files.length} file berhasil diupload`,
                count: files.length
            });

        } catch (err) {
            console.error("POST presentations error:", err);
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
            "SELECT file_key FROM presentations WHERE id = ?",
            [id]
        );

        if (!row) {
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }

        await deleteFromB2(row.file_key);
        await db.query("DELETE FROM presentations WHERE id = ?", [id]);

        res.json({ message: "Data berhasil dihapus" });

    } catch (err) {
        console.error("DELETE presentations error:", err);
        res.status(500).json({ message: "Gagal menghapus data" });
    }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const db = require("../db");
const { uploadToR2, deleteFromR2 } = require("../services/r2");

// Konfigurasi Multer dengan error handling
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max per file
        files: 10 // max 10 files
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
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil data" });
    }
});

/* ==========================
   CREATE – MULTIPLE FILES
   Urutan: upload → auth → handler
========================== */
router.post("/", 
    (req, res, next) => {
        upload.array("files", 10)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error("Multer error:", err);
                return res.status(400).json({ 
                    message: `Upload error: ${err.message}` 
                });
            } else if (err) {
                console.error("Unknown upload error:", err);
                return res.status(500).json({ 
                    message: "Upload failed" 
                });
            }
            next();
        });
    },
    auth,
    async (req, res) => {
        try {
            console.log("=== POST /presentations ===");
            console.log("Files received:", req.files?.length || 0);
            console.log("Body:", req.body);

            const { nama, judul, tanggal } = req.body;
            const files = req.files;

            // Validasi
            if (!nama || !judul || !tanggal) {
                return res.status(400).json({ 
                    message: "Nama, judul, dan tanggal wajib diisi" 
                });
            }

            if (!files || files.length === 0) {
                console.log("❌ No files in req.files");
                return res.status(400).json({ 
                    message: "File wajib diupload" 
                });
            }

            console.log(`✅ Processing ${files.length} file(s)...`);
            const uploadedFiles = [];

            // Upload semua file ke R2
            for (const file of files) {
                const key = `presentations/${Date.now()}-${file.originalname}`;
                
                console.log(`Uploading: ${file.originalname} (${file.size} bytes)`);
                
                const fileUrl = await uploadToR2(
                    file.buffer,
                    key,
                    file.mimetype
                );

                uploadedFiles.push({
                    nama,
                    judul,
                    tanggal,
                    file_url: fileUrl,
                    filename: file.originalname
                });

                console.log(`✅ Uploaded: ${fileUrl}`);
            }

            // Insert semua ke database
            const promises = uploadedFiles.map(fileData => 
                db.query(
                    "INSERT INTO presentations (nama, judul, tanggal, file_url) VALUES (?, ?, ?, ?)",
                    [fileData.nama, fileData.judul, fileData.tanggal, fileData.file_url]
                )
            );

            await Promise.all(promises);

            console.log(`✅ ${files.length} file(s) successfully saved to DB`);

            res.json({ 
                message: `${files.length} file berhasil diupload`,
                count: files.length 
            });

        } catch (err) {
            console.error("❌ Upload error:", err);
            res.status(500).json({ message: "Upload gagal: " + err.message });
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

        const key = decodeURIComponent(
            row.file_url.split(`${process.env.R2_BUCKET_NAME}/`)[1]
        );

        await deleteFromR2(key);
        await db.query("DELETE FROM presentations WHERE id = ?", [id]);

        res.json({ message: "Data berhasil dihapus" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal menghapus data" });
    }
});

module.exports = router;
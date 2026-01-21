const API_URL = "https://presentasi-app-production.up.railway.app";



/* ==========================
   ELEMENTS
========================== */
const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const toggleFormBtn = document.getElementById("toggleFormBtn");
const uploadCard = document.getElementById("uploadCard");

/* ==========================
   MODAL LOGIN
========================== */
loginBtn.addEventListener("click", () => {
    if (localStorage.getItem("token")) {
        logout();
    } else {
        loginModal.style.display = "block";
    }
});

closeModal.addEventListener("click", () => {
    loginModal.style.display = "none";
});

window.addEventListener("click", e => {
    if (e.target === loginModal) loginModal.style.display = "none";
});

/* ==========================
   LOGIN
========================== */
loginSubmitBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const status = document.getElementById("loginStatus");

    status.textContent = "Memproses...";

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        localStorage.setItem("token", data.token);
        loginModal.style.display = "none";
        applyAuthUI();
        loadPresentations();

    } catch (err) {
        status.textContent = err.message;
    }
});

function logout() {
    localStorage.removeItem("token");
    applyAuthUI();
}

/* ==========================
   AUTH UI
========================== */
function applyAuthUI() {
    const token = localStorage.getItem("token");

    if (token) {
        loginBtn.textContent = "Logout";
        toggleFormBtn.classList.remove("hidden");
    } else {
        loginBtn.textContent = "Login";
        toggleFormBtn.classList.add("hidden");
        uploadCard.classList.add("hidden");
        toggleFormBtn.textContent = "+ Tambah Data";
    }
}

/* ==========================
   TOGGLE UPLOAD FORM
========================== */
toggleFormBtn.addEventListener("click", () => {
    uploadCard.classList.toggle("hidden");
    toggleFormBtn.textContent =
        uploadCard.classList.contains("hidden")
            ? "+ Tambah Data"
            : "− Tutup Form";
});

const uploadForm = document.getElementById("uploadForm");
const uploadStatus = document.getElementById("uploadStatus");

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Silakan login terlebih dahulu");
        return;
    }

    const formData = new FormData();
    formData.append("nama", document.getElementById("presenter_name").value);
    formData.append("judul", document.getElementById("title").value);
    formData.append("tanggal", document.getElementById("schedule").value);

    // 🔥 PERUBAHAN: Ambil semua file dan append satu per satu
    const files = document.getElementById("file").files;
    
    if (files.length === 0) {
        alert("Pilih minimal satu file");
        return;
    }

    for (const file of files) {
        formData.append("files", file);
    }

    // Debug: cek apa yang dikirim
    console.log("Files to upload:", files.length);
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }

    uploadStatus.textContent = `Mengupload ${files.length} file...`;
    uploadStatus.className = "loading show";

    try {
        const res = await fetch(`${API_URL}/presentations`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
                // JANGAN set Content-Type untuk FormData
            },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload gagal");

        uploadStatus.textContent = `Upload ${files.length} file berhasil`;
        uploadStatus.className = "success show";

        uploadForm.reset();
        loadPresentations();

    } catch (err) {
        uploadStatus.textContent = err.message;
        uploadStatus.className = "error show";
    }
});


/* ==========================
   LOAD DATA
========================== */
document.addEventListener("DOMContentLoaded", () => {
    applyAuthUI();
    loadPresentations();
});

async function loadPresentations() {
    const tbody = document.querySelector("#presentationTable tbody");
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Memuat data...</td></tr>`;

    try {
        const res = await fetch(`${API_URL}/presentations`);
        const json = await res.json();
        const data = json.data || [];

        tbody.innerHTML = "";

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Belum ada data.</td></tr>`;
            return;
        }

        // Group files dengan presenter, judul, dan jadwal yang sama
        const grouped = {};
        
        data.forEach(item => {
            const key = `${item.nama}|||${item.judul}|||${item.tanggal}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    nama: item.nama,
                    judul: item.judul,
                    tanggal: item.tanggal,
                    files: []
                };
            }
            
            grouped[key].files.push({
                id: item.id,
                file_url: item.file_url,
                filename: getFilenameFromUrl(item.file_url)
            });
        });

        const isLoggedIn = !!localStorage.getItem("token");

        // Render grouped data
        Object.values(grouped).forEach(group => {
            tbody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${group.nama}</td>
                    <td>${group.judul}</td>
                    <td>${new Date(group.tanggal).toLocaleDateString("id-ID", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</td>
                    <td>
                        <div class="files-container">
                            ${group.files.map((file, idx) => `
                                <div class="file-item">
                                    <span class="file-badge">${idx + 1}</span>
                                    <span class="file-name">${file.filename}</span>
                                    <div class="file-actions">
                                        <button 
                                            class="btn-view"
                                            data-url="${file.file_url}"
                                            title="Lihat file">
                                            👁️ View
                                        </button>
                                        <a 
                                            href="${file.file_url}" 
                                            target="_blank"
                                            class="btn-download"
                                            title="Download">
                                            ⬇️ Download
                                        </a>
                                        ${isLoggedIn ? `
                                            <button 
                                                class="btn-delete"
                                                data-id="${file.id}"
                                                title="Hapus file">
                                                🗑️ Delete
                                            </button>
                                        ` : ""}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                </tr>
            `);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Gagal memuat data</td></tr>`;
    }
}

// Helper function untuk extract filename dari URL
function getFilenameFromUrl(url) {
    try {
        const parts = url.split('/');
        let filename = parts[parts.length - 1];
        // Remove timestamp prefix (e.g., "1234567890-filename.pdf" -> "filename.pdf")
        filename = filename.replace(/^\d+-/, '');
        // Decode URL encoding (e.g., "%20" -> " ")
        filename = decodeURIComponent(filename);
        return filename;
    } catch {
        return 'file';
    }
}

/* ==========================
   EVENT DELEGATION (CSP SAFE)
========================== */
document.addEventListener("click", e => {

    // VIEW FILE
    if (e.target.classList.contains("btn-view")) {
        const url = e.target.dataset.url;
        window.open(url, "_blank");
    }

    // DELETE PRESENTATION
    if (e.target.classList.contains("btn-delete")) {
        const id = e.target.dataset.id;
        deletePresentation(id);
    }

});

/* ==========================
   DELETE
========================== */
function deletePresentation(id) {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    fetch(`${API_URL}/presentations/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    }).then(loadPresentations);
}
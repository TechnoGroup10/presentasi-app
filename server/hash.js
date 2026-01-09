const bcrypt = require("bcryptjs");

(async () => {
    const password = "admin123"; // ganti sesuai keinginan
    const hash = await bcrypt.hash(password, 10);
    console.log("HASH:", hash);
})();

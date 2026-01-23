const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: process.env.B2_REGION,
    endpoint: process.env.B2_ENDPOINT, // ← sekarang valid URL
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
    },
    forcePathStyle: true // WAJIB untuk Backblaze B2
});

async function uploadToB2(buffer, key, contentType) {
    await s3.send(new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));

    return `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${encodeURIComponent(key)}`;
}

async function deleteFromB2(key) {
    await s3.send(new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key
    }));
}

module.exports = { uploadToB2, deleteFromB2 };

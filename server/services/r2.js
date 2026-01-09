const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

/**
 * Upload file ke R2
 */
async function uploadToR2(buffer, key, contentType) {
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType
        })
    );

    return `${process.env.R2_PUBLIC_URL}/${encodeURI(key)}`;

}

/**
 * Delete file dari R2
 */
async function deleteFromR2(key) {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key
        })
    );
}

module.exports = {
    uploadToR2,
    deleteFromR2
};

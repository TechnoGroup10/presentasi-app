const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    region: process.env.B2_REGION,
    endpoint: process.env.B2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
    },
    forcePathStyle: true
});

async function uploadToB2(buffer, key, contentType) {
    await s3.send(new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));

    return key; // 🔴 SIMPAN KEY, BUKAN URL
}

async function deleteFromB2(key) {
    await s3.send(new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key
    }));
}

async function getSignedFileUrl(key, expiresIn = 600) {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key
    });

    return await getSignedUrl(s3, command, { expiresIn });
}

module.exports = {
    uploadToB2,
    deleteFromB2,
    getSignedFileUrl
};

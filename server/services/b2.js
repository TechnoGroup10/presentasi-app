const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.B2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
    }
});

const uploadToB2 = async (buffer, key, contentType) => {
    await s3.send(new PutObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));

    return `${process.env.B2_PUBLIC_URL}/${key}`;
};

const deleteFromB2 = async (key) => {
    await s3.send(new DeleteObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key
    }));
};

module.exports = { uploadToB2, deleteFromB2 };

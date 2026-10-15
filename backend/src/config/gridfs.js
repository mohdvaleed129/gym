
const mongoose = require("mongoose");

let bucket;

function getBucket() {
  if (bucket) return bucket;

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected.");
  }

  // Use the MongoDB driver bundled with Mongoose
  const { GridFSBucket } = mongoose.mongo;

  bucket = new GridFSBucket(db, {
    bucketName: "memberPhotos",
  });

  return bucket;
}

module.exports = { getBucket };

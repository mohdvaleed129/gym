
const express = require("express");
const mongoose = require("mongoose");
const { getBucket } = require("../config/gridfs");

const router = express.Router();

// Serve a photo from MongoDB GridFS
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid photo ID." });
    }

    const id = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getBucket();

    const files = await bucket.find({ _id: id }).toArray();
    if (!files.length) {
      return res.status(404).json({ message: "Photo not found." });
    }

    res.set("Content-Type", files[0].contentType || "image/webp");
    res.set("Cache-Control", "public, max-age=86400");

    bucket.openDownloadStream(id).on("error", next).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

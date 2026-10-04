const express = require("express");
const router = express.Router();
const multer = require("multer");
const authController = require("../controllers/authController");

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Signup route with file upload
router.post("/signup", upload.single("profilePhoto"), authController.signup);

// Signin route
router.post("/signin", authController.signin);

module.exports = router;

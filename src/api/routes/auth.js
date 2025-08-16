const express = require("express");
const authController = require("../controllers/authController");
const { validateLoginRequest } = require("../middleware/auth");
const router = express.Router();

router.post("/login", validateLoginRequest, authController.login);
router.post("/logout", authController.logout);

module.exports = router;

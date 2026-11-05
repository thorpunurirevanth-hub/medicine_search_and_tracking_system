const express = require("express");
const { sendMessage } = require("../controllers/chatController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate, allowRoles("user"));
router.post("/message", sendMessage);

module.exports = router;
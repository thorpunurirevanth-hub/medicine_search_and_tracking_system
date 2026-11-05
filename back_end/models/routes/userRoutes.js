const express = require("express");
const { getOrders, getProfile, updateProfile } = require("../controllers/userController");
const { createOrder } = require("../controllers/orderController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate);
router.get("/me", getProfile);
router.patch("/me", allowRoles("user"), updateProfile);
router.get("/orders", getOrders);
router.post("/orders", allowRoles("user"), createOrder);

module.exports = router;

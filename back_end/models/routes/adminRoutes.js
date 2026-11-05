const express = require("express");
const {
	getCustomers,
	getFeedback,
	getMedicines,
	getOrders,
	getPharmacies,
	getSummary,
	updatePharmacyStatus,
	updateUserStatus,
} = require("../controllers/adminController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate, allowRoles("admin"));
router.get("/summary", getSummary);
router.get("/customers", getCustomers);
router.patch("/customers/:userId/status", updateUserStatus);
router.get("/pharmacies", getPharmacies);
router.patch("/pharmacies/:shopId/status", updatePharmacyStatus);
router.get("/medicines", getMedicines);
router.get("/orders", getOrders);
router.get("/feedback", getFeedback);

module.exports = router;

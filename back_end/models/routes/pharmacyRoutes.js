const express = require("express");
const {
  addMedicine,
  createShop,
  deleteMedicine,
  getInventory,
  findNearbyShops,
  getMedicineImage,
  getShops,
  searchMedicines,
  updateMedicine,
  updateShop,
  uploadMedicineImage,
} = require("../controllers/pharmacyController");
const { getPharmacyOrders, getPharmacyPrescriptions, updateOrderStatus } = require("../controllers/orderController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { medicineImageUpload } = require("../middleware/upload");

const router = express.Router();

router.get("/medicines", searchMedicines);
router.get("/medicines/:medicineId/image", getMedicineImage);
router.get("/shops", getShops);
router.get("/nearby", findNearbyShops);
router.use(authenticate, allowRoles("pharmacy", "admin"));
router.get("/inventory", getInventory);
router.get("/orders", getPharmacyOrders);
router.get("/prescriptions", getPharmacyPrescriptions);
router.patch("/orders/:orderId/status", updateOrderStatus);
router.post("/shops", createShop);
router.patch("/shops/:shopId", updateShop);
router.post("/medicines", addMedicine);
router.post("/medicines/:medicineId/image", medicineImageUpload, uploadMedicineImage);
router.patch("/medicines/:medicineId", updateMedicine);
router.delete("/medicines/:medicineId", deleteMedicine);

module.exports = router;

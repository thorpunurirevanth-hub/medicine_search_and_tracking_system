const express = require("express");
const {
  downloadPrescription,
  getMyPrescriptions,
  uploadPrescription,
} = require("../controllers/prescriptionController");
const authenticate = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { prescriptionUpload } = require("../middleware/upload");

const router = express.Router();

router.use(authenticate);
router.get("/my", allowRoles("user"), getMyPrescriptions);
router.post("/upload", allowRoles("user"), prescriptionUpload, uploadPrescription);
router.get("/:prescriptionId/file", allowRoles("user", "pharmacy"), downloadPrescription);

module.exports = router;
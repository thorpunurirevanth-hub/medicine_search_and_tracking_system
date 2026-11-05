const path = require("path");
const MedicalShop = require("../models/MedicalShop");
const Order = require("../models/Order");
const Prescription = require("../models/Prescription");
const { deletePrivateFile, readPrivateFile, savePrivateFile } = require("../services/fileStorage");

const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

async function uploadPrescription(req, res, next) {
  let storedFile;
  try {
    if (!req.file) return res.status(400).json({ message: "Select a PDF, JPG, or PNG prescription." });
    const order = await Order.findOne({ _id: req.body?.orderId, user: req.user.id });
    if (!order) return res.status(404).json({ message: "The selected order was not found." });
    if (order.status === "cancelled") return res.status(400).json({ message: "A cancelled order cannot receive a prescription." });

    storedFile = await savePrivateFile(req.file.buffer, "prescriptions", allowedTypes);
    const prescription = await Prescription.create({
      user: req.user.id,
      shop: order.shop,
      order: order.id,
      storageName: storedFile.storageName,
      originalName: path.basename(req.file.originalname).slice(0, 180),
      mimeType: storedFile.mimeType,
      size: req.file.size,
    });
    const previousPrescription = order.prescription;
    order.prescription = prescription.id;
    await order.save();
    if (previousPrescription) {
      const previous = await Prescription.findByIdAndDelete(previousPrescription);
      if (previous) await deletePrivateFile("prescriptions", previous.storageName);
    }
    return res.status(201).json({ prescription: {
      id: prescription.id,
      originalName: prescription.originalName,
      mimeType: prescription.mimeType,
      size: prescription.size,
      createdAt: prescription.createdAt,
    } });
  } catch (error) {
    if (storedFile) await deletePrivateFile("prescriptions", storedFile.storageName).catch(() => {});
    return next(error);
  }
}

async function getMyPrescriptions(req, res, next) {
  try {
    const prescriptions = await Prescription.find({ user: req.user.id })
      .select("originalName mimeType size order createdAt")
      .populate("order", "status createdAt")
      .sort({ createdAt: -1 });
    return res.json({ prescriptions });
  } catch (error) {
    return next(error);
  }
}

async function downloadPrescription(req, res, next) {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId);
    if (!prescription) return res.status(404).json({ message: "Prescription not found." });

    let authorized = prescription.user.toString() === req.user.id;
    if (!authorized && req.user.role === "pharmacy") {
      authorized = Boolean(await MedicalShop.exists({ _id: prescription.shop, owner: req.user.id }));
    }
    if (!authorized) return res.status(403).json({ message: "You cannot access this prescription." });

    const { fullPath } = await readPrivateFile("prescriptions", prescription.storageName);
    res.set({
      "Content-Type": prescription.mimeType,
      "Content-Disposition": `attachment; filename="${prescription.originalName.replace(/["\\\r\n]/g, "_")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    });
    return res.sendFile(fullPath);
  } catch (error) {
    return next(error);
  }
}

module.exports = { downloadPrescription, getMyPrescriptions, uploadPrescription };
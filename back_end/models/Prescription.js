const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "MedicalShop", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    storageName: { type: String, required: true, unique: true },
    originalName: { type: String, required: true, maxlength: 180 },
    mimeType: { type: String, enum: ["application/pdf", "image/jpeg", "image/png"], required: true },
    size: { type: Number, required: true, max: 10485760 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
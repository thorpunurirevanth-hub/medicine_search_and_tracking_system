const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: {
      storageName: { type: String },
      mimeType: { type: String },
      originalName: { type: String },
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicalShop",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);

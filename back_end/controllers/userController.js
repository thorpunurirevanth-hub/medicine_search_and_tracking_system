const Order = require("../models/Order");
const User = require("../models/User");

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("name email role phone address locality");
    if (!user) return res.status(404).json({ message: "User profile not found." });
    return res.json({
      user,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const body = req.body || {};
    const updates = {};
    for (const field of ["name", "phone", "address", "locality"]) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "string") {
          return res.status(400).json({ message: `${field} must be text.` });
        }
        updates[field] = body[field].trim();
      }
    }
    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, {
      new: true,
      runValidators: true,
    }).select("name email role phone address locality");
    if (!user) return res.status(404).json({ message: "User profile not found." });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
}

async function getOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("shop", "name address")
      .populate("items.medicine", "name")
      .populate("prescription", "originalName mimeType size")
      .sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile, updateProfile, getOrders };

const Feedback = require("../models/Feedback");
const MedicalShop = require("../models/MedicalShop");
const Medicine = require("../models/Medicine");
const Order = require("../models/Order");
const User = require("../models/User");

async function getSummary(req, res, next) {
  try {
    const [users, customers, shops, medicines, orders, feedback] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "user" }),
      MedicalShop.countDocuments(),
      Medicine.countDocuments(),
      Order.countDocuments(),
      Feedback.countDocuments(),
    ]);
    return res.json({ users, customers, shops, medicines, orders, feedback });
  } catch (error) {
    return next(error);
  }
}

function pagination(query) {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(query.limit) || 20)));
  return { page, limit, skip: (page - 1) * limit };
}

function makeSearch(search) {
  if (typeof search !== "string" || !search.trim()) return null;
  const escaped = search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}

async function getCustomers(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const expression = makeSearch(req.query.search);
    const filter = { role: "user" };
    if (expression) filter.$or = [{ name: expression }, { email: expression }];
    const [customers, total] = await Promise.all([
      User.find(filter).select("name email phone locality active createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return res.json({ customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

async function updateUserStatus(req, res, next) {
  try {
    if (typeof req.body?.active !== "boolean") return res.status(400).json({ message: "Active must be a boolean." });
    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, role: { $in: ["user", "pharmacy"] } },
      { $set: { active: req.body.active } },
      { returnDocument: "after" }
    ).select("name email role active");
    if (!user) return res.status(404).json({ message: "Customer or pharmacy account not found." });
    return res.json({ user });
  } catch (error) { return next(error); }
}

async function getPharmacies(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const expression = makeSearch(req.query.search);
    const filter = {};
    if (expression) filter.$or = [{ name: expression }, { address: expression }, { locality: expression }];
    const [shops, total] = await Promise.all([
      MedicalShop.find(filter).populate("owner", "name email active").sort({ createdAt: -1 }).skip(skip).limit(limit),
      MedicalShop.countDocuments(filter),
    ]);
    return res.json({ pharmacies: shops, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

async function getMedicines(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const expression = makeSearch(req.query.search);
    const filter = {};
    if (expression) filter.$or = [{ name: expression }, { description: expression }];
    const [medicines, total] = await Promise.all([
      Medicine.find(filter).populate("shop", "name address").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Medicine.countDocuments(filter),
    ]);
    return res.json({ medicines, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

async function updatePharmacyStatus(req, res, next) {
  try {
    if (typeof req.body?.active !== "boolean") return res.status(400).json({ message: "Active must be a boolean." });
    const shop = await MedicalShop.findByIdAndUpdate(
      req.params.shopId,
      { $set: { active: req.body.active } },
      { returnDocument: "after", runValidators: true }
    ).populate("owner", "name email active");
    if (!shop) return res.status(404).json({ message: "Pharmacy location not found." });
    return res.json({ pharmacy: shop });
  } catch (error) { return next(error); }
}

async function getOrders(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filter = {};
    if (["pending", "confirmed", "ready", "completed", "cancelled"].includes(req.query.status)) filter.status = req.query.status;
    const [orders, total] = await Promise.all([
      Order.find(filter).populate("user", "name email").populate("shop", "name address").populate("items.medicine", "name")
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);
    return res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

async function getFeedback(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const [feedback, total] = await Promise.all([
      Feedback.find().populate("user", "name email").populate("shop", "name")
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments(),
    ]);
    return res.json({ feedback, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

module.exports = { getSummary, getCustomers, updateUserStatus, getPharmacies, getMedicines, updatePharmacyStatus, getOrders, getFeedback };

const MedicalShop = require("../models/MedicalShop");
const Medicine = require("../models/Medicine");
const Order = require("../models/Order");
const Prescription = require("../models/Prescription");

async function createOrder(req, res, next) {
  const decremented = [];
  try {
    const { shop, items } = req.body || {};
    if (!shop || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "A pharmacy and at least one medicine are required." });
    }

    const quantities = new Map();
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.medicine || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Each order item needs a valid medicine and quantity." });
      }
      quantities.set(item.medicine, (quantities.get(item.medicine) || 0) + quantity);
    }

    const medicines = await Medicine.find({ _id: { $in: [...quantities.keys()] }, shop });
    if (medicines.length !== quantities.size) {
      return res.status(400).json({ message: "All medicines in an order must belong to the selected pharmacy." });
    }

    const orderItems = medicines.map((medicine) => ({
      medicine: medicine.id,
      quantity: quantities.get(medicine.id),
      unitPrice: medicine.price,
    }));
    const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    for (const item of orderItems) {
      const result = await Medicine.updateOne(
        { _id: item.medicine, shop, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        await Promise.all(decremented.map(({ medicine, quantity }) =>
          Medicine.updateOne({ _id: medicine }, { $inc: { stock: quantity } })
        ));
        return res.status(409).json({ message: "There is not enough stock to complete this order." });
      }
      decremented.push({ medicine: item.medicine, quantity: item.quantity });
    }

    const order = await Order.create({ user: req.user.id, shop, items: orderItems, total });
    return res.status(201).json({ order });
  } catch (error) {
    if (decremented.length) {
      await Promise.all(decremented.map(({ medicine, quantity }) =>
        Medicine.updateOne({ _id: medicine }, { $inc: { stock: quantity } })
      )).catch(() => {});
    }
    return next(error);
  }
}

async function getPharmacyOrders(req, res, next) {
  try {
    const shopFilter = req.user.role === "admin" ? {} : { owner: req.user.id };
    const shops = await MedicalShop.find(shopFilter).select("_id");
    const orders = await Order.find({ shop: { $in: shops.map((shop) => shop.id) } })
      .populate("user", "name email")
      .populate("shop", "name")
      .populate("items.medicine", "name")
      .populate("prescription", "originalName mimeType size")
      .sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    const nextStatuses = {
      pending: ["confirmed"],
      confirmed: ["ready"],
      ready: ["completed"],
      completed: [],
      cancelled: [],
    };
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });

    const shop = await MedicalShop.findById(order.shop);
    if (!shop || (req.user.role !== "admin" && shop.owner.toString() !== req.user.id)) {
      return res.status(403).json({ message: "You can only manage orders for your pharmacy." });
    }
    if (!nextStatuses[order.status]?.includes(status)) {
      return res.status(400).json({ message: "This order status transition is not allowed." });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order.id, status: order.status },
      { $set: { status } },
      { returnDocument: "after" }
    ).populate("user", "name email").populate("shop", "name");
    if (!updatedOrder) {
      return res.status(409).json({ message: "This order was updated by another user. Refresh and try again." });
    }
    return res.json({ order: updatedOrder });
  } catch (error) {
    return next(error);
  }
}

async function getPharmacyPrescriptions(req, res, next) {
  try {
    const shops = await MedicalShop.find({ owner: req.user.id }).select("_id");
    const prescriptions = await Prescription.find({ shop: { $in: shops.map((shop) => shop.id) } })
      .select("originalName mimeType size order user shop createdAt")
      .populate("order", "status createdAt total")
      .populate("user", "name")
      .populate("shop", "name")
      .sort({ createdAt: -1 });
    return res.json({ prescriptions });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createOrder, getPharmacyOrders, getPharmacyPrescriptions, updateOrderStatus };
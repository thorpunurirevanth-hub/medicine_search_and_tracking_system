const path = require("path");
const MedicalShop = require("../models/MedicalShop");
const Medicine = require("../models/Medicine");
const { deletePrivateFile, readPrivateFile, savePrivateFile } = require("../services/fileStorage");

const medicineImageTypes = ["image/jpeg", "image/png", "image/webp"];

async function searchMedicines(req, res, next) {
  try {
    const filter = {};
    const activeShopIds = await MedicalShop.find({ active: { $ne: false } }).distinct("_id");
    filter.shop = { $in: activeShopIds };
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const search = req.query.search.trim().slice(0, 100);
      const literalSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: literalSearch, $options: "i" };
    }
    if (typeof req.query.shop === "string" && req.query.shop) {
      filter.shop.$in = activeShopIds.filter((shopId) => shopId.toString() === req.query.shop);
    }

    const sort = req.query.sort === "recent" ? { createdAt: -1 } : { name: 1 };
    const [medicines, availableCount] = await Promise.all([
      Medicine.find(filter)
        .populate("shop", "name address phone")
        .sort(sort)
        .limit(50),
      Medicine.countDocuments({ ...filter, stock: { $gt: 0 } }),
    ]);
    return res.json({ medicines, availableCount });
  } catch (error) {
    return next(error);
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getShops(req, res, next) {
  try {
    const filter = { active: { $ne: false } };
    if (typeof req.query.locality === "string" && req.query.locality.trim()) {
      filter.$or = [
        { locality: { $regex: escapeRegex(req.query.locality.trim().slice(0, 100)), $options: "i" } },
        { address: { $regex: escapeRegex(req.query.locality.trim().slice(0, 100)), $options: "i" } },
      ];
    }
    const shops = await MedicalShop.find(filter).select("name address phone locality location").sort({ name: 1 });
    return res.json({ shops });
  } catch (error) {
    return next(error);
  }
}

function distanceInKm(fromLatitude, fromLongitude, latitude, longitude) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(latitude - fromLatitude);
  const longitudeDelta = radians(longitude - fromLongitude);
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(fromLatitude)) * Math.cos(radians(latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

async function findNearbyShops(req, res, next) {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    const shops = await MedicalShop.find({
      active: { $ne: false },
      "location.latitude": { $exists: true, $ne: null },
      "location.longitude": { $exists: true, $ne: null },
    }).select("name address phone locality location");
    const nearby = shops.map((shop) => {
      const shopData = shop.toObject();
      shopData.distanceKm = distanceInKm(latitude, longitude, shop.location.latitude, shop.location.longitude);
      return shopData;
    }).filter((shop) => shop.distanceKm <= 50)
      .sort((left, right) => left.distanceKm - right.distanceKm);

    return res.json({ shops: nearby });
  } catch (error) {
    return next(error);
  }
}

async function getInventory(req, res, next) {
  try {
    const shopFilter = req.user.role === "admin" ? {} : { owner: req.user.id };
    const shops = await MedicalShop.find(shopFilter).sort({ name: 1 });
    const medicines = await Medicine.find({ shop: { $in: shops.map((shop) => shop.id) } })
      .populate("shop", "name address phone")
      .sort({ name: 1 });
    return res.json({ shops, medicines });
  } catch (error) {
    return next(error);
  }
}

async function createShop(req, res, next) {
  try {
    const { name, address, phone, locality, latitude, longitude } = req.body || {};
    if (!name?.trim() || !address?.trim()) {
      return res.status(400).json({ message: "Pharmacy name and address are required." });
    }
    const location = parseLocation(latitude, longitude);
    if (location === null) return res.status(400).json({ message: "Provide both valid coordinates or leave both blank." });
    const shop = await MedicalShop.create({
      name: name.trim(),
      address: address.trim(),
      phone: phone?.trim(),
      locality: locality?.trim() || "",
      ...(location ? { location } : {}),
      owner: req.user.id,
    });
    return res.status(201).json({ shop });
  } catch (error) {
    return next(error);
  }
}

function parseLocation(latitude, longitude) {
  if ((latitude === undefined || latitude === "") && (longitude === undefined || longitude === "")) return undefined;
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90
    || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) return null;
  return { latitude: parsedLatitude, longitude: parsedLongitude };
}

async function updateShop(req, res, next) {
  try {
    const shop = await MedicalShop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: "Pharmacy location not found." });
    if (req.user.role !== "admin" && shop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only manage your pharmacy locations." });
    }

    const { name, address, phone, locality, latitude, longitude } = req.body || {};
    for (const [field, value] of Object.entries({ name, address, phone, locality })) {
      if (value !== undefined) {
        if (typeof value !== "string" || (["name", "address"].includes(field) && !value.trim())) {
          return res.status(400).json({ message: `${field} is invalid.` });
        }
        shop[field] = value.trim();
      }
    }
    if (latitude !== undefined || longitude !== undefined) {
      const location = parseLocation(latitude, longitude);
      if (location === null) return res.status(400).json({ message: "Provide both valid coordinates or leave both blank." });
      if (location) shop.location = location;
      else shop.location = undefined;
    }
    await shop.save();
    return res.json({ shop });
  } catch (error) {
    return next(error);
  }
}

async function addMedicine(req, res, next) {
  try {
    const { name, description, price, stock, shop } = req.body || {};
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (
      !name?.trim() ||
      !shop ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return res.status(400).json({ message: "A medicine name, valid price, and shop are required." });
    }
    const medicalShop = await MedicalShop.findById(shop);
    if (!medicalShop) {
      return res.status(404).json({ message: "The selected pharmacy could not be found." });
    }
    if (req.user.role !== "admin" && medicalShop.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only manage medicines for your pharmacy." });
    }
    const medicine = await Medicine.create({
      name: name.trim(),
      description,
      price: parsedPrice,
      stock: parsedStock,
      shop: medicalShop.id,
    });
    return res.status(201).json({ medicine });
  } catch (error) {
    return next(error);
  }
}

async function updateMedicine(req, res, next) {
  try {
    const medicine = await Medicine.findById(req.params.medicineId);
    if (!medicine) return res.status(404).json({ message: "Medicine not found." });

    const shop = await MedicalShop.findById(medicine.shop);
    if (!shop || (req.user.role !== "admin" && shop.owner.toString() !== req.user.id)) {
      return res.status(403).json({ message: "You can only manage medicines for your pharmacy." });
    }

    const { name, description, price, stock } = req.body || {};
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Medicine name cannot be empty." });
      }
      medicine.name = name.trim();
    }
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: "Price must be a non-negative number." });
      }
      medicine.price = parsedPrice;
    }
    if (stock !== undefined) {
      const parsedStock = Number(stock);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ message: "Stock must be a non-negative whole number." });
      }
      medicine.stock = parsedStock;
    }
    if (description !== undefined) medicine.description = description;

    await medicine.save();
    return res.json({ medicine });
  } catch (error) {
    return next(error);
  }
}

async function deleteMedicine(req, res, next) {
  try {
    const medicine = await Medicine.findById(req.params.medicineId);
    if (!medicine) return res.status(404).json({ message: "Medicine not found." });

    const shop = await MedicalShop.findById(medicine.shop);
    if (!shop || (req.user.role !== "admin" && shop.owner.toString() !== req.user.id)) {
      return res.status(403).json({ message: "You can only manage medicines for your pharmacy." });
    }

    await medicine.deleteOne();
    return res.json({ message: "Medicine removed from inventory." });
  } catch (error) {
    return next(error);
  }
}

async function uploadMedicineImage(req, res, next) {
  let storedFile;
  try {
    if (!req.file) return res.status(400).json({ message: "Choose a JPEG, PNG, or WebP medicine image." });
    const medicine = await Medicine.findById(req.params.medicineId);
    if (!medicine) return res.status(404).json({ message: "Medicine not found." });
    const shop = await MedicalShop.findById(medicine.shop);
    if (!shop || (req.user.role !== "admin" && shop.owner.toString() !== req.user.id)) {
      return res.status(403).json({ message: "You can only manage medicines for your pharmacy." });
    }

    storedFile = await savePrivateFile(req.file.buffer, "medicine-images", medicineImageTypes);
    const previousStorageName = medicine.image?.storageName;
    medicine.image = {
      storageName: storedFile.storageName,
      mimeType: storedFile.mimeType,
      originalName: path.basename(req.file.originalname).slice(0, 180),
    };
    await medicine.save();
    if (previousStorageName) await deletePrivateFile("medicine-images", previousStorageName);
    return res.status(201).json({ imageUrl: `/api/pharmacy/medicines/${medicine.id}/image` });
  } catch (error) {
    if (storedFile) await deletePrivateFile("medicine-images", storedFile.storageName).catch(() => {});
    return next(error);
  }
}

async function getMedicineImage(req, res, next) {
  try {
    const medicine = await Medicine.findById(req.params.medicineId).select("image");
    if (!medicine?.image?.storageName) return res.status(404).json({ message: "Medicine image not found." });
    const { fullPath } = await readPrivateFile("medicine-images", medicine.image.storageName);
    res.set({
      "Content-Type": medicine.image.mimeType,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    });
    return res.sendFile(fullPath);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchMedicines,
  getShops,
  findNearbyShops,
  getInventory,
  createShop,
  updateShop,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicineImage,
  uploadMedicineImage,
};

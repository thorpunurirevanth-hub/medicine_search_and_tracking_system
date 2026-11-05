const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const MedicalShop = require("../models/MedicalShop");
const User = require("../models/User");

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password, role = "user", pharmacy } = req.body || {};
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (!["user", "pharmacy"].includes(role)) {
      return res.status(400).json({ message: "Choose a valid account type." });
    }
    if (role === "pharmacy" && (!pharmacy?.name?.trim() || !pharmacy?.address?.trim())) {
      return res.status(400).json({ message: "Pharmacy name and address are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role,
    });

    if (role === "pharmacy") {
      try {
        await MedicalShop.create({
          name: pharmacy.name.trim(),
          address: pharmacy.address.trim(),
          phone: pharmacy.phone?.trim(),
          owner: user.id,
        });
      } catch (error) {
        await user.deleteOne();
        throw error;
      }
    }

    return res.status(201).json({
      token: createToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || user.active === false || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({
      token: createToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };

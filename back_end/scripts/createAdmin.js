require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_NAME?.trim() || !ADMIN_EMAIL?.trim() || !ADMIN_PASSWORD) {
    throw new Error("MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required.");
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  await mongoose.connect(MONGO_URI);
  try {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
    if (existingUser) {
      existingUser.name = ADMIN_NAME.trim();
      existingUser.password = password;
      existingUser.role = "admin";
      await existingUser.save();
    } else {
      await User.create({ name: ADMIN_NAME.trim(), email, password, role: "admin" });
    }
    console.log(`Administrator account provisioned for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin().catch((error) => {
  console.error("Could not provision administrator:", error.message);
  process.exitCode = 1;
});
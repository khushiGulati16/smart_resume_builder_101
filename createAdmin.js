const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/userModel");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    const email = "Admin@gmail.com";
    const password = "Admin@123";

    let admin = await User.findOne({ email });
    if (admin) {
      console.log("Admin user already exists. Overwriting password and role.");
      admin.password = password;
      admin.role = "admin";
      await admin.save();
    } else {
      admin = await User.create({
        name: "Admin User",
        email: email,
        password: password,
        role: "admin"
      });
    }

    console.log(`Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();

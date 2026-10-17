import User from "../models/user.model.js";
import bcrypt from "bcrypt";

export const seedDatabaseIfEmpty = async () => {
  try {
    // Ensure default Super Admin user exists for initial authentication
    const existingAdmin = await User.findOne({ email: "admin@crm.com" });
    if (!existingAdmin) {
      console.log("🌱 Creating initial default Superadmin account...");
      const hashedPassword = await bcrypt.hash("Admin@1234", 10);
      await User.create({
        name: "Super Admin",
        email: "admin@crm.com",
        password: hashedPassword,
        role: "superadmin",
        isVerified: true
      });
      console.log("✅ Superadmin seeded successfully: admin@crm.com / Admin@1234");
    } else if (existingAdmin.role !== "superadmin") {
      existingAdmin.role = "superadmin";
      await existingAdmin.save();
      console.log("✅ Updated existing admin account to role: 'superadmin'");
    }

    console.log("✅ Database verification complete. Role-based accounts ready.");
  } catch (error) {
    console.error("❌ Seeding verification error:", error.message);
  }
};

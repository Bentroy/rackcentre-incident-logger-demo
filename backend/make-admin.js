// make-admin.js
// Usage: node make-admin.js user@example.com
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const makeUserAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = process.argv[2];
    
    if (!email) {
      console.log("❌ Please provide an email address");
      console.log("Usage: node make-admin.js user@example.com");
      process.exit(1);
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`✅ User ${email} is already an admin`);
      process.exit(0);
    }

    await User.findByIdAndUpdate(user._id, { role: 'admin' });
    
    console.log(`✅ Successfully made ${email} an admin`);
    console.log(`User: ${user.name} (${user.email}) - Role: admin`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

makeUserAdmin();
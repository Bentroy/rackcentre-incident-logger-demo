// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // ✅ Remove deprecated options
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    
    // ✅ More helpful error messages
    if (error.message.includes('IP')) {
      console.log('\n🔍 IP Whitelist Issue Detected:');
      console.log('1. Go to MongoDB Atlas Dashboard');
      console.log('2. Navigate to Network Access');
      console.log('3. Add your current IP address');
      console.log('4. Or add 0.0.0.0/0 to allow all IPs (for development only)');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔍 Authentication Issue:');
      console.log('1. Check your username and password in .env file');
      console.log('2. Make sure the user has proper database permissions');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
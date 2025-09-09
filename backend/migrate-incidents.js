// migrate-incidents.js
// Run this script once to associate existing incidents with users
// Usage: node migrate-incidents.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Incident = require("./models/Incident");
const User = require("./models/User");

// Load environment variables
dotenv.config();

const migrateIncidents = async () => {
  try {
    // ✅ Connect to MongoDB (removed deprecated options)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all incidents without user association
    const incidentsWithoutUser = await Incident.find({ user: { $exists: false } });
    console.log(`Found ${incidentsWithoutUser.length} incidents without user association`);

    if (incidentsWithoutUser.length === 0) {
      console.log("✅ No incidents need migration. All incidents are already associated with users.");
      process.exit(0);
    }

    // Get the first user (you might want to modify this logic)
    const firstUser = await User.findOne();
    
    if (!firstUser) {
      console.log("❌ No users found in database. Please create a user first.");
      process.exit(1);
    }

    console.log(`Associating ${incidentsWithoutUser.length} incidents with user: ${firstUser.name} (${firstUser.email})`);

    // Update all incidents without user association
    const result = await Incident.updateMany(
      { user: { $exists: false } },
      {
        $set: {
          user: firstUser._id,
          userInfo: {
            name: firstUser.name,
            email: firstUser.email
          }
        }
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} incidents`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Enhanced migration that can handle multiple users
const enhancedMigration = async () => {
  try {
    // ✅ Remove deprecated options
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const incidentsWithoutUser = await Incident.find({ user: { $exists: false } });
    console.log(`Found ${incidentsWithoutUser.length} incidents without user association`);

    if (incidentsWithoutUser.length === 0) {
      console.log("✅ No incidents need migration.");
      process.exit(0);
    }

    const allUsers = await User.find().select('name email createdAt');
    console.log(`Found ${allUsers.length} users in database`);

    if (allUsers.length === 0) {
      console.log("❌ No users found. Create users first.");
      process.exit(1);
    }

    if (allUsers.length === 1) {
      // If only one user, assign all incidents to them
      const user = allUsers[0];
      const result = await Incident.updateMany(
        { user: { $exists: false } },
        {
          $set: {
            user: user._id,
            userInfo: {
              name: user.name,
              email: user.email
            }
          }
        }
      );
      console.log(`✅ Assigned ${result.modifiedCount} incidents to ${user.name}`);
    } else {
      // If multiple users, assign to the oldest user (first registered)
      const oldestUser = allUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      
      const result = await Incident.updateMany(
        { user: { $exists: false } },
        {
          $set: {
            user: oldestUser._id,
            userInfo: {
              name: oldestUser.name,
              email: oldestUser.email
            }
          }
        }
      );
      console.log(`✅ Assigned ${result.modifiedCount} incidents to oldest user: ${oldestUser.name}`);
    }

  } catch (error) {
    console.error("❌ Enhanced migration failed:", error);
    
    // ✅ More helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.log("\n🔍 Connection troubleshooting:");
      console.log("1. Check if your MongoDB URI is correct in .env file");
      console.log("2. Verify your internet connection");
      console.log("3. Make sure your MongoDB cluster is running");
      console.log("4. Check if your IP address is whitelisted in MongoDB Atlas");
    }
  } finally {
    await mongoose.connection.close();
  }
};

// Run the migration
enhancedMigration();
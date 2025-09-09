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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

    // Alternative: If you want to prompt which user to associate with
    // You can list all users and let admin choose
    /*
    const allUsers = await User.find().select('name email');
    console.log("Available users:");
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
    });
    // You would then prompt for input and use the selected user
    */

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
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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
      await Incident.updateMany(
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
      console.log(`✅ Assigned all incidents to ${user.name}`);
    } else {
      // If multiple users, you might want to:
      // 1. Assign to the oldest user (first registered)
      const oldestUser = allUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      
      await Incident.updateMany(
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
      console.log(`✅ Assigned all incidents to oldest user: ${oldestUser.name}`);

      // 2. Alternative: Distribute incidents evenly (uncomment if preferred)
      /*
      for (let i = 0; i < incidentsWithoutUser.length; i++) {
        const userIndex = i % allUsers.length;
        const assignedUser = allUsers[userIndex];
        
        await Incident.findByIdAndUpdate(incidentsWithoutUser[i]._id, {
          user: assignedUser._id,
          userInfo: {
            name: assignedUser.name,
            email: assignedUser.email
          }
        });
      }
      console.log("✅ Distributed incidents evenly among all users");
      */
    }

  } catch (error) {
    console.error("❌ Enhanced migration failed:", error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run the migration
enhancedMigration();
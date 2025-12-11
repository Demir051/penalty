import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/penalty');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = '123'; // Will be hashed by pre-save hook
      await existingAdmin.save();
      console.log('Admin password updated successfully!');
      console.log('Username: admin');
      console.log('Password: 123');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@marti.com',
      password: '123', // Will be hashed by pre-save hook
      fullName: 'Admin User',
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: 123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();



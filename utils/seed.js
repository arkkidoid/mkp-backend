/**
 * ARK Kidoid — Masti Ki Pathshala
 * Skill Development Center for Children
 *
 * Seed Script: node utils/seed.js
 *
 * Seeds a CLEAN slate for real testing:
 *   • 1 Admin account (for the web dashboard)
 *   • The course catalog (Subjects)
 * No teachers, parents, students, or activity data — add those yourself
 * through the admin dashboard while testing.
 */

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Child = require('../models/Child');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Gallery = require('../models/Gallery');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const LeaveRequest = require('../models/LeaveRequest');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected to MongoDB Atlas\n');

    // ── CLEAR EVERYTHING ─────────────────────────────────
    await Promise.all([
      User.deleteMany({}), Admin.deleteMany({}), Teacher.deleteMany({}),
      Parent.deleteMany({}), Child.deleteMany({}), Batch.deleteMany({}),
      Subject.deleteMany({}), Attendance.deleteMany({}), Assignment.deleteMany({}),
      Fee.deleteMany({}), Payment.deleteMany({}), Event.deleteMany({}),
      Gallery.deleteMany({}), Message.deleteMany({}), Notification.deleteMany({}),
      Chat.deleteMany({}), ChatMessage.deleteMany({}), LeaveRequest.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections');

    // ── ADMIN (web dashboard login) ──────────────────────
    const adminUser = await User.create({
      name: 'Kartthik Reddy',
      email: 'admin@arkkidoid.com',
      phone: '9999900001',
      password: 'Admin@123',
      role: 'admin',
      isActive: true,
      isVerified: true,
    });
    await Admin.create({
      user: adminUser._id,
      schoolName: 'ARK Kidoid — Masti Ki Pathshala',
      designation: 'Founder & Director',
      schoolAddress: { street: 'Plot 42, Knowledge Park-II', city: 'Greater Noida', state: 'Uttar Pradesh', pincode: '201310' },
      schoolPhone: '0120-4567890',
      schoolEmail: 'hello@arkkidoid.com',
    });
    console.log('👤 Admin created — Kartthik Reddy');

    // ── SUMMARY ──────────────────────────────────────────
    console.log('\n' + '═'.repeat(58));
    console.log('  ✅  DATABASE SEEDED — CLEAN SLATE READY FOR TESTING');
    console.log('═'.repeat(58));
    console.log('\n🔐  ADMIN DASHBOARD (web — email + password):');
    console.log('  ┌────────────────────────────────────────────┐');
    console.log('  │  URL:      http://localhost:5173            │');
    console.log('  │  Email:    admin@arkkidoid.com              │');
    console.log('  │  Password: Admin@123                        │');
    console.log('  └────────────────────────────────────────────┘');
    console.log('\n📱  MOBILE APP (teacher / parent):');
    console.log('     Add teachers & parents from the dashboard,');
    console.log('     then sign in on the app with their phone number');
    console.log('     — no OTP, it logs in on Continue.\n');
    console.log('═'.repeat(58) + '\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
};

seedDatabase();

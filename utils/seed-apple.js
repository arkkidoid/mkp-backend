/**
 * Minimal DEMO data for App Store / Play Store review.
 *   node utils/seed-apple.js
 *
 * Keeps the existing ADMIN + COURSES. Resets other demo-ish data and creates:
 * one teacher, one parent, one batch, two students, and light activity so the
 * reviewer sees real content on both logins.
 *
 *   ADMIN (dashboard): access code — your existing one
 *   TEACHER (app):     9000000001  ·  code 123456
 *   PARENT  (app):     9000000002  ·  code 123456
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
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

const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); return d; };
const monthLabel = () => new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected\n');

    // Keep admin + courses; clear everything else demo-ish
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }),
      Teacher.deleteMany({}), Parent.deleteMany({}), Child.deleteMany({}), Batch.deleteMany({}),
      Attendance.deleteMany({}), Assignment.deleteMany({}), Fee.deleteMany({}), Payment.deleteMany({}),
      Event.deleteMany({}), Gallery.deleteMany({}), Message.deleteMany({}), Notification.deleteMany({}),
      Chat.deleteMany({}), ChatMessage.deleteMany({}), LeaveRequest.deleteMany({}),
    ]);
    console.log('🗑️  Cleared non-admin demo data (kept admin + courses)');

    const admin = await User.findOne({ role: 'admin' });

    // Use an existing course (prefer ROB), else create one
    let course = (await Subject.findOne({ code: 'ROB' })) || (await Subject.findOne({ isActive: true }));
    if (!course) {
      course = await Subject.create({ name: 'Robotics & Coding', code: 'ROB', color: '#3B82F6', icon: 'cpu', monthlyFee: 4000, admissionFee: 500, duration: 'Ongoing', ageGroup: '8-15 yrs', level: 'Beginner', isActive: true });
    }
    console.log(`📚 Using course: ${course.name} (${course.code})`);

    // ── TEACHER ──
    const teacherUser = await User.create({ name: 'Rahul Verma', email: 'demo.teacher@arkkidoid.in', phone: '9000000001', accessCode: '123456', role: 'teacher', isActive: true, isVerified: true });
    const teacherProfile = await Teacher.create({ user: teacherUser._id, employeeId: 'INS001', qualification: 'B.Tech + Robotics Trainer', experience: 6, subjects: [course._id] });

    // ── BATCH (COURSECODE-A) ──
    const batch = await Batch.create({
      name: `${course.code}-A`, subject: course._id, teacher: teacherUser._id,
      location: 'Sector 15 Centre', classroom: 'Lab 1', capacity: 15, academicYear: '2025-26', isActive: true,
      schedule: [{ day: 'Mon', startTime: '16:00', endTime: '17:30' }, { day: 'Wed', startTime: '16:00', endTime: '17:30' }, { day: 'Fri', startTime: '16:00', endTime: '17:30' }],
    });
    teacherProfile.batches = [batch._id]; await teacherProfile.save();
    console.log(`👩‍🏫 Teacher created — 9000000001  ·  batch ${batch.name}`);

    // ── PARENT ──
    const parentUser = await User.create({ name: 'Amit Kumar', email: 'demo.parent@arkkidoid.in', phone: '9000000002', accessCode: '123456', role: 'parent', isActive: true, isVerified: true, address: 'Sector 15, Noida' });
    const parentProfile = await Parent.create({ user: parentUser._id, occupation: 'Software Engineer', children: [] });
    console.log('👨‍👩‍👧 Parent created — 9000000002');

    // ── STUDENTS (2, both in the batch) ──
    const studentDefs = [
      { name: 'Arjun Kumar', dob: '2014-03-15', gender: 'male',   adm: 'MKP-001', bg: 'B+' },
      { name: 'Ananya Kumar', dob: '2016-08-10', gender: 'female', adm: 'MKP-002', bg: 'A+' },
    ];
    const children = [];
    for (const s of studentDefs) {
      const child = await Child.create({
        name: s.name, dateOfBirth: new Date(s.dob), gender: s.gender,
        class: batch.name, section: course.code,
        parent: parentUser._id, batch: batch._id, teacher: teacherUser._id,
        admissionNumber: s.adm, bloodGroup: s.bg, isActive: true, admissionDate: new Date(),
      });
      parentProfile.children.push(child._id);
      batch.children.push(child._id);
      children.push(child);
    }
    await parentProfile.save();
    await batch.save();
    console.log(`👶 ${children.length} Students enrolled (class ${batch.name})`);

    // ── FEES (admission + this month) + one payment ──
    const feeDocs = [];
    for (const child of children) {
      const due = daysFrom(7);
      feeDocs.push({ child: child._id, parent: parentUser._id, title: `${course.name} — Admission Fee`, amount: course.admissionFee || 500, discount: 0, finalAmount: course.admissionFee || 500, dueDate: due, status: 'pending', feeType: 'other' });
      feeDocs.push({ child: child._id, parent: parentUser._id, title: `${course.name} — Fee (${monthLabel()})`, amount: course.monthlyFee || 4000, discount: 0, finalAmount: course.monthlyFee || 4000, dueDate: due, status: 'pending', feeType: 'tuition', month: monthLabel(), academicYear: '2025-26', isRecurring: true });
    }
    const fees = await Fee.insertMany(feeDocs);
    const paid = fees.find(f => f.feeType === 'tuition');
    if (paid) {
      paid.status = 'paid'; paid.paidAmount = paid.finalAmount; paid.paidDate = new Date(); await paid.save();
      await Payment.create({ fee: paid._id, parent: paid.parent, amount: paid.finalAmount, paymentMethod: 'cash', paidAt: new Date(), status: 'success' });
    }
    console.log(`💰 ${fees.length} Fees (1 paid + payment)`);

    // ── ATTENDANCE (last ~8 weekdays incl today) ──
    const attendance = [];
    let added = 0, back = 0;
    while (added < 8) {
      const d = new Date(); d.setDate(d.getDate() - back++); d.setHours(0, 0, 0, 0);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      added++;
      for (const child of children) {
        const r = Math.random();
        const status = r < 0.85 ? 'present' : r < 0.93 ? 'late' : 'absent';
        attendance.push({ child: child._id, batch: batch._id, date: d, status, markedBy: teacherUser._id });
      }
    }
    await Attendance.insertMany(attendance, { ordered: false }).catch(() => {});
    console.log(`📋 ${attendance.length} Attendance records`);

    // ── ASSIGNMENT ──
    await Assignment.create({ title: 'Build a Line-Following Robot', description: 'Wire the IR sensors and program the robot to follow a black line. Demo in next class.', dueDate: daysFrom(7), totalMarks: 25, batch: batch._id, teacher: teacherUser._id });
    console.log('📝 1 Assignment');

    // ── NOTIFICATIONS ──
    await Notification.insertMany([
      { recipient: parentUser._id, sender: teacherUser._id, title: 'New Task: Line-Following Robot', body: 'A new robotics project is due in 7 days.', type: 'assignment', isRead: false },
      { recipient: parentUser._id, sender: admin?._id, title: 'Welcome to ARK Kidoid!', body: 'Thanks for enrolling. Check your child\'s schedule in the app.', type: 'general', isRead: false },
    ]);
    console.log('🔔 2 Notifications');

    // ── EVENT + GALLERY ──
    await Event.create({ title: 'Robotics Showcase 2026', description: 'Students demo their self-built robots. Parents invited!', type: 'competition', startDate: daysFrom(15), endDate: daysFrom(15), location: 'Sector 15 Centre — Main Hall', targetAudience: 'all', createdBy: admin?._id, isActive: true });
    await Gallery.create({ title: 'Robotics Build Day', description: 'Students wiring up their Arduino boards 🤖', batch: batch._id, uploadedBy: teacherUser._id, albumType: 'classroom_moment', isPublished: true, media: [{ url: 'https://picsum.photos/seed/robotics/800/600', type: 'image' }] });
    console.log('📅 1 Event + 🖼️ 1 Gallery');

    // ── CHAT (teacher ↔ parent) ──
    const chat = await Chat.create({ participants: [teacherUser._id, parentUser._id], child: children[0]._id, isActive: true });
    const msgs = [
      { from: parentUser._id, text: 'Hello sir, is Arjun\'s robot ready for the showcase?' },
      { from: teacherUser._id, text: 'Hi Amit ji! Yes, it runs smoothly now — he fixed the sensor himself 😊' },
      { from: parentUser._id, text: 'Wonderful! What time should we arrive?' },
      { from: teacherUser._id, text: 'Please come by 1:30 PM. Arjun presents around 2:20 PM.' },
    ];
    let last;
    for (let i = 0; i < msgs.length; i++) {
      last = await ChatMessage.create({ chat: chat._id, sender: msgs[i].from, type: 'text', content: msgs[i].text, createdAt: new Date(Date.now() - (msgs.length - i) * 15 * 60000) });
    }
    await Chat.findByIdAndUpdate(chat._id, { lastMessage: last._id, lastMessageAt: last.createdAt, [`unreadCount.${parentUser._id}`]: 1 });
    console.log('💬 1 Chat thread');

    console.log('\n' + '═'.repeat(56));
    console.log('  ✅  DEMO DATA READY — for App Store / Play review');
    console.log('═'.repeat(56));
    console.log('\n📱  MOBILE APP (phone number + access code):');
    console.log('     TEACHER →  9000000001   ·  code 123456');
    console.log('     PARENT  →  9000000002   ·  code 123456');
    console.log('\n🔐  ADMIN DASHBOARD:  https://admin.mastikipaathshaala.org');
    console.log('     (your existing admin access code)\n');
    console.log('═'.repeat(56) + '\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Demo seed failed:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
};

run();

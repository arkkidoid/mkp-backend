/**
 * ARK Kidoid — DEMO seed for store review / manual testing.
 *   node utils/seed-demo.js
 *
 * Creates a small but COMPLETE dataset so every feature is testable:
 * admin, one teacher, two parents, students, courses (with fees), batches
 * (COURSECODE-LABEL), attendance history, fees, a payment, assignments,
 * notifications, an event, gallery moments and a chat thread.
 *
 *   ADMIN (dashboard): admin@arkkidoid.com / Admin@123
 *   TEACHER (app):     9000000001
 *   PARENT  (app):     9000000002   (and 9000000003)
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

const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); return d; };
const monthLabel = () => new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected to MongoDB Atlas\n');

    await Promise.all([
      User.deleteMany({}), Admin.deleteMany({}), Teacher.deleteMany({}),
      Parent.deleteMany({}), Child.deleteMany({}), Batch.deleteMany({}),
      Subject.deleteMany({}), Attendance.deleteMany({}), Assignment.deleteMany({}),
      Fee.deleteMany({}), Payment.deleteMany({}), Event.deleteMany({}),
      Gallery.deleteMany({}), Message.deleteMany({}), Notification.deleteMany({}),
      Chat.deleteMany({}), ChatMessage.deleteMany({}), LeaveRequest.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections');

    // ── COURSES (with fees) ──────────────────────────────
    const [rob, chess, art] = await Subject.insertMany([
      { name: 'Robotics & Coding', code: 'ROB',   color: '#3B82F6', icon: 'cpu',     monthlyFee: 4500, admissionFee: 2000, duration: 'Ongoing', ageGroup: '8-15 yrs', level: 'Beginner', isActive: true },
      { name: 'Chess',             code: 'CHESS', color: '#10B981', icon: 'grid',    monthlyFee: 2000, admissionFee: 1000, duration: 'Ongoing', ageGroup: '5-15 yrs', level: 'All', isActive: true },
      { name: 'Art & Craft',       code: 'ART',   color: '#EC4899', icon: 'palette', monthlyFee: 2500, admissionFee: 800,  duration: 'Ongoing', ageGroup: '4-12 yrs', level: 'Beginner', isActive: true },
    ]);
    console.log('📚 3 Courses created (ROB, CHESS, ART) with fees');

    // ── ADMIN ────────────────────────────────────────────
    const adminUser = await User.create({ name: 'Kartthik Reddy', email: 'admin@arkkidoid.com', phone: '9999900001', password: 'Admin@123', role: 'admin', isActive: true, isVerified: true });
    await Admin.create({ user: adminUser._id, schoolName: 'ARK Kidoid — Masti Ki Paathshaala', designation: 'Founder & Director', schoolPhone: '0120-4567890', schoolEmail: 'hello@arkkidoid.com' });
    console.log('👤 Admin created');

    // ── TEACHER ──────────────────────────────────────────
    const teacherUser = await User.create({ name: 'Rahul Verma', email: 'rahul@arkkidoid.com', phone: '9000000001', accessCode: '123456', role: 'teacher', isActive: true, isVerified: true });
    const teacherProfile = await Teacher.create({ user: teacherUser._id, employeeId: 'INS001', qualification: 'B.Tech + Robotics Trainer', experience: 6, subjects: [rob._id, chess._id] });
    console.log('👩‍🏫 Teacher created — 9000000001');

    // ── BATCHES (COURSECODE-LABEL) ───────────────────────
    const robA = await Batch.create({ name: 'ROB-A', subject: rob._id, teacher: teacherUser._id, location: 'Sector 15 Centre', classroom: 'Lab 1', capacity: 15, academicYear: '2025-26', isActive: true, schedule: [{ day: 'Mon', startTime: '16:00', endTime: '17:30' }, { day: 'Wed', startTime: '16:00', endTime: '17:30' }, { day: 'Fri', startTime: '16:00', endTime: '17:30' }] });
    const chessA = await Batch.create({ name: 'CHESS-A', subject: chess._id, teacher: teacherUser._id, location: 'Sector 15 Centre', classroom: 'Activity Hall', capacity: 20, academicYear: '2025-26', isActive: true, schedule: [{ day: 'Tue', startTime: '17:00', endTime: '18:00' }, { day: 'Thu', startTime: '17:00', endTime: '18:00' }] });
    teacherProfile.batches = [robA._id, chessA._id]; await teacherProfile.save();
    console.log('📦 2 Batches created — ROB-A, CHESS-A');

    // ── PARENTS ──────────────────────────────────────────
    const p1u = await User.create({ name: 'Amit Kumar', email: 'amit@example.com', phone: '9000000002', accessCode: '123456', role: 'parent', isActive: true, isVerified: true, address: 'Sector 15, Noida' });
    const p1 = await Parent.create({ user: p1u._id, occupation: 'Software Engineer', children: [] });
    const p2u = await User.create({ name: 'Priya Sharma', email: 'priya@example.com', phone: '9000000003', accessCode: '123456', role: 'parent', isActive: true, isVerified: true, address: 'Sector 18, Noida' });
    const p2 = await Parent.create({ user: p2u._id, occupation: 'Doctor', children: [] });
    console.log('👨‍👩‍👧 2 Parents created — 9000000002, 9000000003');

    // ── STUDENTS (class = batch name) ────────────────────
    const studentDefs = [
      { name: 'Arjun Kumar',  dob: '2014-03-15', gender: 'male',   parent: p1u, prof: p1, batch: robA,   adm: 'ARK-001', bg: 'B+' },
      { name: 'Ananya Kumar', dob: '2016-08-10', gender: 'female', parent: p1u, prof: p1, batch: chessA, adm: 'ARK-002', bg: 'A+' },
      { name: 'Riya Sharma',  dob: '2015-07-22', gender: 'female', parent: p2u, prof: p2, batch: robA,   adm: 'ARK-003', bg: 'O+' },
      { name: 'Kabir Sharma', dob: '2017-12-18', gender: 'male',   parent: p2u, prof: p2, batch: chessA, adm: 'ARK-004', bg: 'A-' },
      { name: 'Dev Mehta',    dob: '2015-11-30', gender: 'male',   parent: p1u, prof: p1, batch: robA,   adm: 'ARK-005', bg: 'AB+' },
    ];
    const batchCourse = new Map([[robA._id.toString(), rob], [chessA._id.toString(), chess]]);
    const students = [];
    for (const s of studentDefs) {
      const course = batchCourse.get(s.batch._id.toString());
      const child = await Child.create({
        name: s.name, dateOfBirth: new Date(s.dob), gender: s.gender,
        class: s.batch.name,       // e.g. "ROB-A"
        section: course.code,      // e.g. "ROB"
        parent: s.parent._id, batch: s.batch._id, teacher: teacherUser._id,
        admissionNumber: s.adm, bloodGroup: s.bg, isActive: true, admissionDate: new Date(),
      });
      s.prof.children.push(child._id);
      s.batch.children.push(child._id);
      students.push({ child, def: s, course });
    }
    await p1.save(); await p2.save();
    await robA.save(); await chessA.save();
    console.log(`👶 ${students.length} Students enrolled`);

    // ── FEES (admission + this month) + one payment ──────
    const feeDocs = [];
    for (const { child, course } of students) {
      const due = daysFrom(7);
      feeDocs.push({ child: child._id, parent: child.parent, title: `${course.name} — Admission Fee`, amount: course.admissionFee, discount: 0, finalAmount: course.admissionFee, dueDate: due, status: 'pending', feeType: 'other' });
      feeDocs.push({ child: child._id, parent: child.parent, title: `${course.name} — Fee (${monthLabel()})`, amount: course.monthlyFee, discount: 0, finalAmount: course.monthlyFee, dueDate: due, status: 'pending', feeType: 'tuition', month: monthLabel(), academicYear: '2025-26', isRecurring: true });
    }
    const fees = await Fee.insertMany(feeDocs);
    // Mark the first monthly fee paid + record a payment (so revenue shows)
    const monthlyFee = fees.find(f => f.feeType === 'tuition');
    if (monthlyFee) {
      monthlyFee.status = 'paid'; monthlyFee.paidAmount = monthlyFee.finalAmount; monthlyFee.paidDate = new Date();
      await monthlyFee.save();
      await Payment.create({ fee: monthlyFee._id, parent: monthlyFee.parent, amount: monthlyFee.finalAmount, paymentMethod: 'cash', paidAt: new Date(), status: 'success' });
    }
    console.log(`💰 ${fees.length} Fees created (1 paid + payment recorded)`);

    // ── ATTENDANCE (last ~12 weekdays incl. today) ───────
    const groups = [{ batch: robA, kids: students.filter(s => s.def.batch === robA) }, { batch: chessA, kids: students.filter(s => s.def.batch === chessA) }];
    const attendance = [];
    let added = 0, back = 0;
    while (added < 12) {
      const d = new Date(); d.setDate(d.getDate() - back++); d.setHours(0, 0, 0, 0);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      added++;
      for (const g of groups) {
        for (const s of g.kids) {
          const r = Math.random();
          const status = r < 0.82 ? 'present' : r < 0.92 ? 'late' : 'absent';
          attendance.push({ child: s.child._id, batch: g.batch._id, date: d, status, markedBy: teacherUser._id });
        }
      }
    }
    await Attendance.insertMany(attendance, { ordered: false }).catch(() => {});
    console.log(`📋 ${attendance.length} Attendance records (12 weekdays)`);

    // ── ASSIGNMENTS ──────────────────────────────────────
    await Assignment.insertMany([
      { title: 'Build a Line-Following Robot', description: 'Wire the IR sensors and program the robot to follow a black line. Demo next class.', dueDate: daysFrom(7), totalMarks: 25, batch: robA._id, teacher: teacherUser._id },
      { title: 'Chess Puzzle Sheet — 10 Tactics', description: 'Solve all 10 puzzles. Find the best move for White in each position.', dueDate: daysFrom(4), totalMarks: 10, batch: chessA._id, teacher: teacherUser._id },
    ]);
    console.log('📝 2 Assignments created');

    // ── NOTIFICATIONS ────────────────────────────────────
    await Notification.insertMany([
      { recipient: p1u._id, sender: teacherUser._id, title: 'New Task: Line-Following Robot', body: 'A new robotics project is due in 7 days.', type: 'assignment', isRead: false },
      { recipient: p1u._id, sender: adminUser._id, title: 'Fee Reminder', body: `Your ${monthLabel()} fee is due soon.`, type: 'fee', isRead: false },
      { recipient: p2u._id, sender: adminUser._id, title: 'Welcome to ARK Kidoid!', body: 'Thanks for enrolling. Check your child\'s schedule in the app.', type: 'general', isRead: false },
    ]);
    console.log('🔔 3 Notifications created');

    // ── EVENT + GALLERY ──────────────────────────────────
    await Event.create({ title: 'Robotics Showcase 2026', description: 'Students demo their self-built robots. Parents invited!', type: 'competition', startDate: daysFrom(15), endDate: daysFrom(15), location: 'Sector 15 Centre — Main Hall', targetAudience: 'all', createdBy: adminUser._id, isActive: true });
    await Gallery.create({ title: 'Robotics Build Day', description: 'Students wiring up their Arduino boards 🤖', batch: robA._id, uploadedBy: teacherUser._id, albumType: 'classroom_moment', isPublished: true, media: [{ url: 'https://picsum.photos/seed/robotics/800/600', type: 'image' }] });
    console.log('📅 1 Event + 🖼️ 1 Gallery item created');

    // ── CHAT (teacher ↔ parent) ──────────────────────────
    const chat = await Chat.create({ participants: [teacherUser._id, p1u._id], child: students[0].child._id, isActive: true });
    const msgs = [
      { from: p1u._id, text: 'Hello sir, is Arjun\'s robot ready for the showcase?' },
      { from: teacherUser._id, text: 'Hi Amit ji! Yes, it runs smoothly now — he fixed the sensor himself 😊' },
      { from: p1u._id, text: 'Wonderful! What time should we arrive?' },
      { from: teacherUser._id, text: 'Please come by 1:30 PM. Arjun presents around 2:20 PM.' },
    ];
    let last;
    for (let i = 0; i < msgs.length; i++) {
      last = await ChatMessage.create({ chat: chat._id, sender: msgs[i].from, type: 'text', content: msgs[i].text, createdAt: new Date(Date.now() - (msgs.length - i) * 15 * 60000) });
    }
    await Chat.findByIdAndUpdate(chat._id, { lastMessage: last._id, lastMessageAt: last.createdAt, [`unreadCount.${p1u._id}`]: 1 });
    console.log('💬 1 Chat thread seeded');

    // ── SUMMARY ──────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('  ✅  DEMO DATA READY — for store review & testing');
    console.log('═'.repeat(60));
    console.log('\n🔐  ADMIN (web dashboard):');
    console.log('     admin@arkkidoid.com  /  Admin@123');
    console.log('\n📱  MOBILE APP (phone number + access code 123456):');
    console.log('     TEACHER  →  9000000001   ·  code 123456   (Rahul Verma)');
    console.log('     PARENT   →  9000000002   ·  code 123456   (Amit Kumar — 3 kids)');
    console.log('     PARENT   →  9000000003   ·  code 123456   (Priya Sharma — 2 kids)');
    console.log('\n' + '═'.repeat(60) + '\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Demo seed failed:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
};

run();

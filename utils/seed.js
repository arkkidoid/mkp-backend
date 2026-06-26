/**
 * ARK Kidoid — Masti Ki Pathshala
 * Skill Development Center for Children
 *
 * Seed Script: node utils/seed.js
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

// ── helpers ──────────────────────────────────────────────
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(10, 0, 0, 0); return d; };
const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(9,  0, 0, 0); return d; };
const randomAttendance = () => { const r = Math.random(); return r < 0.78 ? 'present' : r < 0.91 ? 'late' : 'absent'; };

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 Connected to MongoDB Atlas\n');

    // ── CLEAR ────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}), Admin.deleteMany({}), Teacher.deleteMany({}),
      Parent.deleteMany({}), Child.deleteMany({}), Batch.deleteMany({}),
      Subject.deleteMany({}), Attendance.deleteMany({}), Assignment.deleteMany({}),
      Fee.deleteMany({}), Payment.deleteMany({}), Event.deleteMany({}),
      Gallery.deleteMany({}), Message.deleteMany({}), Notification.deleteMany({}),
      Chat.deleteMany({}), ChatMessage.deleteMany({}), LeaveRequest.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections');

    // ── COURSES (Subjects) ───────────────────────────────
    const courses = await Subject.insertMany([
      { name: 'Robotics & Electronics',         code: 'ROB',  color: '#E53935', icon: 'cpu',          isActive: true },
      { name: 'STEM Coding (Scratch & Python)',  code: 'CODE', color: '#1E88E5', icon: 'code',         isActive: true },
      { name: 'Chess — Strategy & Thinking',    code: 'CHESS',color: '#43A047', icon: 'grid',          isActive: true },
      { name: 'Abacus & Mental Arithmetic',     code: 'ABAC', color: '#FB8C00', icon: 'calculator',    isActive: true },
      { name: 'Vedic Mathematics',              code: 'VED',  color: '#8E24AA', icon: 'infinity',      isActive: true },
      { name: 'Public Speaking & Personality',  code: 'PS',   color: '#00ACC1', icon: 'mic',           isActive: true },
      { name: 'Art & Craft',                    code: 'ART',  color: '#F4511E', icon: 'palette',       isActive: true },
      { name: "Rubik's Cube Mastery",           code: 'RUB',  color: '#FFB300', icon: 'cube',          isActive: true },
      { name: 'Computer Fundamentals',          code: 'COMP', color: '#6D4C41', icon: 'monitor',       isActive: true },
      { name: 'Teacher Training Program',       code: 'TTP',  color: '#546E7A', icon: 'book-open',     isActive: true },
    ]);

    const [robCourse, codeCourse, chessCourse, abacCourse, vedCourse,
           psCourse, artCourse, rubCourse, compCourse, ttpCourse] = courses;

    console.log('📚 10 Courses created (Robotics, Coding, Chess, Abacus, Vedic Math, Public Speaking, Art, Rubik\'s Cube, Computer, TTP)');

    // ── ADMIN ────────────────────────────────────────────
    const adminUser = await User.create({
      name: 'Chirag Luhach',
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
    console.log('👤 Admin (Director) created — Chirag Luhach');

    // ── INSTRUCTORS (Teachers) ───────────────────────────
    const instructorDefs = [
      {
        name: 'Priya Sharma',     email: 'priya.sharma@arkkidoid.com',   phone: '9888800001',
        emp: 'INS001', qual: 'B.Tech (Electronics) + Robotics Certified Trainer',
        exp: 6, spl: 'Robotics, STEM Coding, Electronics Prototyping',
        subs: [robCourse, codeCourse],
      },
      {
        name: 'Rahul Verma',      email: 'rahul.verma@arkkidoid.com',    phone: '9888800002',
        emp: 'INS002', qual: 'FIDE Rated Chess Player (1800+), B.Ed',
        exp: 7, spl: 'Chess Strategy, Tournament Preparation, Cognitive Development',
        subs: [chessCourse, rubCourse],
      },
      {
        name: 'Meera Joshi',      email: 'meera.joshi@arkkidoid.com',    phone: '9888800003',
        emp: 'INS003', qual: 'M.Sc Mathematics, Certified Abacus & Vedic Math Trainer',
        exp: 5, spl: 'Abacus (All Levels), Vedic Mathematics, Mental Arithmetic',
        subs: [abacCourse, vedCourse],
      },
      {
        name: 'Vikram Singh',     email: 'vikram.singh@arkkidoid.com',   phone: '9888800004',
        emp: 'INS004', qual: 'Mass Communication (Gold Medalist), NLP Practitioner',
        exp: 8, spl: 'Public Speaking, Personality Development, Debate & Elocution',
        subs: [psCourse, compCourse],
      },
      {
        name: 'Anjali Kapoor',    email: 'anjali.kapoor@arkkidoid.com',  phone: '9888800005',
        emp: 'INS005', qual: 'BFA (Fine Arts), Certified Art Therapist',
        exp: 4, spl: 'Sketching, Painting, 3D Craft, Origami, Clay Modelling',
        subs: [artCourse, ttpCourse],
      },
    ];

    const instructorUsers = [];
    const instructorProfiles = [];
    for (const t of instructorDefs) {
      const u = await User.create({ name: t.name, email: t.email, phone: t.phone, password: 'Teacher@123', role: 'teacher', isActive: true, isVerified: true });
      const p = await Teacher.create({ user: u._id, employeeId: t.emp, qualification: t.qual, experience: t.exp, specialization: t.spl, subjects: t.subs.map(s => s._id) });
      instructorUsers.push(u);
      instructorProfiles.push(p);
    }
    const [t1u, t2u, t3u, t4u, t5u] = instructorUsers;
    const [t1p, t2p, t3p, t4p, t5p] = instructorProfiles;
    console.log('👩‍🏫 5 Instructors created');

    // ── BATCHES ──────────────────────────────────────────
    const batchDefs = [
      {
        name: 'Robotics — Weekend Batch',
        course: robCourse, teacher: t1u, room: 'Lab 1 (Robotics Studio)',
        cap: 12, days: ['Sat','Sun'], st: '10:00', et: '12:00',
        desc: 'Hands-on robotics using Arduino & Lego Mindstorms. Build line-followers, obstacle avoiders, and IoT devices.',
      },
      {
        name: 'STEM Coding — Batch A (Scratch)',
        course: codeCourse, teacher: t1u, room: 'Lab 2 (Computer Lab)',
        cap: 15, days: ['Mon','Wed','Fri'], st: '16:00', et: '17:30',
        desc: 'Block-based coding with Scratch. Build animations, games, and interactive stories. Ages 7-11.',
      },
      {
        name: 'STEM Coding — Batch B (Python)',
        course: codeCourse, teacher: t1u, room: 'Lab 2 (Computer Lab)',
        cap: 12, days: ['Tue','Thu','Sat'], st: '11:00', et: '12:30',
        desc: 'Text-based programming with Python. Loops, functions, data structures, mini projects. Ages 12+.',
      },
      {
        name: 'Chess — Beginners Batch',
        course: chessCourse, teacher: t2u, room: 'Activity Hall',
        cap: 20, days: ['Mon','Wed','Fri'], st: '17:00', et: '18:00',
        desc: 'Chess from scratch — piece movement, basic tactics, opening principles, simple endgames. Ages 5+.',
      },
      {
        name: 'Chess — Intermediate & Tournament Prep',
        course: chessCourse, teacher: t2u, room: 'Activity Hall',
        cap: 16, days: ['Tue','Thu','Sat'], st: '09:00', et: '11:00',
        desc: 'Advanced openings, middle-game tactics, positional play. FIDE-rated tournament preparation.',
      },
      {
        name: 'Abacus — Level 1 (Beginners)',
        course: abacCourse, teacher: t3u, room: 'Room B1',
        cap: 18, days: ['Mon','Tue','Wed','Thu','Fri'], st: '15:00', et: '16:00',
        desc: 'Foundation abacus: single-digit operations, speed calculation, number visualization. Ages 5-9.',
      },
      {
        name: 'Vedic Math — Speed Calculation',
        course: vedCourse, teacher: t3u, room: 'Room B2',
        cap: 20, days: ['Sat','Sun'], st: '09:00', et: '10:30',
        desc: 'Ancient Vedic sutras for lightning-fast mental calculation. Multiplication, division, squares. Ages 10+.',
      },
      {
        name: 'Public Speaking — Junior Batch',
        course: psCourse, teacher: t4u, room: 'Seminar Room',
        cap: 15, days: ['Mon','Wed','Fri'], st: '18:00', et: '19:00',
        desc: 'Confidence building, storytelling, voice modulation, stage presence. Debate & elocution practice. Ages 8-13.',
      },
      {
        name: "Rubik's Cube — All Ages Weekend",
        course: rubCourse, teacher: t2u, room: 'Activity Hall',
        cap: 25, days: ['Sat','Sun'], st: '11:00', et: '12:00',
        desc: "CFOP Method: solve a standard 3x3 cube. Speed-cubing techniques. Competition prep. Ages 5+.",
      },
      {
        name: 'Art & Craft — Creative Studio',
        course: artCourse, teacher: t5u, room: 'Art Studio',
        cap: 16, days: ['Tue','Thu','Sat'], st: '16:00', et: '17:30',
        desc: 'Sketching, watercolour, clay modelling, origami, mandala art, mixed media. All levels. Ages 6+.',
      },
    ];

    const batches = [];
    for (const b of batchDefs) {
      const batch = await Batch.create({
        name: b.name, subject: b.course._id, teacher: b.teacher._id,
        classroom: b.room, capacity: b.cap, isActive: true, academicYear: '2025-26',
        schedule: b.days.map(day => ({ day, startTime: b.st, endTime: b.et })),
        children: [],
      });
      batches.push(batch);
    }
    const [bROB, bCODE_A, bCODE_B, bCHESS_B, bCHESS_I, bABAC, bVED, bPS, bRUB, bART] = batches;

    // Link batches → instructors
    t1p.batches = [bROB._id, bCODE_A._id, bCODE_B._id]; await t1p.save();
    t2p.batches = [bCHESS_B._id, bCHESS_I._id, bRUB._id]; await t2p.save();
    t3p.batches = [bABAC._id, bVED._id];                  await t3p.save();
    t4p.batches = [bPS._id];                               await t4p.save();
    t5p.batches = [bART._id];                              await t5p.save();

    console.log('📦 10 Course Batches created');

    // ── PARENTS ──────────────────────────────────────────
    const parentDefs = [
      { name: 'Amit Kumar',      email: 'amit.kumar@gmail.com',     phone: '9777700001', occ: 'Software Engineer at Infosys',    addr: '42 Sector-15, Noida' },
      { name: 'Sneha Gupta',     email: 'sneha.gupta@gmail.com',    phone: '9777700002', occ: 'MBBS Doctor, Kailash Hospital',   addr: '7 Civil Lines, Delhi' },
      { name: 'Rohit Mehta',     email: 'rohit.mehta@gmail.com',    phone: '9777700003', occ: 'Entrepreneur / Business Owner',   addr: '88 Model Town, Delhi' },
      { name: 'Pooja Sharma',    email: 'pooja.sharma@gmail.com',   phone: '9777700004', occ: 'School Teacher (English)',        addr: '3 Lajpat Nagar, Delhi' },
      { name: 'Karan Malhotra',  email: 'karan.malhotra@gmail.com', phone: '9777700005', occ: 'CA — Chartered Accountant',       addr: '15 Greater Kailash, Delhi' },
      { name: 'Divya Nair',      email: 'divya.nair@gmail.com',     phone: '9777700006', occ: 'Principal, Lotus Valley School',  addr: '22 Vasant Vihar, Delhi' },
      { name: 'Suresh Patel',    email: 'suresh.patel@gmail.com',   phone: '9777700007', occ: 'Civil Engineer, L&T Projects',    addr: '56 Dwarka Sector-6' },
      { name: 'Anita Singh',     email: 'anita.singh@gmail.com',    phone: '9777700008', occ: 'IAS Officer, Delhi Cadre',        addr: '9 INA Colony, Delhi' },
    ];

    const parentUsers = [];
    const parentProfiles = [];
    for (const p of parentDefs) {
      const u = await User.create({ name: p.name, email: p.email, phone: p.phone, password: 'Parent@123', role: 'parent', isActive: true, isVerified: true, address: p.addr });
      const prof = await Parent.create({ user: u._id, occupation: p.occ, children: [], emergencyContacts: [] });
      parentUsers.push(u);
      parentProfiles.push(prof);
    }
    const [p1u,p2u,p3u,p4u,p5u,p6u,p7u,p8u] = parentUsers;
    const [p1p,p2p,p3p,p4p,p5p,p6p,p7p,p8p] = parentProfiles;
    console.log('👨‍👩‍👧 8 Parents created');

    // ── STUDENTS (Children) ──────────────────────────────
    // class field = skill level | section = course code
    const studentDefs = [
      // Robotics Weekend Batch
      { name: 'Arjun Kumar',     dob: '2014-03-15', gender: 'male',   level: 'Intermediate', course: 'ROB',  parent: p1u, batch: bROB,    teacher: t1u, adm: 'ARK-2025-001', bg: 'B+',  allg: [] },
      { name: 'Riya Gupta',      dob: '2015-07-22', gender: 'female', level: 'Beginner',     course: 'ROB',  parent: p2u, batch: bROB,    teacher: t1u, adm: 'ARK-2025-002', bg: 'O+',  allg: [] },
      // STEM Coding Batch A (Scratch)
      { name: 'Ananya Kumar',    dob: '2016-08-10', gender: 'female', level: 'Beginner',     course: 'CODE', parent: p1u, batch: bCODE_A, teacher: t1u, adm: 'ARK-2025-003', bg: 'A+',  allg: [] },
      { name: 'Dev Mehta',       dob: '2015-11-30', gender: 'male',   level: 'Beginner',     course: 'CODE', parent: p3u, batch: bCODE_A, teacher: t1u, adm: 'ARK-2025-004', bg: 'AB+', allg: ['Pollen'] },
      // STEM Coding Batch B (Python)
      { name: 'Rohan Mehta',     dob: '2012-05-19', gender: 'male',   level: 'Advanced',     course: 'CODE', parent: p3u, batch: bCODE_B, teacher: t1u, adm: 'ARK-2025-005', bg: 'B+',  allg: [] },
      // Chess Beginners
      { name: 'Isha Sharma',     dob: '2017-12-18', gender: 'female', level: 'Beginner',     course: 'CHESS',parent: p4u, batch: bCHESS_B,teacher: t2u, adm: 'ARK-2025-006', bg: 'A-',  allg: [] },
      { name: 'Kabir Malhotra',  dob: '2016-07-04', gender: 'male',   level: 'Beginner',     course: 'CHESS',parent: p5u, batch: bCHESS_B,teacher: t2u, adm: 'ARK-2025-007', bg: 'O+',  allg: [] },
      // Chess Intermediate
      { name: 'Tara Nair',       dob: '2013-02-14', gender: 'female', level: 'Intermediate', course: 'CHESS',parent: p6u, batch: bCHESS_I,teacher: t2u, adm: 'ARK-2025-008', bg: 'B-',  allg: [] },
      { name: 'Veer Nair',       dob: '2011-09-21', gender: 'male',   level: 'Advanced',     course: 'CHESS',parent: p6u, batch: bCHESS_I,teacher: t2u, adm: 'ARK-2025-009', bg: 'A+',  allg: [] },
      // Abacus Level 1
      { name: 'Aditya Patel',    dob: '2018-06-12', gender: 'male',   level: 'Beginner',     course: 'ABAC', parent: p7u, batch: bABAC,   teacher: t3u, adm: 'ARK-2025-010', bg: 'AB-', allg: [] },
      { name: 'Meha Patel',      dob: '2017-10-08', gender: 'female', level: 'Beginner',     course: 'ABAC', parent: p7u, batch: bABAC,   teacher: t3u, adm: 'ARK-2025-011', bg: 'O-',  allg: ['Nuts'] },
      { name: 'Saanvi Singh',    dob: '2016-03-27', gender: 'female', level: 'Intermediate', course: 'ABAC', parent: p8u, batch: bABAC,   teacher: t3u, adm: 'ARK-2025-012', bg: 'A+',  allg: [] },
      // Vedic Math
      { name: 'Aryan Singh',     dob: '2013-09-05', gender: 'male',   level: 'Intermediate', course: 'VED',  parent: p8u, batch: bVED,   teacher: t3u, adm: 'ARK-2025-013', bg: 'B+',  allg: [] },
      // Public Speaking
      { name: 'Sia Malhotra',    dob: '2014-01-20', gender: 'female', level: 'Beginner',     course: 'PS',   parent: p5u, batch: bPS,    teacher: t4u, adm: 'ARK-2025-014', bg: 'A-',  allg: [] },
      // Rubik's Cube
      { name: 'Neil Gupta',      dob: '2015-04-03', gender: 'male',   level: 'Beginner',     course: 'RUB',  parent: p2u, batch: bRUB,   teacher: t2u, adm: 'ARK-2025-015', bg: 'O+',  allg: [] },
      // Art & Craft
      { name: 'Pihu Nair',       dob: '2016-08-30', gender: 'female', level: 'Intermediate', course: 'ART',  parent: p6u, batch: bART,   teacher: t5u, adm: 'ARK-2025-016', bg: 'B+',  allg: [] },
    ];

    const students = [];
    for (const s of studentDefs) {
      const child = await Child.create({
        name: s.name, dateOfBirth: new Date(s.dob), gender: s.gender,
        class: s.level,    // skill level: Beginner / Intermediate / Advanced
        section: s.course, // course code
        parent: s.parent._id, batch: s.batch._id, teacher: s.teacher._id,
        admissionNumber: s.adm, bloodGroup: s.bg, allergies: s.allg,
        isActive: true, admissionDate: new Date('2025-04-01'),
        emergencyContact: { name: s.parent.name, phone: s.parent.phone, relation: 'Parent' },
      });
      students.push(child);
    }

    // Link students → batches
    bROB.children    = [students[0]._id, students[1]._id];                      await bROB.save();
    bCODE_A.children = [students[2]._id, students[3]._id];                      await bCODE_A.save();
    bCODE_B.children = [students[4]._id];                                        await bCODE_B.save();
    bCHESS_B.children= [students[5]._id, students[6]._id];                      await bCHESS_B.save();
    bCHESS_I.children= [students[7]._id, students[8]._id];                      await bCHESS_I.save();
    bABAC.children   = [students[9]._id, students[10]._id, students[11]._id];   await bABAC.save();
    bVED.children    = [students[12]._id];                                        await bVED.save();
    bPS.children     = [students[13]._id];                                        await bPS.save();
    bRUB.children    = [students[14]._id];                                        await bRUB.save();
    bART.children    = [students[15]._id];                                        await bART.save();

    // Link students → parents
    p1p.children = [students[0]._id, students[2]._id];               await p1p.save(); // Amit → Arjun, Ananya
    p2p.children = [students[1]._id, students[14]._id];              await p2p.save(); // Sneha → Riya, Neil
    p3p.children = [students[3]._id, students[4]._id];               await p3p.save(); // Rohit → Dev, Rohan
    p4p.children = [students[5]._id];                                 await p4p.save(); // Pooja → Isha
    p5p.children = [students[6]._id, students[13]._id];              await p5p.save(); // Karan → Kabir, Sia
    p6p.children = [students[7]._id, students[8]._id, students[15]._id]; await p6p.save(); // Divya → Tara, Veer, Pihu
    p7p.children = [students[9]._id, students[10]._id];              await p7p.save(); // Suresh → Aditya, Meha
    p8p.children = [students[11]._id, students[12]._id];             await p8p.save(); // Anita → Saanvi, Aryan

    console.log('👶 16 Students enrolled across courses');

    // ── ATTENDANCE (last 20 weekdays) ────────────────────
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const pastWeekdays = [];
    let checkDay = 1;
    while (pastWeekdays.length < 20) {
      const d = new Date(today);
      d.setDate(today.getDate() - checkDay++);
      if (d.getDay() !== 0 && d.getDay() !== 6) pastWeekdays.push(new Date(d));
    }

    const attendanceRecords = [];
    const batchGroups = [
      { batch: bROB,     teacher: t1u, kids: students.slice(0,2) },
      { batch: bCODE_A,  teacher: t1u, kids: students.slice(2,4) },
      { batch: bCODE_B,  teacher: t1u, kids: [students[4]] },
      { batch: bCHESS_B, teacher: t2u, kids: students.slice(5,7) },
      { batch: bCHESS_I, teacher: t2u, kids: students.slice(7,9) },
      { batch: bABAC,    teacher: t3u, kids: students.slice(9,12) },
      { batch: bVED,     teacher: t3u, kids: [students[12]] },
      { batch: bPS,      teacher: t4u, kids: [students[13]] },
      { batch: bRUB,     teacher: t2u, kids: [students[14]] },
      { batch: bART,     teacher: t5u, kids: [students[15]] },
    ];

    for (const day of pastWeekdays) {
      for (const group of batchGroups) {
        for (const child of group.kids) {
          const status = (child._id.equals(students[1]._id) && Math.random() < 0.25)
            ? 'absent' : randomAttendance();
          attendanceRecords.push({
            child: child._id, batch: group.batch._id, date: day,
            status, markedBy: group.teacher._id,
            remarks: status === 'absent' ? 'Parent notified via call' : undefined,
          });
        }
      }
    }
    await Attendance.insertMany(attendanceRecords, { ordered: false }).catch(() => {});
    console.log(`📋 ${attendanceRecords.length} Attendance records created`);

    // ── ASSIGNMENTS (Course Tasks) ────────────────────────
    const taskDefs = [
      {
        title: 'Build a Line-Following Robot',
        description: 'Using the Arduino kit provided, wire the IR sensors and program the robot to follow a black line on white surface. Demo in next class.',
        batch: bROB, teacher: t1u, dueDate: daysFrom(7), totalMarks: 25,
        instructions: 'Upload code to Arduino. Bring assembled robot for live demo. Marks for code quality + robot performance.',
      },
      {
        title: 'Scratch Game Project — Obstacle Runner',
        description: 'Create a Scratch game where your character must jump over obstacles. Must have: score counter, increasing difficulty, game-over screen.',
        batch: bCODE_A, teacher: t1u, dueDate: daysFrom(10), totalMarks: 20,
        instructions: 'Share Scratch project link via the parent app message. Include your name in the project title.',
      },
      {
        title: 'Python Mini Project — Calculator App',
        description: 'Build a command-line calculator in Python that handles +, -, ×, ÷, and handles division by zero gracefully. Add a "history" feature.',
        batch: bCODE_B, teacher: t1u, dueDate: daysFrom(5), totalMarks: 30,
        instructions: 'Submit .py file via WhatsApp to instructor. Code should be commented. No copy-paste from internet.',
      },
      {
        title: 'Chess Puzzle Sheet — 10 Tactics',
        description: 'Solve all 10 chess puzzles on the sheet given in class. Find the best move for White in each position. Write your answer in algebraic notation.',
        batch: bCHESS_B, teacher: t2u, dueDate: daysFrom(4), totalMarks: 10,
        instructions: 'Bring completed sheet to next class. Attempt independently before asking for hints.',
      },
      {
        title: 'Tournament Game Analysis — 3 Games',
        description: 'Record and annotate 3 of your own games from last week\'s practice. Identify mistakes (? / ??), good moves (!), and write 2-line commentary for each.',
        batch: bCHESS_I, teacher: t2u, dueDate: daysFrom(3), totalMarks: 15,
        instructions: 'Use chess.com game editor or Lichess. Export as PDF and share. Focus on middle-game decisions.',
      },
      {
        title: 'Abacus Level 1 — Speed Test Practice',
        description: 'Practice addition and subtraction of 3-digit numbers on abacus. Complete the 50-question worksheet. Target: finish within 5 minutes.',
        batch: bABAC, teacher: t3u, dueDate: daysFrom(2), totalMarks: 50,
        instructions: 'Time yourself at home using a stopwatch. Write your timing at the top of the sheet. Bring to class for review.',
      },
      {
        title: 'Vedic Math — Nikhilam Sutra Multiplication',
        description: 'Apply Nikhilam Sutra to multiply numbers near 100. Complete the 20 problems on the handout. Show full working for each.',
        batch: bVED, teacher: t3u, dueDate: daysFrom(6), totalMarks: 20,
        instructions: 'No calculators. Show step-by-step working. Practice until you can do each in under 10 seconds mentally.',
      },
      {
        title: 'Self-Introduction Speech — 2 Minutes',
        description: 'Prepare a structured 2-minute self-introduction covering: your name, hobbies, one achievement, and one goal. Deliver confidently in next class.',
        batch: bPS, teacher: t4u, dueDate: daysFrom(5), totalMarks: 10,
        instructions: 'Practise in front of a mirror at home. Record yourself once. Focus on eye contact and clear pronunciation.',
      },
      {
        title: "Rubik's Cube — White Cross in Under 60 Seconds",
        description: "Practice the first step of the CFOP method: forming the white cross on the bottom face. Time yourself and record 5 attempts.",
        batch: bRUB, teacher: t2u, dueDate: daysFrom(3), totalMarks: 5,
        instructions: 'Record your 5 times on the practice sheet. Bring cube to class. Target: sub-60 seconds consistently.',
      },
      {
        title: 'Mandala Art — A4 Size, Freehand',
        description: 'Create a freehand mandala pattern on the A4 sheet provided. Must include at least 5 layers of patterns. Colour with pencil colours or watercolour.',
        batch: bART, teacher: t5u, dueDate: daysFrom(8), totalMarks: 15,
        instructions: 'Use compass and ruler for circles only. All patterns must be drawn freehand. Bring to class; best works displayed in gallery.',
      },
    ];

    const assignments = [];
    for (const a of taskDefs) {
      const asgn = await Assignment.create({
        title: a.title, description: a.description, dueDate: a.dueDate,
        totalMarks: a.totalMarks, instructions: a.instructions,
        batch: a.batch._id, teacher: a.teacher._id,
      });
      assignments.push(asgn);
    }
    console.log('📝 10 Course Assignments created');

    // ── FEES ─────────────────────────────────────────────
    const courseFees = {
      ROB:   { monthly: 4500, annual: 45000 },
      CODE:  { monthly: 3500, annual: 35000 },
      CHESS: { monthly: 2000, annual: 20000 },
      ABAC:  { monthly: 2500, annual: 25000 },
      VED:   { monthly: 2000, annual: 20000 },
      PS:    { monthly: 3000, annual: 30000 },
      RUB:   { monthly: 1500, annual: 15000 },
      ART:   { monthly: 2500, annual: 25000 },
    };

    const feeRecords = [];
    for (const student of students) {
      const course = student.section; // course code
      const fee = courseFees[course] || { monthly: 2500 };

      // June fee — mixed paid/pending
      const juneStatus = Math.random() < 0.55 ? 'paid' : 'pending';
      feeRecords.push({
        child: student._id, parent: student.parent,
        title: `${course} Course Fee — June 2025`,
        description: `Monthly course fee for ${course} batch`,
        amount: fee.monthly, discount: 0, finalAmount: fee.monthly,
        dueDate: new Date('2025-06-05'), status: juneStatus,
        paidAmount: juneStatus === 'paid' ? fee.monthly : 0,
        paidDate: juneStatus === 'paid' ? daysAgo(12) : undefined,
        feeType: 'tuition', academicYear: '2025-26', month: 'June 2025',
      });

      // July fee — all pending
      feeRecords.push({
        child: student._id, parent: student.parent,
        title: `${course} Course Fee — July 2025`,
        amount: fee.monthly, discount: 0, finalAmount: fee.monthly,
        dueDate: new Date('2025-07-05'), status: 'pending', paidAmount: 0,
        feeType: 'tuition', academicYear: '2025-26', month: 'July 2025',
      });

      // Kit / Material fee for Robotics and Art
      if (['ROB', 'ART'].includes(course)) {
        feeRecords.push({
          child: student._id, parent: student.parent,
          title: `${course} Kit & Material Fee`,
          amount: course === 'ROB' ? 2500 : 800, discount: 0,
          finalAmount: course === 'ROB' ? 2500 : 800,
          dueDate: new Date('2025-05-01'), status: 'paid',
          paidAmount: course === 'ROB' ? 2500 : 800,
          paidDate: daysAgo(30), feeType: 'activity',
          academicYear: '2025-26', month: 'April 2025',
        });
      }
    }

    const fees = await Fee.insertMany(feeRecords);
    const paidFees = fees.filter(f => f.status === 'paid');
    const payments = paidFees.map(fee => ({
      fee: fee._id, parent: fee.parent,
      amount: fee.finalAmount,
      paymentMethod: Math.random() < 0.6 ? 'cash' : 'online',
      paidAt: daysAgo(Math.floor(Math.random() * 20) + 1),
      status: 'success',
    }));
    await Payment.insertMany(payments);
    console.log(`💰 ${fees.length} Fee records + ${payments.length} Payments created`);

    // ── EVENTS ───────────────────────────────────────────
    await Event.insertMany([
      {
        title: 'ARK Robotics Showcase 2025',
        description: 'Students demonstrate their self-built robots — line followers, obstacle avoiders, and IoT prototypes. Parents and press invited. Judged by industry experts.',
        type: 'competition', startDate: daysFrom(15), endDate: daysFrom(15),
        location: 'ARK Kidoid Main Hall + Robotics Lab', isAllDay: false, targetAudience: 'all',
        createdBy: adminUser._id, isActive: true,
      },
      {
        title: 'Inter-School Chess Tournament',
        description: 'ARK Kidoid hosts the district-level inter-school chess tournament. 8 schools, 40+ participants. Swiss system, 7 rounds. FIDE-rated.',
        type: 'competition', startDate: daysFrom(22), endDate: daysFrom(23),
        location: 'Activity Hall (20 boards set up)', isAllDay: true, targetAudience: 'all',
        createdBy: adminUser._id, isActive: true,
      },
      {
        title: "Rubik's Cube Speedcubing Competition",
        description: "Open to all ARK Kidoid students. Categories: 3x3 (Under 10 & Open), 2x2, Blindfolded attempt. Prizes for top 3 in each category.",
        type: 'competition', startDate: daysFrom(10), endDate: daysFrom(10),
        location: 'Seminar Room', isAllDay: false, targetAudience: 'all',
        createdBy: adminUser._id, isActive: true,
      },
      {
        title: 'Parent Orientation — New Session Begins',
        description: 'Welcome session for parents of newly enrolled students. Course overview, instructor introductions, expectations, and Q&A. Attendance mandatory.',
        type: 'meeting', startDate: daysFrom(3), endDate: daysFrom(3),
        location: 'Seminar Room + Zoom (hybrid)', isAllDay: false, targetAudience: 'parents',
        createdBy: adminUser._id, isActive: true,
      },
      {
        title: 'Coding Hackathon — "Tech for Good"',
        description: '4-hour hackathon for our Scratch & Python students. Theme: solve a real-world problem using code. Teams of 2-3. Mentored by instructors. Exciting prizes!',
        type: 'competition', startDate: daysFrom(35), endDate: daysFrom(35),
        location: 'Computer Lab (Lab 2)', isAllDay: false, targetAudience: 'all',
        createdBy: adminUser._id, isActive: true,
      },
      {
        title: 'Annual Talent Day — Masti Ki Pathshala',
        description: 'Our biggest annual event! All students perform or showcase their skill — chess demo, robot dance, cube solving, art exhibition, speeches, and coding live demos.',
        type: 'function', startDate: daysFrom(60), endDate: daysFrom(60),
        location: 'ARK Kidoid Campus — All Rooms', isAllDay: true, targetAudience: 'all',
        createdBy: adminUser._id, isActive: true,
      },
    ]);
    console.log('📅 6 Events created');

    // ── GALLERY ──────────────────────────────────────────
    const galleryItems = [
      { title: 'Robotics Class — Line Follower Build Day', desc: 'Students wiring up their Arduino boards and attaching IR sensors. The concentration on their faces says it all! 🤖', batch: bROB,     teacher: t1u, type: 'classroom_moment', seed: 101 },
      { title: 'Chess Match in Progress',                  desc: 'Intense 1-on-1 chess practice between our intermediate students. Rahul sir coaching in the background.', batch: bCHESS_I, teacher: t2u, type: 'classroom_moment', seed: 102 },
      { title: 'Python Code Review Session',               desc: 'Students presenting their first Python projects on screen while the class provides feedback — peer learning at its best!', batch: bCODE_B, teacher: t1u, type: 'classroom_moment', seed: 103 },
      { title: "Rubik's Cube — First Solve Celebration!",  desc: "Neil solved his first Rubik's Cube today 🎉 It took 4 weeks of practice. This moment was PRICELESS!", batch: bRUB,     teacher: t2u, type: 'classroom_moment', seed: 104 },
      { title: 'Abacus Speed Drill',                       desc: '3-digit addition drill on abacus. Meera ma\'am clocking each student. Fastest time today: 45 seconds for 30 problems! ⚡', batch: bABAC,    teacher: t3u, type: 'classroom_moment', seed: 105 },
      { title: 'Public Speaking — Storytelling Round',     desc: 'Sia presenting her story "The Robot and the Moonbeam" with full confidence. Parents would be so proud! 🎤', batch: bPS,      teacher: t4u, type: 'classroom_moment', seed: 106 },
      { title: 'Mandala Art in Progress',                  desc: 'Beautiful freehand mandalas by our Art batch. Every piece is unique — we\'ll display the best ones on our gallery wall!', batch: bART,     teacher: t5u, type: 'activity',         seed: 107 },
      { title: 'Robotics Showcase — Preview Day',          desc: 'Pre-showcase testing day! Students making final adjustments to their robots before the big event on ' + daysFrom(15).toDateString(), batch: bROB, teacher: t1u, type: 'event', seed: 108 },
    ];

    for (const g of galleryItems) {
      await Gallery.create({
        title: g.title, description: g.desc, batch: g.batch._id,
        uploadedBy: g.teacher._id, albumType: g.type, isPublished: true,
        media: [{ url: `https://picsum.photos/seed/${g.seed}/800/600`, type: 'image', caption: g.desc }],
      });
    }
    console.log('🖼️  8 Gallery items created');

    // ── ANNOUNCEMENTS ────────────────────────────────────
    await Message.insertMany([
      {
        title: 'July 2025 Course Fees Due — 5th July',
        body: 'Dear Parents, a gentle reminder that July 2025 course fees are due by 5th July. You can pay at the centre (cash/UPI) or via the payment link shared on WhatsApp. Students with pending fees from June are requested to clear dues at the earliest. Contact the admin for fee concession queries.',
        sender: adminUser._id, senderRole: 'admin', targetType: 'all_parents', priority: 'high', isActive: true,
      },
      {
        title: 'Robotics Showcase — Parent Invitation',
        body: `The ARK Robotics Showcase 2025 is scheduled for ${daysFrom(15).toDateString()} from 2 PM to 5 PM. Your child will be demonstrating their self-built robot to parents and invited guests. Please mark your calendar — attendance is highly encouraged! Refreshments will be served. RSVP to the admin by replying to this message.`,
        sender: adminUser._id, senderRole: 'admin', targetType: 'batch', targetBatches: [bROB._id], priority: 'high', isActive: true,
      },
      {
        title: 'Chess Tournament — Checklist for Participants',
        body: `For students participating in the Inter-School Chess Tournament (${daysFrom(22).toDateString()}): ✅ Reach by 8:30 AM sharp ✅ Bring FIDE ID / school ID ✅ ARK Kidoid T-shirt is mandatory ✅ Water bottle & snacks ✅ No mobile phones during rounds. Rahul sir will give a pre-tournament briefing on Friday.`,
        sender: t2u._id, senderRole: 'teacher', targetType: 'batch', targetBatches: [bCHESS_I._id], priority: 'urgent', isActive: true,
      },
      {
        title: 'Robotics Batch — Arduino Kits Now Available',
        body: 'Great news! The new Arduino Mega kits with ultrasonic sensors, servo motors, and Bluetooth modules have arrived. Students can collect their personal kit box from the lab starting this Saturday. Please label your kit with your name. Additional components available at ₹150 per set.',
        sender: t1u._id, senderRole: 'teacher', targetType: 'batch', targetBatches: [bROB._id], priority: 'normal', isActive: true,
      },
      {
        title: 'Summer Camp Enrollments Open — July 2025',
        body: 'ARK Kidoid\'s much-awaited Summer Skill Camp is back! 2-week intensive programs in: Robotics, Coding, Chess, Vedic Math & Public Speaking. Dates: 15 July – 28 July 2025. Special discount for existing students: ₹500 off per course. Limited seats. Enroll now at the front desk or call 0120-4567890.',
        sender: adminUser._id, senderRole: 'admin', targetType: 'all_parents', priority: 'normal', isActive: true,
      },
    ]);
    console.log('📢 5 Announcements created');

    // ── NOTIFICATIONS ────────────────────────────────────
    const notifs = [];

    // Attendance alert for Riya (who has higher absence rate)
    notifs.push({ recipient: p2u._id, sender: t1u._id, title: 'Attendance Alert — Riya Gupta', body: 'Riya was absent from Robotics class today. Please ensure regular attendance as the Showcase project is in final stages.', type: 'attendance', isRead: false });

    // New assignment notifications
    for (const pu of [p1u, p2u]) {
      notifs.push({ recipient: pu._id, sender: t1u._id, title: 'New Task: Build a Line-Following Robot', body: 'A new robotics project has been assigned. Due in 7 days. Demo required in class.', type: 'assignment', isRead: Math.random() < 0.4 });
    }
    for (const pu of [p1u, p3u]) {
      notifs.push({ recipient: pu._id, sender: t1u._id, title: 'New Task: Scratch Game Project', body: 'Scratch Obstacle Runner game project assigned. Due in 10 days.', type: 'assignment', isRead: false });
    }
    for (const pu of [p2u, p5u, p6u]) {
      notifs.push({ recipient: pu._id, sender: t2u._id, title: 'Chess Puzzle Sheet Assigned', body: '10 chess tactics puzzles due in 4 days. Attempt independently before hints!', type: 'assignment', isRead: Math.random() < 0.5 });
    }

    // Fee reminders
    for (const pu of parentUsers) {
      notifs.push({ recipient: pu._id, sender: adminUser._id, title: 'July Fee Reminder', body: 'Your July 2025 course fee is due by 5th July. Avoid late fee by paying early.', type: 'fee', isRead: Math.random() < 0.3 });
    }

    // Event reminders
    for (const pu of [p1u, p2u]) {
      notifs.push({ recipient: pu._id, sender: adminUser._id, title: 'Robotics Showcase in 15 Days!', body: 'Don\'t miss your child\'s robot demo on ' + daysFrom(15).toDateString() + '. RSVP to admin!', type: 'event', isRead: false });
    }
    for (const pu of parentUsers.slice(0, 5)) {
      notifs.push({ recipient: pu._id, sender: adminUser._id, title: 'Chess Tournament — Register Now', body: 'Inter-School Chess Tournament registrations close this Friday. Contact Rahul sir.', type: 'event', isRead: Math.random() < 0.4 });
    }

    await Notification.insertMany(notifs);
    console.log(`🔔 ${notifs.length} Notifications created`);

    // ── CHAT CONVERSATIONS ───────────────────────────────
    const chatThreads = [
      {
        participants: [t1u._id, p1u._id], child: students[0],
        msgs: [
          { from: 1, text: "Hello Ms. Priya, just wanted to check — is Arjun's robot ready for the showcase? He mentioned some wiring issue last class." },
          { from: 0, text: "Hi Amit ji! Yes, the wiring is sorted now 😊 Arjun fixed the IR sensor alignment himself — he was so determined! The robot runs smoothly now." },
          { from: 1, text: "That's wonderful! He was up till 10 PM practising at home. What time should we arrive for the Showcase?" },
          { from: 0, text: "Please come by 1:30 PM. The student demo slots start at 2 PM. Arjun is 4th in the lineup so he'll present around 2:20 PM." },
          { from: 1, text: "Perfect, we'll be there! Can we bring grandparents as well?" },
          { from: 0, text: "Absolutely! The more the merrier 🎉 We'd love that. See you on showcase day!" },
        ],
      },
      {
        participants: [t2u._id, p6u._id], child: students[8],
        msgs: [
          { from: 1, text: "Good morning Rahul sir. Veer's been practising chess 2 hours daily at home. Is he ready for the tournament?" },
          { from: 0, text: "Good morning Divya ji! Yes, Veer is showing exceptional improvement. His opening repertoire is solid and his middle game has matured a lot." },
          { from: 1, text: "He's been studying the Sicilian Defence all week. Any specific openings you recommend for his age group?" },
          { from: 0, text: "Sicilian is perfect for his playing style. Also ask him to study the King's Indian Defence for when he plays Black. Very fighting chess!" },
          { from: 1, text: "Got it, will pass that on. What's the tournament format?" },
          { from: 0, text: "7-round Swiss system, 25+10 time control. Veer should aim for 5/7 for a podium finish. I'm confident he can do it! 💪" },
        ],
      },
      {
        participants: [t3u._id, p7u._id], child: students[9],
        msgs: [
          { from: 1, text: "Namaskar Meera ma'am. Aditya keeps forgetting the abacus movements at home. Any tips for practice?" },
          { from: 0, text: "Namaskar! That's very common in Level 1. Key tip: practise single-digit friends (5-family and 10-family) for 10 minutes daily. Repetition builds muscle memory." },
          { from: 1, text: "Should he use the physical abacus or can he use the app?" },
          { from: 0, text: "Physical abacus first for at least 2 more weeks. The finger-bead coordination is crucial. App can come later as supplement." },
          { from: 1, text: "Thank you! He did 30 problems today in 6 minutes. That's improvement right?" },
          { from: 0, text: "Amazing progress! 🌟 In Level 1 we aim for 50 problems in 5 minutes by month 3. He's right on track!" },
        ],
      },
      {
        participants: [t4u._id, p5u._id], child: students[13],
        msgs: [
          { from: 1, text: "Hello Vikram sir, Sia is very shy in class according to her. Is she participating in group activities?" },
          { from: 0, text: "Hi Karan ji! Yes, Sia was reserved initially — but in today's storytelling session she spoke for 2.5 minutes without pause! Huge improvement 👏" },
          { from: 1, text: "Wow! She didn't tell us that. We'll celebrate at home tonight 😄" },
          { from: 0, text: "Please do! Encouragement at home amplifies what we build in class. Ask her to perform her speech for the family — builds real-world confidence." },
          { from: 1, text: "Definitely will. She's also been practising in front of the mirror. The assignment she prepared looks impressive." },
          { from: 0, text: "She's one of our rising stars! If she continues at this pace, I'd love to nominate her for our Annual Talent Day 🎤" },
        ],
      },
    ];

    for (const thread of chatThreads) {
      const chat = await Chat.create({ participants: thread.participants, child: thread.child._id, isActive: true });
      let lastMsg;
      for (let i = 0; i < thread.msgs.length; i++) {
        const m = thread.msgs[i];
        const sender = m.from === 0 ? thread.participants[0] : thread.participants[1];
        const msgTime = new Date(Date.now() - (thread.msgs.length - i) * 15 * 60000);
        lastMsg = await ChatMessage.create({ chat: chat._id, sender, type: 'text', content: m.text, createdAt: msgTime });
      }
      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: lastMsg._id, lastMessageAt: lastMsg.createdAt,
        [`unreadCount.${thread.participants[1]}`]: 1,
      });
    }
    console.log('💬 4 Chat conversations seeded (realistic instructor–parent dialogue)');

    // ── LEAVE REQUESTS ───────────────────────────────────
    await LeaveRequest.create({
      teacher: t5u._id, startDate: daysFrom(4), endDate: daysFrom(5),
      reason: 'Attending National Art Educators Conference in Mumbai. Speaking at a session on creative pedagogy.',
      leaveType: 'earned', status: 'approved',
    });
    await LeaveRequest.create({
      teacher: t3u._id, startDate: daysFrom(12), endDate: daysFrom(12),
      reason: 'Sister\'s wedding ceremony — family obligation.',
      leaveType: 'casual', status: 'pending',
    });
    console.log('📤 2 Leave requests created');

    // ── PRINT SUMMARY ────────────────────────────────────
    console.log('\n' + '═'.repeat(65));
    console.log('  ✅  ARK KIDOID — DATABASE SEEDED SUCCESSFULLY');
    console.log('  Masti Ki Pathshala — Skill Development Centre');
    console.log('═'.repeat(65));

    console.log('\n🔐  LOGIN CREDENTIALS\n');
    console.log('  ADMIN (web dashboard — email + password):');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │  URL:      http://localhost:5173             │');
    console.log('  │  Email:    admin@arkkidoid.com               │');
    console.log('  │  Password: Admin@123                         │');
    console.log('  └─────────────────────────────────────────────┘\n');

    console.log('  INSTRUCTORS (mobile — phone OTP, enter 123456):');
    console.log('  ┌──────────────────────────────────────────────────────────┐');
    console.log('  │  9888800001  Priya Sharma   Robotics + Coding (3 batches) │');
    console.log('  │  9888800002  Rahul Verma    Chess + Rubik\'s Cube (3 batch)│');
    console.log('  │  9888800003  Meera Joshi    Abacus + Vedic Math (2 batch) │');
    console.log('  │  9888800004  Vikram Singh   Public Speaking (1 batch)     │');
    console.log('  │  9888800005  Anjali Kapoor  Art & Craft (1 batch)         │');
    console.log('  └──────────────────────────────────────────────────────────┘\n');

    console.log('  PARENTS (mobile — phone OTP, enter 123456):');
    console.log('  ┌────────────────────────────────────────────────────────────────┐');
    console.log('  │  9777700001  Amit Kumar      Arjun (Robotics) + Ananya (Coding)│');
    console.log('  │  9777700002  Sneha Gupta     Riya (Robotics) + Neil (Rubik\'s)  │');
    console.log('  │  9777700003  Rohit Mehta     Dev (Coding/Scratch) + Rohan (Py) │');
    console.log('  │  9777700004  Pooja Sharma    Isha (Chess Beginners)             │');
    console.log('  │  9777700005  Karan Malhotra  Kabir (Chess) + Sia (Public Spk)  │');
    console.log('  │  9777700006  Divya Nair      Tara + Veer (Chess Int.) + Pihu   │');
    console.log('  │  9777700007  Suresh Patel    Aditya + Meha (Abacus)            │');
    console.log('  │  9777700008  Anita Singh     Saanvi + Aryan (Abacus/Vedic)     │');
    console.log('  └────────────────────────────────────────────────────────────────┘');
    console.log('\n  💡 OTP: Always enter 123456 (or any 6-digit code in dev mode)\n');
    console.log('═'.repeat(65) + '\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  }
};

seedDatabase();

/**
 * ARK Kidoid — API Test Suite
 * Run: node utils/test-api.js
 */
const http = require('http');

const BASE = 'http://localhost:5001/api';
let pass = 0, fail = 0;
const tokens = {};
const ids = {};

const req = (method, path, body, token) => new Promise((resolve) => {
  const data = body ? JSON.stringify(body) : null;
  const url = new URL(BASE + path);
  const opts = {
    hostname: url.hostname, port: url.port, path: url.pathname + url.search,
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  };
  const r = http.request(opts, (res) => {
    let raw = '';
    res.on('data', c => raw += c);
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
      catch { resolve({ status: res.statusCode, body: raw }); }
    });
  });
  r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
  if (data) r.write(data);
  r.end();
});

const test = async (label, fn) => {
  try {
    const result = await fn();
    if (result) {
      console.log(`  ✅ ${label}`);
      pass++;
    } else {
      console.log(`  ❌ ${label}`);
      fail++;
    }
  } catch (e) {
    console.log(`  ❌ ${label} — ${e.message}`);
    fail++;
  }
};

const run = async () => {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  ARK KIDOID — API TEST SUITE');
  console.log('══════════════════════════════════════════════════\n');

  // ── HEALTH ──────────────────────────────────────────────
  console.log('[ HEALTH ]');
  await test('Health check returns 200', async () => {
    const r = await req('GET', '/health');
    return r.status === 200 && r.body.success === true;
  });

  // ── AUTH ────────────────────────────────────────────────
  console.log('\n[ AUTH ]');

  await test('Admin email+password login', async () => {
    const r = await req('POST', '/auth/login', { email: 'admin@arkkidoid.com', password: 'Admin@123' });
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    tokens.admin = r.body.data.accessToken;
    ids.adminUser = r.body.data.user._id;
    return r.body.data.user.role === 'admin';
  });

  await test('Send OTP — returns 123456 in dev', async () => {
    const r = await req('POST', '/auth/send-otp', { phone: '9888800001' });
    return r.body.success && r.body.data.otp === '123456';
  });

  await test('Verify OTP with "123456" — teacher login', async () => {
    const r = await req('POST', '/auth/verify-otp', { phone: '9888800001', otp: '123456' });
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    tokens.teacher = r.body.data.accessToken;
    ids.teacherUser = r.body.data.user._id;
    return r.body.data.user.role === 'teacher';
  });

  await test('Verify any 6-digit code — parent login', async () => {
    await req('POST', '/auth/send-otp', { phone: '9777700001' });
    const r = await req('POST', '/auth/verify-otp', { phone: '9777700001', otp: '999999' });
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    tokens.parent = r.body.data.accessToken;
    ids.parentUser = r.body.data.user._id;
    return r.body.data.user.role === 'parent';
  });

  await test('GET /auth/me returns current user', async () => {
    const r = await req('GET', '/auth/me', null, tokens.admin);
    return r.body.success && r.body.data.user.email === 'admin@arkkidoid.com';
  });

  await test('Wrong password is rejected (401 or 400)', async () => {
    const r = await req('POST', '/auth/login', { email: 'admin@arkkidoid.com', password: 'wrongpassword' });
    return r.status === 401 || (r.status === 400 && r.body.success === false);
  });

  await test('No token → 401', async () => {
    const r = await req('GET', '/admin/parents');
    return r.status === 401;
  });

  await test('Parent token on admin route → 403', async () => {
    const r = await req('GET', '/admin/parents', null, tokens.parent);
    return r.status === 403;
  });

  // ── ADMIN APIS ──────────────────────────────────────────
  console.log('\n[ ADMIN — PEOPLE MANAGEMENT ]');

  await test('GET /admin/parents — list all parents', async () => {
    const r = await req('GET', '/admin/parents', null, tokens.admin);
    return r.body.success && Array.isArray(r.body.data) && r.body.data.length >= 8;
  });

  await test('GET /admin/teachers — list all teachers (5 instructors)', async () => {
    const r = await req('GET', '/admin/teachers', null, tokens.admin);
    return r.body.success && r.body.data.length === 5;
  });

  await test('GET /admin/children — list all students (16)', async () => {
    const r = await req('GET', '/admin/children', null, tokens.admin);
    if (!r.body.success) return false;
    ids.childId = r.body.data[0]._id;
    return r.body.data.length === 16;
  });

  await test('GET /admin/batches — list all batches (10)', async () => {
    const r = await req('GET', '/admin/batches', null, tokens.admin);
    if (!r.body.success) return false;
    ids.batchId = r.body.data[0]._id;
    return r.body.data.length === 10;
  });

  await test('GET /admin/subjects — list all courses (10)', async () => {
    const r = await req('GET', '/admin/subjects', null, tokens.admin);
    return r.body.success && r.body.data.length === 10;
  });

  await test('POST /admin/parents — create new parent', async () => {
    const uniq = Date.now().toString().slice(-9); // 9-digit unique suffix
    const r = await req('POST', '/admin/parents', { name: 'Test Parent', phone: `9${uniq}`, email: `test+${uniq}@test.com` }, tokens.admin);
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    ids.newParentId = r.body.data.user._id;
    return r.body.data.user.role === 'parent';
  });

  await test('GET /admin/parents/:id — get single parent', async () => {
    const r = await req('GET', `/admin/parents/${ids.newParentId}`, null, tokens.admin);
    return r.body.success && r.body.data.user._id === ids.newParentId;
  });

  await test('DELETE /admin/parents/:id — deactivate parent', async () => {
    const r = await req('DELETE', `/admin/parents/${ids.newParentId}`, null, tokens.admin);
    return r.body.success;
  });

  await test('GET /admin/dashboard — dashboard stats (16 students)', async () => {
    const r = await req('GET', '/admin/dashboard', null, tokens.admin);
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body).slice(0,200)); return false; }
    return r.body.data.stats.totalChildren === 16;
  });

  // ── TEACHER APIS ────────────────────────────────────────
  console.log('\n[ TEACHER APIS ]');

  await test('GET /teacher/dashboard', async () => {
    const r = await req('GET', '/teacher/dashboard', null, tokens.teacher);
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    return r.body.data.stats !== undefined;
  });

  await test('GET /teacher/batches', async () => {
    const r = await req('GET', '/teacher/batches', null, tokens.teacher);
    if (!r.body.success) return false;
    ids.teacherBatchId = r.body.data[0]?._id;
    return r.body.data.length > 0;
  });

  await test('POST /teacher/attendance — mark bulk attendance', async () => {
    if (!ids.teacherBatchId) return false;
    // Get children in the batch
    const batchR = await req('GET', `/teacher/batches/${ids.teacherBatchId}`, null, tokens.teacher);
    const kids = batchR.body.data?.children || [];
    if (kids.length === 0) return false;

    const records = kids.map(k => ({ childId: k._id, status: 'present' }));
    const r = await req('POST', '/teacher/attendance', {
      batchId: ids.teacherBatchId,
      date: new Date().toISOString(),
      records,
    }, tokens.teacher);
    return r.body.success;
  });

  await test('GET /teacher/assignments — list own assignments', async () => {
    const r = await req('GET', '/teacher/assignments', null, tokens.teacher);
    return r.body.success;
  });

  await test('POST /teacher/assignments — create assignment', async () => {
    if (!ids.teacherBatchId) return false;
    const r = await req('POST', '/teacher/assignments', {
      title: 'Test Drawing Exercise',
      description: 'Draw a house with garden',
      batchId: ids.teacherBatchId,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      totalMarks: 10,
    }, tokens.teacher);
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    ids.assignmentId = r.body.data._id;
    return true;
  });

  await test('POST /teacher/announcements — send announcement', async () => {
    const r = await req('POST', '/teacher/announcements', {
      title: 'Test Announcement',
      body: 'Please bring stationery tomorrow.',
      batchId: ids.teacherBatchId,
    }, tokens.teacher);
    return r.body.success;
  });

  await test('GET /teacher/leave — leave history', async () => {
    const r = await req('GET', '/teacher/leave', null, tokens.teacher);
    return r.body.success;
  });

  await test('POST /teacher/leave — apply for leave', async () => {
    const r = await req('POST', '/teacher/leave', {
      startDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      reason: 'Personal work',
      leaveType: 'casual',
    }, tokens.teacher);
    return r.body.success;
  });

  // ── PARENT APIS ─────────────────────────────────────────
  console.log('\n[ PARENT APIS ]');

  await test('GET /parent/dashboard', async () => {
    const r = await req('GET', '/parent/dashboard', null, tokens.parent);
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    return r.body.data.children !== undefined;
  });

  await test('GET /parent/children', async () => {
    const r = await req('GET', '/parent/children', null, tokens.parent);
    if (!r.body.success) return false;
    ids.parentChildId = r.body.data[0]?._id;
    return r.body.data.length > 0;
  });

  await test('GET /parent/attendance/:childId', async () => {
    if (!ids.parentChildId) return false;
    const r = await req('GET', `/parent/attendance/${ids.parentChildId}`, null, tokens.parent);
    return r.body.success && r.body.data.stats !== undefined;
  });

  await test('GET /parent/assignments/:childId', async () => {
    if (!ids.parentChildId) return false;
    const r = await req('GET', `/parent/assignments/${ids.parentChildId}`, null, tokens.parent);
    return r.body.success;
  });

  await test('GET /parent/fees/:childId', async () => {
    if (!ids.parentChildId) return false;
    const r = await req('GET', `/parent/fees/${ids.parentChildId}`, null, tokens.parent);
    return r.body.success && r.body.data.fees !== undefined;
  });

  await test('GET /parent/gallery', async () => {
    const r = await req('GET', '/parent/gallery', null, tokens.parent);
    return r.body.success;
  });

  await test('GET /parent/messages', async () => {
    const r = await req('GET', '/parent/messages', null, tokens.parent);
    return r.body.success;
  });

  // ── SHARED RESOURCE APIS ────────────────────────────────
  console.log('\n[ SHARED RESOURCES ]');

  await test('GET /children — list with pagination (16 total)', async () => {
    const r = await req('GET', '/children?limit=5&page=1', null, tokens.admin);
    return r.body.success && r.body.meta.total === 16;
  });

  await test('GET /children/:id/progress', async () => {
    if (!ids.childId) return false;
    const r = await req('GET', `/children/${ids.childId}/progress`, null, tokens.admin);
    return r.body.success && r.body.data.attendance !== undefined;
  });

  await test('GET /batches — list all (10 course batches)', async () => {
    const r = await req('GET', '/batches', null, tokens.teacher);
    return r.body.success && r.body.data.length === 10;
  });

  await test('GET /attendance?batchId=X — attendance records', async () => {
    if (!ids.batchId) return false;
    const r = await req('GET', `/attendance?batchId=${ids.batchId}&limit=10`, null, tokens.admin);
    return r.body.success;
  });

  await test('GET /attendance/child/:childId/summary', async () => {
    if (!ids.childId) return false;
    const r = await req('GET', `/attendance/child/${ids.childId}/summary`, null, tokens.admin);
    return r.body.success && r.body.data.summary !== undefined;
  });

  await test('GET /assignments — list with filter', async () => {
    const r = await req('GET', '/assignments', null, tokens.teacher);
    return r.body.success;
  });

  await test('GET /assignments/:id — single assignment', async () => {
    if (!ids.assignmentId) return false;
    const r = await req('GET', `/assignments/${ids.assignmentId}`, null, tokens.teacher);
    return r.body.success && r.body.data._id === ids.assignmentId;
  });

  await test('GET /events — upcoming events', async () => {
    const r = await req('GET', '/events?upcoming=true', null, tokens.parent);
    return r.body.success && r.body.data.length > 0;
  });

  await test('GET /gallery — classroom moments (8 items)', async () => {
    const r = await req('GET', '/gallery', null, tokens.parent);
    return r.body.success && r.body.data.length === 8;
  });

  await test('GET /messages — announcements', async () => {
    const r = await req('GET', '/messages', null, tokens.parent);
    return r.body.success;
  });

  await test('POST /messages — teacher creates announcement', async () => {
    const r = await req('POST', '/messages', {
      title: 'API Test Announcement',
      content: 'Test message body',
      body: 'Test message body',
      targetType: 'all_parents',
      senderRole: 'teacher',
    }, tokens.teacher);
    return r.body.success;
  });

  await test('GET /fees — fee records', async () => {
    const r = await req('GET', '/fees?limit=5', null, tokens.admin);
    return r.body.success && r.body.meta.total >= 20;
  });

  await test('GET /fees/payments — payment history', async () => {
    const r = await req('GET', '/fees/payments', null, tokens.admin);
    return r.body.success;
  });

  await test('GET /notifications — user notifications', async () => {
    const r = await req('GET', '/notifications', null, tokens.parent);
    return r.body.success;
  });

  await test('GET /chat/conversations — chat list', async () => {
    const r = await req('GET', '/chat/conversations', null, tokens.teacher);
    return r.body.success;
  });

  // ── REPORT APIS ─────────────────────────────────────────
  console.log('\n[ REPORTS ]');

  await test('GET /reports/attendance — monthly report', async () => {
    const now = new Date();
    const r = await req('GET', `/reports/attendance?month=${now.getMonth()+1}&year=${now.getFullYear()}`, null, tokens.admin);
    return r.body.success && r.body.data.summary !== undefined;
  });

  await test('GET /reports/assignments — completion rates', async () => {
    const r = await req('GET', '/reports/assignments', null, tokens.admin);
    return r.body.success && Array.isArray(r.body.data);
  });

  await test('GET /reports/analytics — school overview', async () => {
    const r = await req('GET', '/reports/analytics', null, tokens.admin);
    if (!r.body.success) { console.log('    →', JSON.stringify(r.body)); return false; }
    return r.body.data.totalStudents === 16 && r.body.data.totalTeachers === 5;
  });

  // ── ROLE GUARDS ─────────────────────────────────────────
  console.log('\n[ ROLE GUARD TESTS ]');

  await test('Parent cannot access /reports/analytics (admin only)', async () => {
    const r = await req('GET', '/reports/analytics', null, tokens.parent);
    return r.status === 403;
  });

  await test('Teacher cannot delete another teacher\'s assignment', async () => {
    // Login as teacher 2 (Rahul Verma) and try to delete teacher 1's assignment
    await req('POST', '/auth/send-otp', { phone: '9888800002' });
    const t2 = await req('POST', '/auth/verify-otp', { phone: '9888800002', otp: '123456' });
    const t2Token = t2.body.data?.accessToken;
    if (!t2Token || !ids.assignmentId) return false;
    const r = await req('DELETE', `/assignments/${ids.assignmentId}`, null, t2Token);
    return r.status === 403;
  });

  // ── SUMMARY ─────────────────────────────────────────────
  const total = pass + fail;
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${pass}/${total} passed  |  ${fail} failed`);
  console.log('══════════════════════════════════════════════════\n');
  process.exit(fail > 0 ? 1 : 0);
};

run().catch(console.error);

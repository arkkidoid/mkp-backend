const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ phone: '9999999999' });
    console.log("Teacher found:", !!user);
    if (user) {
      console.log("Has accessCode:", !!user.accessCode);
      console.log("accessCode field:", user.accessCode);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.create({
      name: 'Test Hash',
      phone: '8888888888',
      role: 'teacher',
      accessCode: '123456'
    });
    console.log("Raw doc from DB:", await mongoose.connection.db.collection('users').findOne({ _id: user._id }));
    await User.deleteOne({ _id: user._id });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  // General School Info
  schoolName: { type: String, default: 'ARK Kidoid' },
  principalName: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  academicYear: { type: String, default: '2025-26' },

  // Notifications toggles
  notifications: {
    attendance: { type: Boolean, default: true },
    feeReminder: { type: Boolean, default: true },
    assignments: { type: Boolean, default: true },
  },

  // Guest Mode Display Texts
  guestHeroTitle: { 
    type: String, 
    default: 'A joyful place to learn & grow' 
  },
  guestHeroBody: { 
    type: String, 
    default: 'Explore our courses, facilities and campus life. Robotics, coding, chess & more.' 
  },
  guestAboutText: { 
    type: String, 
    default: 'Masti Ki Paathshaala is dedicated to providing an enriching and joyful learning environment for children.' 
  }
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);

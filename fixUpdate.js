const fs = require('fs');
const path = './controllers/admin.controller.js';
let content = fs.readFileSync(path, 'utf8');

// We need to hash accessCode if it's provided in updateParent and updateTeacher
// Wait, we can just require bcrypt in admin.controller.js, but it's cleaner to add it to the code.
// Let's use string replace.

content = content.replace(
  "if (accessCode) userUpdate.accessCode = accessCode;",
  "if (accessCode) { const bcrypt = require('bcryptjs'); userUpdate.accessCode = await bcrypt.hash(accessCode, 12); }"
);

fs.writeFileSync(path, content);
console.log('Fixed admin.controller.js');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./config');
const db = require('./db');

async function initializeAdmin() {
  const users = db.getUsers();
  if (users.length === 0) {
    let initialPassword = config.ADMIN_DEFAULT_PASSWORD;
    let isGenerated = false;

    if (!initialPassword) {
      initialPassword = crypto.randomBytes(12).toString('base64url');
      isGenerated = true;
    }

    const saltRounds = config.IS_PROD ? 12 : 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);
    
    db.saveUser({
      username: config.ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin'
    });

    console.log(`====================================================`);
    console.log(`[AUTH] Admin account created:`);
    console.log(`  Username: ${config.ADMIN_USERNAME}`);
    if (isGenerated) {
      console.log(`  Generated Password: ${initialPassword}`);
      console.log(`  (Save this password! You can change it anytime in /admin)`);
    } else {
      console.log(`  Password: (Loaded from environment)`);
    }
    console.log(`====================================================`);
  }
}

async function verifyCredentials(username, password) {
  if (!username || !password) return null;
  const user = db.getUserByUsername(username);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

function generateToken(userPayload) {
  return jwt.sign(
    {
      id: userPayload.id,
      username: userPayload.username,
      role: userPayload.role
    },
    config.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: config.JWT_EXPIRES_IN
    }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return null;
  }
}

async function changePassword(userId, currentPassword, newPassword) {
  const users = db.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, message: 'User not found' };

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return { success: false, message: 'Current password is incorrect' };

  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: 'New password must be at least 8 characters long' };
  }

  const saltRounds = config.IS_PROD ? 12 : 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  user.password = hashedPassword;
  db.saveUser(user);
  return { success: true, message: 'Password updated successfully' };
}

module.exports = {
  initializeAdmin,
  verifyCredentials,
  generateToken,
  verifyToken,
  changePassword
};

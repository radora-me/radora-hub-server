import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { isMongoConnected, DATA_FILE } from '../config/db.js';
import { User } from '../models/User.js';
import { dataService } from './dataService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'radora_hub_super_secret_jwt_key_2026_architect';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateUserId = () => `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// Default seed users - Actual Chief Architect Admin
const defaultSeedUsers = [
  {
    name: 'Kartikey Pandey',
    username: 'kartikey.pandey',
    email: 'kartikey.pandey@radora.tech',
    rawPassword: 'Radhikey@radora',
    role: 'architect_admin',
    department: 'Platform Architecture & Governance',
    title: 'Chief Architect Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
  }
];

class LocalUserStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  read() {
    try {
      if (!fs.existsSync(this.filePath)) return { users: [] };
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (!data.users) data.users = [];
      return data;
    } catch {
      return { users: [] };
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

const localUserStore = new LocalUserStore(DATA_FILE);

// Helper to sanitize user object
const sanitizeUser = (user) => {
  if (!user) return null;
  const raw = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete raw.passwordHash;
  return raw;
};

export const authService = {
  // Initialize default users and purge dummy test users
  async initDefaultUsers() {
    try {
      if (isMongoConnected) {
        // Delete legacy dummy architect account if present
        await User.deleteMany({
          $or: [
            { username: 'architect' },
            { email: 'architect@radora.io' }
          ]
        });

        // Ensure Kartikey Pandey admin exists
        const adminExists = await User.findOne({
          $or: [
            { email: 'kartikey.pandey@radora.tech' },
            { username: 'kartikey.pandey' }
          ]
        });

        if (!adminExists) {
          console.log('[Auth] Seeding actual Chief Architect Admin (Kartikey Pandey) into MongoDB...');
          const u = defaultSeedUsers[0];
          const passwordHash = await bcrypt.hash(u.rawPassword, 10);
          await User.create({
            name: u.name,
            username: u.username.toLowerCase(),
            email: u.email.toLowerCase(),
            passwordHash,
            role: u.role,
            department: u.department,
            title: u.title,
            avatar: u.avatar,
            status: u.status,
            createdBy: 'system',
          });
          console.log('[Auth] Chief Architect Admin (Kartikey Pandey) created in MongoDB.');
        }
      } else {
        const db = localUserStore.read();
        // Remove legacy dummy architect accounts
        db.users = (db.users || []).filter(u =>
          u.username !== 'architect' &&
          u.email?.toLowerCase() !== 'architect@radora.io'
        );

        // Check if Kartikey Pandey already exists
        const exists = db.users.some(u =>
          u.email?.toLowerCase() === 'kartikey.pandey@radora.tech' ||
          u.username?.toLowerCase() === 'kartikey.pandey'
        );

        if (!exists) {
          console.log('[Auth] Seeding actual Chief Architect Admin (Kartikey Pandey) into local DB...');
          const u = defaultSeedUsers[0];
          const passwordHash = await bcrypt.hash(u.rawPassword, 10);
          db.users.push({
            _id: generateUserId(),
            name: u.name,
            username: u.username.toLowerCase(),
            email: u.email.toLowerCase(),
            passwordHash,
            role: u.role,
            department: u.department,
            title: u.title,
            avatar: u.avatar,
            status: u.status,
            createdBy: 'system',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          localUserStore.write(db);
          console.log('[Auth] Chief Architect Admin (Kartikey Pandey) created in local DB.');
        } else {
          localUserStore.write(db);
          console.log('[Auth] Chief Architect Admin (Kartikey Pandey) active.');
        }
      }
    } catch (err) {
      console.error('[Auth Init Error]', err);
    }
  },

  // Generate JWT Token
  generateToken(user) {
    const payload = {
      id: user._id || user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  // Login with identifier (email or username) + password
  async login(identifier, password) {
    if (!identifier || !password) {
      throw new Error('Please provide both username/email and password.');
    }

    const cleanId = identifier.trim().toLowerCase();
    let user = null;

    if (isMongoConnected) {
      user = await User.findOne({
        $or: [
          { email: cleanId },
          { username: cleanId },
          ...(cleanId === 'kartikey' ? [{ email: 'kartikey.pandey@radora.tech' }, { username: 'kartikey.pandey' }] : [])
        ],
      });
    } else {
      const db = localUserStore.read();
      user = (db.users || []).find(
        u => u.email?.toLowerCase() === cleanId ||
             u.username?.toLowerCase() === cleanId ||
             (cleanId === 'kartikey' && u.email?.toLowerCase() === 'kartikey.pandey@radora.tech')
      );
    }

    if (!user) {
      throw new Error('Invalid credentials: User not found.');
    }

    if (user.status === 'inactive') {
      throw new Error('Your account is currently inactive. Contact Project Architect Admin.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid credentials: Password incorrect.');
    }

    // Update lastLoginAt
    const now = new Date();
    if (isMongoConnected) {
      user.lastLoginAt = now;
      await user.save();
    } else {
      const db = localUserStore.read();
      const idx = db.users.findIndex(u => (u._id || u.id) === (user._id || user.id));
      if (idx !== -1) {
        db.users[idx].lastLoginAt = now.toISOString();
        localUserStore.write(db);
      }
    }

    const token = this.generateToken(user);
    dataService.logActivity(`User "${user.name}" (${user.role === 'architect_admin' ? 'Architect Admin' : 'Team Member'}) logged in.`, 'AUTH');

    return {
      token,
      user: sanitizeUser(user),
    };
  },

  // Get all users (Admin view)
  async getAllUsers() {
    if (isMongoConnected) {
      const users = await User.find().sort({ createdAt: -1 });
      return users.map(u => sanitizeUser(u));
    }
    const db = localUserStore.read();
    return (db.users || []).map(u => sanitizeUser(u));
  },

  // Get user by ID
  async getUserById(id) {
    if (isMongoConnected) {
      const user = await User.findById(id);
      return sanitizeUser(user);
    }
    const db = localUserStore.read();
    const user = (db.users || []).find(u => (u._id || u.id) === id);
    return sanitizeUser(user);
  },

  // Create a new Team Member profile (Admin action)
  async createUser(adminUser, userData) {
    const { name, username, email, password, role, department, title, phone, notes } = userData;

    if (!name || !username || !email || !password) {
      throw new Error('Name, username/ID, email, and initial password are required.');
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate username or email
    if (isMongoConnected) {
      const existing = await User.findOne({
        $or: [{ email: cleanEmail }, { username: cleanUsername }],
      });
      if (existing) {
        if (existing.username === cleanUsername) {
          throw new Error(`Username "${cleanUsername}" is already taken.`);
        }
        throw new Error(`Email "${cleanEmail}" is already registered.`);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: role || 'team_member',
        department: department || 'General Engineering',
        title: title || (role === 'architect_admin' ? 'Project Architect Admin' : 'Team Member'),
        phone: phone || '',
        notes: notes || '',
        status: 'active',
        createdBy: adminUser?.name || 'Project Architect Admin',
      });

      dataService.logActivity(
        `Architect Admin created profile for ${newUser.name} (@${newUser.username}) as ${newUser.role}.`,
        'AUTH'
      );

      return sanitizeUser(newUser);
    }

    // Local DB Mode
    const db = localUserStore.read();
    if (!db.users) db.users = [];

    const existing = db.users.find(
      u => u.email?.toLowerCase() === cleanEmail || u.username?.toLowerCase() === cleanUsername
    );
    if (existing) {
      if (existing.username?.toLowerCase() === cleanUsername) {
        throw new Error(`Username "${cleanUsername}" is already taken.`);
      }
      throw new Error(`Email "${cleanEmail}" is already registered.`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      _id: generateUserId(),
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      role: role || 'team_member',
      department: department || 'General Engineering',
      title: title || (role === 'architect_admin' ? 'Project Architect Admin' : 'Team Member'),
      phone: phone || '',
      notes: notes || '',
      status: 'active',
      createdBy: adminUser?.name || 'Project Architect Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.unshift(newUser);
    localUserStore.write(db);

    dataService.logActivity(
      `Architect Admin created profile for ${newUser.name} (@${newUser.username}) as ${newUser.role}.`,
      'AUTH'
    );

    return sanitizeUser(newUser);
  },

  // Update Team Member profile (Admin action)
  async updateUserProfile(id, updates) {
    const allowed = ['name', 'username', 'email', 'role', 'department', 'title', 'status', 'phone', 'notes'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        safeUpdates[key] = typeof updates[key] === 'string' ? updates[key].trim() : updates[key];
      }
    }
    if (safeUpdates.username) safeUpdates.username = safeUpdates.username.toLowerCase();
    if (safeUpdates.email) safeUpdates.email = safeUpdates.email.toLowerCase();

    if (isMongoConnected) {
      const updated = await User.findByIdAndUpdate(id, safeUpdates, { new: true });
      if (!updated) throw new Error('User not found.');
      dataService.logActivity(`Profile for "${updated.name}" updated.`, 'AUTH');
      return sanitizeUser(updated);
    }

    const db = localUserStore.read();
    const idx = db.users.findIndex(u => (u._id || u.id) === id);
    if (idx === -1) throw new Error('User not found.');

    db.users[idx] = {
      ...db.users[idx],
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    };
    localUserStore.write(db);
    dataService.logActivity(`Profile for "${db.users[idx].name}" updated.`, 'AUTH');
    return sanitizeUser(db.users[idx]);
  },

  // Change / Reset Password of any Team Member (Project Architect Admin action)
  async changeUserPasswordByAdmin(adminUser, targetUserId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (isMongoConnected) {
      const user = await User.findById(targetUserId);
      if (!user) throw new Error('User not found.');

      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
      await user.save();

      dataService.logActivity(
        `Architect Admin ${adminUser?.name || ''} reset password for team member "${user.name}".`,
        'SECURITY'
      );
      return { success: true, message: `Password successfully updated for ${user.name}.` };
    }

    const db = localUserStore.read();
    const idx = db.users.findIndex(u => (u._id || u.id) === targetUserId);
    if (idx === -1) throw new Error('User not found.');

    db.users[idx].passwordHash = passwordHash;
    db.users[idx].updatedAt = new Date().toISOString();
    localUserStore.write(db);

    dataService.logActivity(
      `Architect Admin ${adminUser?.name || ''} reset password for team member "${db.users[idx].name}".`,
      'SECURITY'
    );

    return { success: true, message: `Password successfully updated for ${db.users[idx].name}.` };
  },

  // Change self password
  async changeSelfPassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    let user = null;
    if (isMongoConnected) {
      user = await User.findById(userId);
    } else {
      const db = localUserStore.read();
      user = db.users.find(u => (u._id || u.id) === userId);
    }

    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Current password does not match.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (isMongoConnected) {
      user.passwordHash = passwordHash;
      await user.save();
    } else {
      const db = localUserStore.read();
      const idx = db.users.findIndex(u => (u._id || u.id) === userId);
      db.users[idx].passwordHash = passwordHash;
      db.users[idx].updatedAt = new Date().toISOString();
      localUserStore.write(db);
    }

    dataService.logActivity(`User "${user.name}" updated their own password.`, 'SECURITY');
    return { success: true, message: 'Password updated successfully.' };
  },

  // Delete team member (Admin action)
  async deleteUser(adminUser, targetUserId) {
    const adminId = adminUser?._id || adminUser?.id;
    if (String(adminId) === String(targetUserId)) {
      throw new Error('Security restriction: You cannot delete your own admin account.');
    }

    if (isMongoConnected) {
      const user = await User.findById(targetUserId);
      if (!user) throw new Error('User not found.');
      await User.findByIdAndDelete(targetUserId);
      dataService.logActivity(`Architect Admin removed user profile: "${user.name}".`, 'AUTH');
      return { success: true, message: `User ${user.name} removed successfully.` };
    }

    const db = localUserStore.read();
    const user = db.users.find(u => (u._id || u.id) === targetUserId);
    if (!user) throw new Error('User not found.');

    db.users = db.users.filter(u => (u._id || u.id) !== targetUserId);
    localUserStore.write(db);

    dataService.logActivity(`Architect Admin removed user profile: "${user.name}".`, 'AUTH');
    return { success: true, message: `User ${user.name} removed successfully.` };
  }
};

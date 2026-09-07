import fs from 'fs';
import { Activity } from '../models/Activity.js';
import { isMongoConnected, DATA_FILE } from '../config/db.js';
import { socketService } from './socketService.js';

const readLocal = () => {
  try {
    if (DATA_FILE && fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { activityLogs: [] };
};

const writeLocal = (data) => {
  try {
    if (DATA_FILE) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {}
};

export const activityService = {
  // Log a new activity event
  async logActivity({
    user,
    userId,
    userName,
    userEmail,
    userRole,
    userAvatar,
    action,
    projectId,
    projectTitle,
    projectCode,
    message,
    details = {},
  }) {
    try {
      // Resolve user info from user object or passed properties
      const resolvedUserId = userId || user?._id || user?.id || null;
      const resolvedUserName = userName || user?.name || 'Team Member';
      const resolvedUserEmail = userEmail || user?.email || '';
      const resolvedUserRole = userRole || user?.role || 'team_member';
      const resolvedUserAvatar = userAvatar || user?.avatar || '';

      const activityPayload = {
        userId: resolvedUserId,
        userName: resolvedUserName,
        userEmail: resolvedUserEmail,
        userRole: resolvedUserRole,
        userAvatar: resolvedUserAvatar,
        action,
        projectId: projectId ? String(projectId) : null,
        projectTitle: projectTitle || 'General',
        projectCode: projectCode || '',
        message,
        details,
        createdAt: new Date(),
      };

      let savedActivity = null;

      if (isMongoConnected) {
        try {
          const doc = new Activity(activityPayload);
          savedActivity = await doc.save();
        } catch (dbErr) {
          console.error('[ActivityService] MongoDB save failed, writing to localStore:', dbErr.message);
        }
      }

      // Local fallback
      const db = readLocal();
      if (!db.activityLogs) db.activityLogs = [];
      const localEntry = {
        _id: savedActivity ? savedActivity._id.toString() : 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        ...activityPayload,
        createdAt: activityPayload.createdAt.toISOString(),
      };
      db.activityLogs.unshift(localEntry);
      if (db.activityLogs.length > 200) {
        db.activityLogs = db.activityLogs.slice(0, 200);
      }
      writeLocal(db);

      const finalActivity = savedActivity ? savedActivity.toObject() : localEntry;

      // Broadcast real-time activity update to all connected clients
      socketService.broadcastPlatformUpdate('ACTIVITY_RECORDED', {
        activity: finalActivity,
      });

      console.log(`[Activity] [${action}] ${message}`);
      return finalActivity;
    } catch (err) {
      console.error('[ActivityService] Failed to log activity:', err);
      return null;
    }
  },

  // Query activities with optional filters
  async getActivities({ projectId, action, limit = 40, page = 1 } = {}) {
    const lim = Math.min(parseInt(limit, 10) || 40, 100);
    const skip = ((parseInt(page, 10) || 1) - 1) * lim;

    if (isMongoConnected) {
      try {
        const query = {};
        if (projectId) {
          // Match projectId as string since it can be stored as ObjectId or String
          query.projectId = String(projectId);
        }
        if (action && action !== 'ALL') {
          if (action === 'CHECKLIST') {
            query.action = { $in: ['CHECKLIST_ITEM_CHECKED', 'CHECKLIST_ITEM_UNCHECKED', 'CHECKLIST_ITEM_ADDED', 'CHECKLIST_ITEM_DELETED'] };
          } else if (action === 'STATUS') {
            query.action = 'PROJECT_STATUS_CHANGED';
          } else if (action === 'PROJECT') {
            query.action = { $in: ['PROJECT_UPDATED', 'PROJECT_CREATED', 'PROJECT_DELETED'] };
          } else {
            query.action = action;
          }
        }

        const [activities, total] = await Promise.all([
          Activity.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim)
            .lean(),
          Activity.countDocuments(query),
        ]);

        return {
          activities,
          total,
          page: parseInt(page, 10) || 1,
          limit: lim,
        };
      } catch (err) {
        console.error('[ActivityService] MongoDB query failed, falling back to localStore:', err.message);
      }
    }

    // LocalStore fallback
    const db = readLocal();
    let list = [...(db.activityLogs || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    if (projectId) {
      list = list.filter(a => String(a.projectId) === String(projectId));
    }
    if (action && action !== 'ALL') {
      if (action === 'CHECKLIST') {
        list = list.filter(a => ['CHECKLIST_ITEM_CHECKED', 'CHECKLIST_ITEM_UNCHECKED', 'CHECKLIST_ITEM_ADDED', 'CHECKLIST_ITEM_DELETED'].includes(a.action));
      } else if (action === 'STATUS') {
        list = list.filter(a => a.action === 'PROJECT_STATUS_CHANGED');
      } else if (action === 'PROJECT') {
        list = list.filter(a => ['PROJECT_UPDATED', 'PROJECT_CREATED', 'PROJECT_DELETED'].includes(a.action));
      } else {
        list = list.filter(a => a.action === action);
      }
    }

    const total = list.length;
    const paginated = list.slice(skip, skip + lim);

    return {
      activities: paginated,
      total,
      page: parseInt(page, 10) || 1,
      limit: lim,
    };
  },

  // Seed default activities if empty
  async initDefaultActivities() {
    try {
      if (isMongoConnected) {
        const count = await Activity.countDocuments();
        if (count > 0) return;
      } else {
        const db = readLocal();
        if (db.activityLogs && db.activityLogs.length > 0) return;
      }

      console.log('[ActivityService] Seeding baseline activity history...');

      // Look up the actual Radora Next project to get its real _id
      let radoraProjectId = null;
      try {
        const { dataService } = await import('./dataService.js');
        const projects = await dataService.getProjects({});
        const radoraNext = projects.find(p => p.title === 'Radora Next' || p.code === 'RAD-NEXT');
        if (radoraNext) {
          radoraProjectId = String(radoraNext._id || radoraNext.id);
          console.log('[ActivityService] Found Radora Next project ID:', radoraProjectId);
        }
      } catch (e) {
        console.warn('[ActivityService] Could not look up Radora Next project:', e.message);
      }

      const baselineActivities = [
        {
          userName: 'Kartikey Pandey',
          userEmail: 'kartikey.pandey@radora.tech',
          userRole: 'architect_admin',
          action: 'PROJECT_CREATED',
          projectId: radoraProjectId,
          projectTitle: 'Radora Next',
          projectCode: 'RAD-NEXT',
          message: 'Kartikey Pandey initialized enterprise project "Radora Next"',
          details: { category: 'Engineering', priority: 'Urgent' },
          createdAt: new Date(Date.now() - 3600000 * 4),
        },
        {
          userName: 'Kartikey Pandey',
          userEmail: 'kartikey.pandey@radora.tech',
          userRole: 'architect_admin',
          action: 'TEMPLATE_INSTANTIATED',
          projectId: radoraProjectId,
          projectTitle: 'Radora Next',
          projectCode: 'RAD-NEXT',
          message: 'Instantiated checklist blueprint "Radora Next — Full Platform Checklist" (458 items)',
          details: { templateName: 'Radora Next — Full Platform Checklist' },
          createdAt: new Date(Date.now() - 3600000 * 3),
        },
        {
          userName: 'Radhikey Team',
          userEmail: 'team@radora.tech',
          userRole: 'team_member',
          action: 'CHECKLIST_ITEM_CHECKED',
          projectId: radoraProjectId,
          projectTitle: 'Radora Next',
          projectCode: 'RAD-NEXT',
          message: 'Radhikey Team marked checkbox "Verify PostgreSQL connection pooling" as Completed',
          details: { sectionName: 'Database Architecture', itemText: 'Verify PostgreSQL connection pooling', newStatus: 'Completed' },
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
          userName: 'Kartikey Pandey',
          userEmail: 'kartikey.pandey@radora.tech',
          userRole: 'architect_admin',
          action: 'CHECKLIST_ITEM_CHECKED',
          projectId: radoraProjectId,
          projectTitle: 'Radora Next',
          projectCode: 'RAD-NEXT',
          message: 'Kartikey Pandey marked checkbox "Configure MongoDB Atlas sharded cluster" as Completed',
          details: { sectionName: 'Database Architecture', itemText: 'Configure MongoDB Atlas sharded cluster', newStatus: 'Completed' },
          createdAt: new Date(Date.now() - 3600000 * 1),
        },
      ];

      for (const act of baselineActivities) {
        if (isMongoConnected) {
          const doc = new Activity(act);
          await doc.save();
        }
      }

      const db = readLocal();
      db.activityLogs = baselineActivities.map((a, i) => ({
        _id: 'act-init-' + i,
        ...a,
        createdAt: a.createdAt.toISOString(),
      }));
      writeLocal(db);

      console.log('[ActivityService] Baseline activities seeded successfully.');
    } catch (err) {
      console.error('[ActivityService] Failed to seed initial activities:', err);
    }
  }
};

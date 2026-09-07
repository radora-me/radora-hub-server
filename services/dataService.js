import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected, DATA_FILE } from '../config/db.js';
import { Project } from '../models/Project.js';
import { Checklist } from '../models/Checklist.js';
import { Template } from '../models/Template.js';
import { defaultProjects, defaultChecklists, defaultTemplates } from '../seed/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for generating IDs
const generateId = (prefix = 'rad') => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

// Local JSON File DB helper
class LocalStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.reset();
      } else {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.projects || !data.checklists || !data.templates) {
          this.reset();
        }
      }
    } catch (err) {
      console.error('[LocalStore] Error reading store, resetting with seed data:', err.message);
      this.reset();
    }
  }

  read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return this.reset();
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }

  reset() {
    const data = {
      projects: JSON.parse(JSON.stringify(defaultProjects)),
      checklists: JSON.parse(JSON.stringify(defaultChecklists)),
      templates: JSON.parse(JSON.stringify(defaultTemplates)),
      activity: [
        {
          id: generateId('act'),
          type: 'SYSTEM',
          message: 'Radora Hub database initialized with sample projects and checklists.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    this.write(data);
    return data;
  }
}

const localStore = new LocalStore(DATA_FILE);

// Calculate checklist completion and stats
export const recalculateChecklistProgress = (checklist) => {
  let totalItems = 0;
  let completedItems = 0;

  if (checklist.sections && Array.isArray(checklist.sections)) {
    checklist.sections.forEach(sec => {
      if (sec.items && Array.isArray(sec.items)) {
        sec.items.forEach(item => {
          totalItems++;
          if (item.status === 'Completed' || item.status === 'Skipped') {
            completedItems++;
          }
        });
      }
    });
  }

  checklist.totalItems = totalItems;
  checklist.completedItems = completedItems;
  checklist.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  return checklist;
};

// Data Service
export const dataService = {
  getMode: () => (isMongoConnected ? 'MongoDB' : 'Local File DB'),

  // --- PROJECTS ---
  async getProjects(query = {}) {
    if (isMongoConnected) {
      return await Project.find(query).sort({ updatedAt: -1 });
    }
    const db = localStore.read();
    let list = db.projects || [];
    if (query.status) {
      list = list.filter(p => p.status === query.status);
    }
    if (query.category) {
      list = list.filter(p => p.category === query.category);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(s) ||
        p.code?.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s)
      );
    }
    return list;
  },

  async getProjectById(id) {
    if (isMongoConnected) {
      return await Project.findById(id);
    }
    const db = localStore.read();
    return db.projects.find(p => p._id === id || p.id === id) || null;
  },

  async createProject(projectData) {
    if (isMongoConnected) {
      return await Project.create(projectData);
    }
    const db = localStore.read();
    const newProj = {
      _id: generateId('proj'),
      ...projectData,
      progress: projectData.progress || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.projects.unshift(newProj);
    this.logActivity(`Project "${newProj.title}" (${newProj.code || 'RAD'}) was created.`);
    localStore.write(db);
    return newProj;
  },

  async updateProject(id, updateData) {
    if (isMongoConnected) {
      return await Project.findByIdAndUpdate(id, updateData, { new: true });
    }
    const db = localStore.read();
    const idx = db.projects.findIndex(p => p._id === id || p.id === id);
    if (idx === -1) return null;
    db.projects[idx] = {
      ...db.projects[idx],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    localStore.write(db);
    return db.projects[idx];
  },

  async deleteProject(id) {
    if (isMongoConnected) {
      await Checklist.deleteMany({ projectId: id });
      return await Project.findByIdAndDelete(id);
    }
    const db = localStore.read();
    const proj = db.projects.find(p => p._id === id || p.id === id);
    db.projects = db.projects.filter(p => p._id !== id && p.id !== id);
    db.checklists = db.checklists.filter(c => c.projectId !== id);
    if (proj) {
      this.logActivity(`Project "${proj.title}" was deleted.`);
    }
    localStore.write(db);
    return { success: true };
  },

  // --- CHECKLISTS ---
  async getChecklists(projectId = null) {
    if (isMongoConnected) {
      const filter = projectId ? { projectId } : {};
      return await Checklist.find(filter).sort({ createdAt: -1 });
    }
    const db = localStore.read();
    let list = db.checklists || [];
    if (projectId) {
      list = list.filter(c => String(c.projectId) === String(projectId));
    }
    return list;
  },

  async getChecklistById(id) {
    if (isMongoConnected) {
      return await Checklist.findById(id);
    }
    const db = localStore.read();
    return db.checklists.find(c => c._id === id || c.id === id) || null;
  },

  async createChecklist(checklistData) {
    const calculated = recalculateChecklistProgress(checklistData);

    if (isMongoConnected) {
      const chk = await Checklist.create(calculated);
      await this.syncProjectProgress(chk.projectId);
      return chk;
    }

    const db = localStore.read();
    const newChk = {
      _id: generateId('chk'),
      ...calculated,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.checklists.unshift(newChk);
    this.logActivity(`Checklist "${newChk.title}" added to project.`);
    localStore.write(db);

    await this.syncProjectProgress(newChk.projectId);
    return newChk;
  },

  async updateChecklist(id, updateData) {
    if (isMongoConnected) {
      let chk = await Checklist.findById(id);
      if (!chk) return null;
      Object.assign(chk, updateData);
      chk = recalculateChecklistProgress(chk);
      await chk.save();
      await this.syncProjectProgress(chk.projectId);
      return chk;
    }

    const db = localStore.read();
    const idx = db.checklists.findIndex(c => c._id === id || c.id === id);
    if (idx === -1) return null;

    db.checklists[idx] = recalculateChecklistProgress({
      ...db.checklists[idx],
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    localStore.write(db);
    await this.syncProjectProgress(db.checklists[idx].projectId);
    return db.checklists[idx];
  },

  async deleteChecklist(id) {
    if (isMongoConnected) {
      const chk = await Checklist.findByIdAndDelete(id);
      if (chk) await this.syncProjectProgress(chk.projectId);
      return chk;
    }
    const db = localStore.read();
    const target = db.checklists.find(c => c._id === id || c.id === id);
    db.checklists = db.checklists.filter(c => c._id !== id && c.id !== id);
    localStore.write(db);
    if (target) {
      await this.syncProjectProgress(target.projectId);
      this.logActivity(`Checklist "${target.title}" was deleted.`);
    }
    return { success: true };
  },

  async updateChecklistItem(checklistId, sectionId, itemId, updates) {
    if (isMongoConnected) {
      const chk = await Checklist.findById(checklistId);
      if (!chk) return null;

      const sec = chk.sections.find(s => s.id === sectionId || s._id?.toString() === sectionId);
      if (!sec) return null;

      const item = sec.items.find(i => i.id === itemId || i._id?.toString() === itemId);
      if (!item) return null;

      Object.assign(item, updates);
      if (updates.status === 'Completed' && !item.completedAt) {
        item.completedAt = new Date().toISOString();
      } else if (updates.status !== 'Completed') {
        item.completedAt = null;
      }

      recalculateChecklistProgress(chk);
      await chk.save();
      await this.syncProjectProgress(chk.projectId);
      return { checklist: chk, updatedItem: item };
    }

    const db = localStore.read();
    const chk = db.checklists.find(c => c._id === checklistId || c.id === checklistId);
    if (!chk) return null;

    const sec = chk.sections.find(s => s.id === sectionId);
    if (!sec) return null;

    const item = sec.items.find(i => i.id === itemId);
    if (!item) return null;

    Object.assign(item, updates);
    if (updates.status === 'Completed' && !item.completedAt) {
      item.completedAt = new Date().toISOString();
    } else if (updates.status !== 'Completed') {
      item.completedAt = null;
    }

    recalculateChecklistProgress(chk);
    chk.updatedAt = new Date().toISOString();

    localStore.write(db);
    await this.syncProjectProgress(chk.projectId);
    return { checklist: chk, updatedItem: item };
  },

  // Sync Project progress based on average of checklists
  async syncProjectProgress(projectId) {
    if (!projectId) return;

    if (isMongoConnected) {
      const checklists = await Checklist.find({ projectId });
      if (checklists.length === 0) return;
      const totalProg = checklists.reduce((acc, c) => acc + (c.progress || 0), 0);
      const avgProg = Math.round(totalProg / checklists.length);
      await Project.findByIdAndUpdate(projectId, { progress: avgProg });
      return;
    }

    const db = localStore.read();
    const checklists = db.checklists.filter(c => String(c.projectId) === String(projectId));
    if (checklists.length === 0) return;

    const totalProg = checklists.reduce((acc, c) => acc + (c.progress || 0), 0);
    const avgProg = Math.round(totalProg / checklists.length);

    const pIdx = db.projects.findIndex(p => String(p._id) === String(projectId) || String(p.id) === String(projectId));
    if (pIdx !== -1) {
      db.projects[pIdx].progress = avgProg;
      db.projects[pIdx].updatedAt = new Date().toISOString();
      localStore.write(db);
    }
  },

  // --- TEMPLATES ---
  async getTemplates() {
    if (isMongoConnected) {
      return await Template.find().sort({ createdAt: -1 });
    }
    const db = localStore.read();
    return db.templates || [];
  },

  async getTemplateById(id) {
    if (isMongoConnected) {
      return await Template.findById(id);
    }
    const db = localStore.read();
    return db.templates.find(t => t._id === id || t.id === id) || null;
  },

  async createTemplate(templateData) {
    if (isMongoConnected) {
      return await Template.create(templateData);
    }
    const db = localStore.read();
    const newTpl = {
      _id: generateId('tpl'),
      ...templateData,
      isBuiltin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.templates.unshift(newTpl);
    this.logActivity(`Checklist Template "${newTpl.name}" was created.`);
    localStore.write(db);
    return newTpl;
  },

  async updateTemplate(id, updateData) {
    if (isMongoConnected) {
      return await Template.findByIdAndUpdate(id, updateData, { new: true });
    }
    const db = localStore.read();
    const idx = db.templates.findIndex(t => t._id === id || t.id === id);
    if (idx === -1) return null;
    db.templates[idx] = {
      ...db.templates[idx],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    localStore.write(db);
    return db.templates[idx];
  },

  async deleteTemplate(id) {
    if (isMongoConnected) {
      const deleted = await Template.findOneAndDelete({ _id: id });
      if (deleted) {
        this.logActivity(`Checklist Template "${deleted.name}" was deleted.`);
      }
      return deleted;
    }
    const db = localStore.read();
    const target = db.templates.find(t => t._id === id || t.id === id);
    db.templates = db.templates.filter(t => t._id !== id && t.id !== id);
    localStore.write(db);
    if (target) {
      this.logActivity(`Checklist Template "${target.name}" was deleted.`);
    }
    return { success: true };
  },

  // Instantiate a Template into a Project Checklist
  async instantiateTemplate(templateId, projectId, customTitle = null) {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found with ID: ${templateId}`);
    }

    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project not found with ID: ${projectId}`);
    }

    // Clone sections with fresh unique IDs and default Pending status
    const sections = (template.sections || []).map(sec => ({
      id: generateId('sec'),
      name: sec.name,
      items: (sec.items || []).map(item => ({
        id: generateId('itm'),
        text: item.text,
        description: item.description || '',
        priority: item.priority || 'Medium',
        status: 'Pending',
        assignee: item.defaultAssigneeRole || '',
        dueDate: '',
        notes: '',
        completedAt: null,
      })),
    }));

    const checklistData = {
      projectId: project._id || project.id,
      templateId: template._id || template.id,
      title: customTitle || `${template.name} - Run`,
      description: template.description || '',
      category: template.category || 'General',
      sections,
    };

    return await this.createChecklist(checklistData);
  },

  // --- STATS & ANALYTICS ---
  async getStats() {
    const projects = await this.getProjects();
    const checklists = await this.getChecklists();
    const templates = await this.getTemplates();

    let totalItems = 0;
    let completedItems = 0;
    let blockedItems = 0;
    let inProgressItems = 0;

    checklists.forEach(c => {
      c.sections?.forEach(s => {
        s.items?.forEach(i => {
          totalItems++;
          if (i.status === 'Completed') completedItems++;
          else if (i.status === 'Blocked') blockedItems++;
          else if (i.status === 'In Progress') inProgressItems++;
        });
      });
    });

    const statusCounts = {
      Planning: 0,
      'In Progress': 0,
      'Under Review': 0,
      Completed: 0,
      'On Hold': 0,
    };

    projects.forEach(p => {
      if (statusCounts[p.status] !== undefined) {
        statusCounts[p.status]++;
      }
    });

    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      databaseMode: this.getMode(),
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'In Progress' || p.status === 'Under Review').length,
      statusCounts,
      checklistsCount: checklists.length,
      templatesCount: templates.length,
      totalItems,
      completedItems,
      blockedItems,
      inProgressItems,
      overallProgress,
      recentActivity: this.getActivity(),
    };
  },

  // --- ACTIVITY LOGS ---
  getActivity() {
    const db = localStore.read();
    return (db.activity || []).slice(0, 15);
  },

  logActivity(message, type = 'USER') {
    const db = localStore.read();
    if (!db.activity) db.activity = [];
    db.activity.unshift({
      id: generateId('act'),
      type,
      message,
      timestamp: new Date().toISOString(),
    });
    if (db.activity.length > 50) db.activity = db.activity.slice(0, 50);
    localStore.write(db);
  },

  // Initialize default projects, checklists, and templates in MongoDB if empty
  async initDefaultData() {
    try {
      if (isMongoConnected) {
        const projectCount = await Project.countDocuments();
        if (projectCount === 0) {
          console.log('[DataService] MongoDB Atlas is connected but empty. Seeding data from local store/seedData...');
          const db = localStore.read();
          const projects = (db.projects && db.projects.length > 0) ? db.projects : defaultProjects;
          const checklists = (db.checklists && db.checklists.length > 0) ? db.checklists : defaultChecklists;
          const templates = (db.templates && db.templates.length > 0) ? db.templates : defaultTemplates;

          for (const p of projects) {
            await Project.create(p);
          }
          for (const c of checklists) {
            await Checklist.create(c);
          }
          for (const t of templates) {
            await Template.create(t);
          }
          console.log(`[DataService] MongoDB Atlas seeded with ${projects.length} project(s), ${checklists.length} checklist(s), and ${templates.length} template(s).`);
        }
      }
    } catch (err) {
      console.error('[DataService] Error during initDefaultData:', err.message);
    }
  },

  // Reset demo data
  resetDatabase() {
    return localStore.reset();
  }
};

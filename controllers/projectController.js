import { dataService } from '../services/dataService.js';
import { socketService } from '../services/socketService.js';
import { activityService } from '../services/activityService.js';

export const getProjects = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.search = search;

    const projects = await dataService.getProjects(filter);
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await dataService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const checklists = await dataService.getChecklists(req.params.id);
    const projData = typeof project.toObject === 'function' ? project.toObject() : project;
    res.json({ success: true, data: { ...projData, checklists } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const { title, code, description, category, status, priority, lead, team, tags, startDate, targetDate } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required' });
    }

    const generatedCode = code || `RAD-${Math.floor(100 + Math.random() * 900)}`;

    const project = await dataService.createProject({
      title,
      code: generatedCode.toUpperCase(),
      description: description || '',
      category: category || 'Engineering',
      status: status || 'Planning',
      priority: priority || 'Medium',
      lead: lead || 'Radora Lead',
      team: Array.isArray(team) ? team : (team ? team.split(',').map(s => s.trim()) : []),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(s => s.trim()) : []),
      startDate: startDate || new Date().toISOString().split('T')[0],
      targetDate: targetDate || '',
      progress: 0,
    });

    const user = req.user || req.body.user || { name: 'Team Member', role: 'team_member' };
    await activityService.logActivity({
      user,
      action: 'PROJECT_CREATED',
      projectId: project._id || project.id,
      projectTitle: project.title,
      projectCode: project.code,
      message: `${user.name} created new project "${project.title}" (${project.code})`,
      details: { category: project.category, priority: project.priority, status: project.status },
    });

    socketService.broadcastPlatformUpdate('PROJECT_CREATED', { project });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const existing = await dataService.getProjectById(req.params.id);
    const oldStatus = existing?.status;

    const updated = await dataService.updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    const projData = typeof updated.toObject === 'function' ? updated.toObject() : updated;
    const user = req.user || req.body.user || { name: 'Team Member', role: 'team_member' };

    // Log status transition vs general update
    if (req.body.status && oldStatus && req.body.status !== oldStatus) {
      await activityService.logActivity({
        user,
        action: 'PROJECT_STATUS_CHANGED',
        projectId: projData._id || req.params.id,
        projectTitle: projData.title,
        projectCode: projData.code,
        message: `${user.name} changed status of "${projData.title}" from "${oldStatus}" to "${req.body.status}"`,
        details: { previousStatus: oldStatus, newStatus: req.body.status },
      });
    } else {
      await activityService.logActivity({
        user,
        action: 'PROJECT_UPDATED',
        projectId: projData._id || req.params.id,
        projectTitle: projData.title,
        projectCode: projData.code,
        message: `${user.name} updated project details for "${projData.title}"`,
        details: req.body,
      });
    }

    socketService.broadcastPlatformUpdate('PROJECT_UPDATED', { project: projData, projectId: req.params.id });
    res.json({ success: true, data: projData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const existing = await dataService.getProjectById(req.params.id);
    await dataService.deleteProject(req.params.id);

    const user = req.user || { name: 'Team Member', role: 'team_member' };
    await activityService.logActivity({
      user,
      action: 'PROJECT_DELETED',
      projectId: req.params.id,
      projectTitle: existing?.title || 'Project',
      projectCode: existing?.code || 'RAD',
      message: `${user.name} deleted project "${existing?.title || 'Project'}"`,
      details: {},
    });

    socketService.broadcastPlatformUpdate('PROJECT_DELETED', { projectId: req.params.id });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


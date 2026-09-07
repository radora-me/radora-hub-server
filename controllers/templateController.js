import { dataService } from '../services/dataService.js';
import { socketService } from '../services/socketService.js';
import { activityService } from '../services/activityService.js';

export const getTemplates = async (req, res) => {
  try {
    const templates = await dataService.getTemplates();
    res.json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await dataService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const { name, category, description, estimatedHours, tags, sections } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Template name and category are required' });
    }

    const formattedSections = (sections || []).map((sec, sIdx) => ({
      id: sec.id || `tpl-sec-${Date.now()}-${sIdx}`,
      name: sec.name || `Section ${sIdx + 1}`,
      items: (sec.items || []).map((itm, iIdx) => ({
        id: itm.id || `tpl-itm-${Date.now()}-${sIdx}-${iIdx}`,
        text: itm.text || 'Item title',
        description: itm.description || '',
        priority: itm.priority || 'Medium',
        defaultAssigneeRole: itm.defaultAssigneeRole || '',
        guidelines: itm.guidelines || '',
      })),
    }));

    const template = await dataService.createTemplate({
      name,
      category,
      description: description || '',
      estimatedHours: Number(estimatedHours) || 0,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      sections: formattedSections,
    });

    socketService.broadcastPlatformUpdate('TEMPLATE_CREATED', { template });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const updated = await dataService.updateTemplate(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    socketService.broadcastPlatformUpdate('TEMPLATE_UPDATED', { template: updated, templateId: req.params.id });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await dataService.deleteTemplate(req.params.id);
    socketService.broadcastPlatformUpdate('TEMPLATE_DELETED', { templateId: req.params.id });
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const instantiateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { projectId, title } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const checklist = await dataService.instantiateTemplate(templateId, projectId, title);

    // Log Activity
    const project = await dataService.getProjectById(projectId);
    const user = req.user || req.body.user || { name: 'Team Member', role: 'team_member' };
    await activityService.logActivity({
      user,
      action: 'TEMPLATE_INSTANTIATED',
      projectId: String(projectId),
      projectTitle: project?.title || 'Project',
      projectCode: project?.code || 'RAD',
      message: `${user.name} instantiated checklist "${checklist.title}" into project "${project?.title || 'Project'}"`,
      details: { checklistId: checklist._id || checklist.id, templateId },
    });

    socketService.broadcastPlatformUpdate('CHECKLIST_CREATED', { checklist, projectId });
    res.status(201).json({ success: true, data: checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

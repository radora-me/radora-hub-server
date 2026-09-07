import { dataService } from '../services/dataService.js';
import { socketService } from '../services/socketService.js';
import { activityService } from '../services/activityService.js';

export const getChecklists = async (req, res) => {
  try {
    const { projectId } = req.query;
    const checklists = await dataService.getChecklists(projectId);
    res.json({ success: true, count: checklists.length, data: checklists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChecklistById = async (req, res) => {
  try {
    const checklist = await dataService.getChecklistById(req.params.id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }
    res.json({ success: true, data: checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createChecklist = async (req, res) => {
  try {
    const { projectId, title, description, category, sections, templateId } = req.body;
    if (!projectId || !title) {
      return res.status(400).json({ success: false, message: 'projectId and title are required' });
    }

    const formattedSections = (sections || []).map((sec, sIdx) => ({
      id: sec.id || `sec-${Date.now()}-${sIdx}`,
      name: sec.name || `Section ${sIdx + 1}`,
      items: (sec.items || []).map((item, iIdx) => ({
        id: item.id || `itm-${Date.now()}-${sIdx}-${iIdx}`,
        text: item.text || 'Checklist Item',
        description: item.description || '',
        status: item.status || 'Pending',
        priority: item.priority || 'Medium',
        assignee: item.assignee || '',
        dueDate: item.dueDate || '',
        notes: item.notes || '',
        completedAt: item.status === 'Completed' ? new Date().toISOString() : null,
      })),
    }));

    const checklist = await dataService.createChecklist({
      projectId,
      title,
      description: description || '',
      category: category || 'General',
      templateId: templateId || null,
      sections: formattedSections,
    });

    socketService.broadcastPlatformUpdate('CHECKLIST_CREATED', { checklist, projectId: checklist.projectId });
    res.status(201).json({ success: true, data: checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChecklist = async (req, res) => {
  try {
    const updated = await dataService.updateChecklist(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }
    socketService.broadcastPlatformUpdate('CHECKLIST_UPDATED', { checklist: updated, checklistId: req.params.id });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChecklist = async (req, res) => {
  try {
    await dataService.deleteChecklist(req.params.id);
    socketService.broadcastPlatformUpdate('CHECKLIST_DELETED', { checklistId: req.params.id });
    res.json({ success: true, message: 'Checklist deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateChecklistItem = async (req, res) => {
  try {
    const { id, sectionId, itemId } = req.params;
    const updates = req.body; // e.g. { status, notes, assignee, dueDate, priority, text }

    // Inspect existing item state to detect status transitions
    const existingChecklist = await dataService.getChecklistById(id);
    let oldStatus = null;
    let itemText = '';
    let sectionName = '';
    if (existingChecklist && existingChecklist.sections) {
      const sec = existingChecklist.sections.find(s => s.id === sectionId || s._id === sectionId);
      if (sec) {
        sectionName = sec.name || '';
        const itm = (sec.items || []).find(i => i.id === itemId || i._id === itemId);
        if (itm) {
          oldStatus = itm.status;
          itemText = itm.text || '';
        }
      }
    }

    const result = await dataService.updateChecklistItem(id, sectionId, itemId, updates);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Checklist item or section not found' });
    }

    // Resolve project details for activity log
    let project = null;
    if (existingChecklist && existingChecklist.projectId) {
      project = await dataService.getProjectById(existingChecklist.projectId);
    }

    // Log Activity if status or checkbox toggled
    const newStatus = result.updatedItem?.status;
    const user = req.user || updates.user || { name: 'Team Member', role: 'team_member' };

    if (updates.status && newStatus && newStatus !== oldStatus) {
      const isCompleted = newStatus.toLowerCase() === 'completed';
      const actionType = isCompleted ? 'CHECKLIST_ITEM_CHECKED' : 'CHECKLIST_ITEM_UNCHECKED';
      const currentItemText = result.updatedItem.text || itemText || 'Task';
      const projTitle = project?.title || 'Radora Next';

      const message = isCompleted
        ? `${user.name} marked checkbox "${currentItemText}" as Completed in ${projTitle}`
        : `${user.name} marked checkbox "${currentItemText}" as ${newStatus} in ${projTitle}`;

      await activityService.logActivity({
        user,
        action: actionType,
        projectId: String(project?._id || existingChecklist?.projectId),
        projectTitle: projTitle,
        projectCode: project?.code || 'RAD',
        message,
        details: {
          checklistId: id,
          checklistTitle: existingChecklist?.title,
          sectionId,
          sectionName,
          itemId,
          itemText: currentItemText,
          previousStatus: oldStatus,
          newStatus,
        },
      });
    }

    socketService.broadcastPlatformUpdate('CHECKLIST_ITEM_UPDATED', {
      checklist: result.checklist,
      checklistId: id,
      sectionId,
      itemId,
      updatedItem: result.updatedItem,
    });

    res.json({
      success: true,
      data: result.checklist,
      updatedItem: result.updatedItem,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Section name is required' });
    }

    const checklist = await dataService.getChecklistById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    const newSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      items: [],
    };

    const sections = [...(checklist.sections || []), newSection];
    const updated = await dataService.updateChecklist(id, { sections });

    socketService.broadcastPlatformUpdate('CHECKLIST_UPDATED', { checklist: updated, checklistId: id });
    res.status(201).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addItem = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { text, description, priority, assignee, dueDate } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Item text is required' });
    }

    const checklist = await dataService.getChecklistById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    const sections = JSON.parse(JSON.stringify(checklist.sections || []));
    const section = sections.find(s => s.id === sectionId || s._id === sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const newItem = {
      id: `itm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      description: description || '',
      status: 'Pending',
      priority: priority || 'Medium',
      assignee: assignee || '',
      dueDate: dueDate || '',
      notes: '',
      completedAt: null,
    };

    section.items.push(newItem);
    const updated = await dataService.updateChecklist(id, { sections });

    // Log Activity
    let project = null;
    if (checklist.projectId) {
      project = await dataService.getProjectById(checklist.projectId);
    }
    const user = req.user || req.body.user || { name: 'Team Member', role: 'team_member' };
    await activityService.logActivity({
      user,
      action: 'CHECKLIST_ITEM_ADDED',
      projectId: String(project?._id || checklist.projectId),
      projectTitle: project?.title || 'Radora Next',
      projectCode: project?.code || 'RAD',
      message: `${user.name} added task "${newItem.text}" under section "${section.name}" in ${project?.title || 'project'}`,
      details: {
        checklistId: id,
        sectionId,
        sectionName: section.name,
        itemId: newItem.id,
        itemText: newItem.text,
      }
    });

    socketService.broadcastPlatformUpdate('CHECKLIST_ITEM_ADDED', { checklist: updated, checklistId: id, sectionId, newItem });
    res.status(201).json({ success: true, data: updated, newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id, sectionId, itemId } = req.params;
    const checklist = await dataService.getChecklistById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    const sections = JSON.parse(JSON.stringify(checklist.sections || []));
    const section = sections.find(s => s.id === sectionId || s._id === sectionId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const itemToDelete = section.items.find(i => i.id === itemId || i._id === itemId);
    const deletedText = itemToDelete?.text || 'task';

    section.items = section.items.filter(i => i.id !== itemId && i._id !== itemId);
    const updated = await dataService.updateChecklist(id, { sections });

    // Log Activity
    let project = null;
    if (checklist.projectId) {
      project = await dataService.getProjectById(checklist.projectId);
    }
    const user = req.user || { name: 'Team Member', role: 'team_member' };
    await activityService.logActivity({
      user,
      action: 'CHECKLIST_ITEM_DELETED',
      projectId: String(project?._id || checklist.projectId),
      projectTitle: project?.title || 'Radora Next',
      projectCode: project?.code || 'RAD',
      message: `${user.name} removed task "${deletedText}" from section "${section.name}" in ${project?.title || 'project'}`,
      details: {
        checklistId: id,
        sectionId,
        sectionName: section.name,
        itemId,
        itemText: deletedText,
      }
    });

    socketService.broadcastPlatformUpdate('CHECKLIST_ITEM_DELETED', { checklist: updated, checklistId: id, sectionId, itemId });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'complete_all' | 'reset_all'

    const checklist = await dataService.getChecklistById(id);
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    const sections = JSON.parse(JSON.stringify(checklist.sections || []));
    sections.forEach(sec => {
      sec.items.forEach(itm => {
        if (action === 'complete_all') {
          itm.status = 'Completed';
          itm.completedAt = itm.completedAt || new Date().toISOString();
        } else if (action === 'reset_all') {
          itm.status = 'Pending';
          itm.completedAt = null;
        }
      });
    });

    const updated = await dataService.updateChecklist(id, { sections });
    socketService.broadcastPlatformUpdate('CHECKLIST_UPDATED', { checklist: updated, checklistId: id });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

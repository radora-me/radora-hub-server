import { activityService } from '../services/activityService.js';

export const getActivities = async (req, res) => {
  try {
    const { projectId, action, limit, page } = req.query;
    const result = await activityService.getActivities({
      projectId,
      action,
      limit: parseInt(limit, 10) || 40,
      page: parseInt(page, 10) || 1,
    });

    res.json({
      success: true,
      data: result.activities,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activities',
    });
  }
};

export const getActivityStats = async (req, res) => {
  try {
    const result = await activityService.getActivities({ limit: 100 });
    const all = result.activities || [];

    const actionCounts = {
      checkboxes: all.filter(a => ['CHECKLIST_ITEM_CHECKED', 'CHECKLIST_ITEM_UNCHECKED'].includes(a.action)).length,
      statusChanges: all.filter(a => a.action === 'PROJECT_STATUS_CHANGED').length,
      projectUpdates: all.filter(a => ['PROJECT_UPDATED', 'PROJECT_CREATED', 'PROJECT_DELETED'].includes(a.action)).length,
      taskAdditions: all.filter(a => ['CHECKLIST_ITEM_ADDED', 'TEMPLATE_INSTANTIATED'].includes(a.action)).length,
    };

    res.json({
      success: true,
      data: {
        totalRecorded: result.total,
        actionCounts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch activity stats',
    });
  }
};

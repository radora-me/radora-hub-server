import { dataService } from '../services/dataService.js';

export const getAnalytics = async (req, res) => {
  try {
    const stats = await dataService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetData = async (req, res) => {
  try {
    const data = dataService.resetDatabase();
    res.json({ success: true, message: 'Database reset to default Radora demo data', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

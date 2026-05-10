import Report from '../models/Report.js';

export const createReport = async (req, res) => {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    const report = await Report.create({
      subject,
      description,
      createdBy: req.user.userId
    });
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const listMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.user.userId }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const express = require('express');
const router = express.Router();
const FormSubmission = require('../models/FormSubmission');
const Form = require('../models/Form');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// Get all submissions for a form (admin only)
router.get('/form/:formId', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = { form: req.params.formId };
    
    if (status) query.status = status;
    if (search) {
      // Search in submission data (this is a simplified search)
      query.$or = [
        { 'submitterInfo.email': { $regex: search, $options: 'i' } },
        { 'submitterInfo.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const submissions = await FormSubmission.find(query)
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await FormSubmission.countDocuments(query);

    res.json({
      submissions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

// Get single submission (admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id)
      .populate('form', 'title fields')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name')
      .populate('sourceRef');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ message: 'Error fetching submission' });
  }
});

// Update submission status (admin only)
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['pending', 'reviewed', 'approved', 'rejected', 'spam'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const submission = await FormSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = status;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    if (reviewNotes) submission.reviewNotes = reviewNotes;

    await submission.save();

    await submission.populate([
      { path: 'submittedBy', select: 'name email' },
      { path: 'reviewedBy', select: 'name' }
    ]);

    res.json(submission);
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ message: 'Error updating submission status' });
  }
});

// Flag/unflag submission (admin only)
router.put('/:id/flag', auth, adminAuth, async (req, res) => {
  try {
    const { flagged, flagReason } = req.body;

    const submission = await FormSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.flagged = flagged;
    if (flagged && flagReason) {
      submission.flagReason = flagReason;
    } else if (!flagged) {
      submission.flagReason = undefined;
    }

    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error('Error flagging submission:', error);
    res.status(500).json({ message: 'Error flagging submission' });
  }
});

// Delete submission (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const submission = await FormSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Delete associated files
    if (submission.files && submission.files.length > 0) {
      for (let file of submission.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Update form submission count
    await Form.findByIdAndUpdate(submission.form, { $inc: { submissions: -1 } });

    await FormSubmission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Error deleting submission' });
  }
});

// Export form submissions as CSV (admin only)
router.get('/form/:formId/export', auth, adminAuth, async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;

    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Build query
    const query = { form: req.params.formId };
    if (status && status !== 'all') query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const submissions = await FormSubmission.find(query)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    if (submissions.length === 0) {
      return res.status(400).json({ message: 'No submissions found for export' });
    }

    // Prepare CSV data
    const csvData = [];
    const headers = [
      { id: 'submissionId', title: 'Submission ID' },
      { id: 'submittedAt', title: 'Submitted At' },
      { id: 'submitterName', title: 'Submitter Name' },
      { id: 'submitterEmail', title: 'Submitter Email' },
      { id: 'status', title: 'Status' },
    ];

    // Add dynamic field headers
    const fieldHeaders = new Set();
    submissions.forEach(submission => {
      // Convert Map to object and iterate over keys
      const dataObj = submission.data.toObject ? submission.data.toObject() : submission.data;
      for (let key of Object.keys(dataObj)) {
        fieldHeaders.add(key);
      }
    });

    fieldHeaders.forEach(fieldId => {
      const field = form.fields.find(f => f.id === fieldId);
      headers.push({
        id: fieldId,
        title: field ? field.label : fieldId
      });
    });

    // Process each submission
    submissions.forEach(submission => {
      const row = {
        submissionId: submission._id.toString(),
        submittedAt: submission.createdAt.toISOString(),
        submitterName: submission.submittedBy?.name || submission.submitterInfo?.name || 'Anonymous',
        submitterEmail: submission.submittedBy?.email || submission.submitterInfo?.email || '',
        status: submission.status,
      };

      // Add field data
      const dataObj = submission.data.toObject ? submission.data.toObject() : submission.data;
      for (let key of Object.keys(dataObj)) {
        const value = dataObj[key];
        row[key] = Array.isArray(value) ? value.join(', ') : value;
      }

      csvData.push(row);
    });

    // Create CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${form.title.replace(/[^a-z0-9]/gi, '_')}_submissions_${timestamp}.csv`;
    const filepath = path.join(__dirname, '../exports', filename);

    // Ensure exports directory exists
    const exportsDir = path.dirname(filepath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filepath,
      header: headers
    });

    await csvWriter.writeRecords(csvData);

    // Send file as download
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
      
      // Delete file after download
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }, 60000); // Delete after 1 minute
    });

  } catch (error) {
    console.error('Error exporting submissions:', error);
    res.status(500).json({ message: 'Error exporting submissions' });
  }
});

// Get submission statistics for a form (admin only)
router.get('/form/:formId/stats', auth, adminAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    switch (period) {
      case '7d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case 'all':
        dateFilter = {};
        break;
    }

    const baseQuery = { form: req.params.formId, ...dateFilter };

    // Get basic stats
    const [
      totalSubmissions,
      statusBreakdown,
      dailySubmissions,
      topSubmitters
    ] = await Promise.all([
      FormSubmission.countDocuments(baseQuery),
      
      FormSubmission.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      FormSubmission.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      FormSubmission.aggregate([
        { $match: { ...baseQuery, submittedBy: { $ne: null } } },
        {
          $group: {
            _id: '$submittedBy',
            count: { $sum: 1 },
            lastSubmission: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        }
      ])
    ]);

    res.json({
      totalSubmissions,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      dailySubmissions,
      topSubmitters: topSubmitters.map(item => ({
        user: item.user[0],
        count: item.count,
        lastSubmission: item.lastSubmission
      }))
    });

  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({ message: 'Error fetching submission stats' });
  }
});

// Bulk actions on submissions (admin only)
router.post('/bulk-action', auth, adminAuth, async (req, res) => {
  try {
    const { action, submissionIds, status, flagReason } = req.body;

    if (!action || !submissionIds || !Array.isArray(submissionIds)) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    let updateData = {};
    let result = {};

    switch (action) {
      case 'updateStatus':
        if (!status) {
          return res.status(400).json({ message: 'Status is required' });
        }
        updateData = {
          status,
          reviewedBy: req.user.id,
          reviewedAt: new Date()
        };
        break;
        
      case 'flag':
        updateData = {
          flagged: true,
          flagReason: flagReason || 'Flagged by admin'
        };
        break;
        
      case 'unflag':
        updateData = {
          flagged: false,
          $unset: { flagReason: 1 }
        };
        break;
        
      case 'delete':
        // Handle file deletion for each submission
        const submissions = await FormSubmission.find({ _id: { $in: submissionIds } });
        for (let submission of submissions) {
          if (submission.files && submission.files.length > 0) {
            for (let file of submission.files) {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            }
          }
        }
        
        result = await FormSubmission.deleteMany({ _id: { $in: submissionIds } });
        
        // Update form submission counts
        const formCounts = {};
        submissions.forEach(sub => {
          formCounts[sub.form] = (formCounts[sub.form] || 0) + 1;
        });
        
        for (let [formId, count] of Object.entries(formCounts)) {
          await Form.findByIdAndUpdate(formId, { $inc: { submissions: -count } });
        }
        
        return res.json({ 
          message: `${result.deletedCount} submissions deleted successfully`,
          deletedCount: result.deletedCount
        });
        
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    if (action !== 'delete') {
      result = await FormSubmission.updateMany(
        { _id: { $in: submissionIds } },
        updateData
      );
    }

    res.json({
      message: `${result.modifiedCount || result.matchedCount} submissions updated successfully`,
      modifiedCount: result.modifiedCount || result.matchedCount
    });

  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ message: 'Error performing bulk action' });
  }
});

module.exports = router;

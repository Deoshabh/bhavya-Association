const express = require('express');
const router = express.Router();
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { upload } = require('../middleware/upload');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-writer');

// Configure multer for form file uploads
const formFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/forms');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `form-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadFormFiles = multer({
  storage: formFileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Get all forms (admin only)
router.get('/admin/all', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const forms = await Form.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Form.countDocuments(query);

    // Add submission count for each form
    for (let form of forms) {
      const submissionCount = await FormSubmission.countDocuments({ form: form._id });
      form.submissionCount = submissionCount;
    }

    res.json({
      forms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ message: 'Error fetching forms' });
  }
});

// Get single form by ID (admin)
router.get('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('embedSettings.allowedPosts', 'title slug')
      .populate('embedSettings.allowedQuestions', 'title');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Get submission statistics
    const submissionStats = await FormSubmission.aggregate([
      { $match: { form: form._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: 0,
      pending: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0,
      spam: 0
    };

    submissionStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });

    res.json({ form, stats });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ message: 'Error fetching form' });
  }
});

// Create new form (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      fields,
      settings,
      category,
      tags,
      embedSettings
    } = req.body;

    if (!title || !fields || fields.length === 0) {
      return res.status(400).json({
        message: 'Title and at least one field are required'
      });
    }

    // Validate fields
    for (let field of fields) {
      if (!field.type || !field.label) {
        return res.status(400).json({
          message: 'Each field must have a type and label'
        });
      }
    }

    const form = new Form({
      title,
      description,
      fields,
      settings: settings || {},
      category: category || 'other',
      tags: tags || [],
      embedSettings: embedSettings || {},
      createdBy: req.user.id
    });

    await form.save();
    
    await form.populate('createdBy', 'name email');

    res.status(201).json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Form with this slug already exists' });
    } else {
      res.status(500).json({ message: 'Error creating form' });
    }
  }
});

// Update form (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      fields,
      settings,
      status,
      category,
      tags,
      embedSettings
    } = req.body;

    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Update fields
    if (title) form.title = title;
    if (description !== undefined) form.description = description;
    if (fields) form.fields = fields;
    if (settings) form.settings = { ...form.settings, ...settings };
    if (status) form.status = status;
    if (category) form.category = category;
    if (tags) form.tags = tags;
    if (embedSettings) form.embedSettings = { ...form.embedSettings, ...embedSettings };

    await form.save();
    await form.populate('createdBy', 'name email');

    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ message: 'Error updating form' });
  }
});

// Delete form (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Check if form has submissions
    const submissionCount = await FormSubmission.countDocuments({ form: form._id });
    if (submissionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete form with existing submissions. Archive it instead.'
      });
    }

    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ message: 'Error deleting form' });
  }
});

// Get public form by slug (for embedding and public access)
router.get('/public/:slug', async (req, res) => {
  try {
    const form = await Form.findOne({ 
      slug: req.params.slug,
      status: 'active'
    }).lean();

    if (!form) {
      return res.status(404).json({ message: 'Form not found or inactive' });
    }

    // Remove sensitive information
    delete form.settings.emailNotification;
    delete form.createdBy;

    res.json(form);
  } catch (error) {
    console.error('Error fetching public form:', error);
    res.status(500).json({ message: 'Error fetching form' });
  }
});

// Submit form (public or authenticated)
router.post('/submit/:slug', uploadFormFiles.any(), async (req, res) => {
  try {
    const form = await Form.findOne({ 
      slug: req.params.slug,
      status: 'active'
    });

    if (!form) {
      return res.status(404).json({ message: 'Form not found or inactive' });
    }

    // Check if user can submit
    const userId = req.user?.id;
    const canSubmit = await FormSubmission.canUserSubmit(form._id, userId);
    
    if (!canSubmit.canSubmit) {
      return res.status(400).json({ message: canSubmit.reason });
    }

    // Process form data
    const formData = new Map();
    const files = [];

    // Process regular fields
    for (let field of form.fields) {
      const value = req.body[field.id];
      if (value !== undefined) {
        formData.set(field.id, value);
      }
    }

    // Process file uploads
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        files.push({
          fieldId: file.fieldname,
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        });
      }
    }

    // Validate required fields
    for (let field of form.fields) {
      if (field.required && !formData.has(field.id)) {
        return res.status(400).json({
          message: `Field "${field.label}" is required`
        });
      }
    }

    // Create submission
    const submissionData = {
      form: form._id,
      data: formData,
      submitterInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body.email || null,
        name: req.body.name || null
      },
      source: req.body.source || 'direct',
      sourceRef: req.body.sourceRef || null,
      sourceModel: req.body.sourceModel || null,
      files: files
    };

    // Only add submittedBy if login is required or user is authenticated
    if (form.settings.requireLogin || userId) {
      submissionData.submittedBy = userId;
    }

    const submission = new FormSubmission(submissionData);

    await submission.save();

    // Update form submission count
    await Form.findByIdAndUpdate(form._id, { $inc: { submissions: 1 } });

    // Send email notification if enabled
    if (form.settings.emailNotification?.enabled) {
      // TODO: Implement email notification
      console.log('Email notification would be sent here');
    }

    res.status(201).json({
      message: form.settings.successMessage || 'Thank you for your submission!',
      submissionId: submission._id,
      redirectUrl: form.settings.redirectUrl || null
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Error submitting form' });
  }
});

module.exports = router;

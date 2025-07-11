const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all questions with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      status = 'active',
      search,
      tags,
      featured,
      author,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { status };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (author) {
      query.author = author;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const questions = await Question.find(query)
      .populate('author', 'name profileImage planType')
      .populate('bestAnswer', 'content author')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Question.countDocuments(query);

    // Add computed fields
    const questionsWithComputed = questions.map(question => ({
      ...question,
      likeCount: question.likes ? question.likes.length : 0,
      totalVotes: question.type === 'poll' && question.pollOptions
        ? question.pollOptions.reduce((total, option) => 
            total + (option.votes ? option.votes.length : 0), 0)
        : 0
    }));

    res.json({
      questions: questionsWithComputed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending/popular questions
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get questions with high engagement (likes + answers + views)
    const questions = await Question.aggregate([
      { $match: { status: 'active' } },
      {
        $addFields: {
          likeCount: { $size: { $ifNull: ['$likes', []] } },
          engagement: {
            $add: [
              { $size: { $ifNull: ['$likes', []] } },
              { $multiply: ['$answerCount', 2] }, // Weight answers more
              { $divide: ['$views', 10] } // Weight views less
            ]
          }
        }
      },
      { $sort: { engagement: -1, createdAt: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { name: 1, profileImage: 1, planType: 1 } }]
        }
      },
      { $unwind: '$author' }
    ]);

    res.json({ questions });
  } catch (error) {
    console.error('Error fetching trending questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single question by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by slug first, then by ID
    let question = await Question.findOne({ slug: identifier })
      .populate('author', 'name profileImage planType bio')
      .populate({
        path: 'answers',
        populate: {
          path: 'author',
          select: 'name profileImage planType'
        }
      })
      .populate('bestAnswer');

    if (!question) {
      question = await Question.findById(identifier)
        .populate('author', 'name profileImage planType bio')
        .populate({
          path: 'answers',
          populate: {
            path: 'author',
            select: 'name profileImage planType'
          }
        })
        .populate('bestAnswer');
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Increment view count
    await Question.findByIdAndUpdate(question._id, { $inc: { views: 1 } });

    // Get answers for this question
    const answers = await Answer.find({ question: question._id, status: 'active' })
      .populate('author', 'name profileImage planType')
      .sort({ isBestAnswer: -1, createdAt: 1 });

    res.json({
      question: {
        ...question.toObject(),
        likeCount: question.likes ? question.likes.length : 0,
        totalVotes: question.type === 'poll' && question.pollOptions
          ? question.pollOptions.reduce((total, option) => 
              total + (option.votes ? option.votes.length : 0), 0)
          : 0
      },
      answers: answers.map(answer => ({
        ...answer.toObject(),
        likeCount: answer.likes ? answer.likes.length : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new question (authenticated users only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      category,
      tags,
      priority,
      pollOptions,
      allowMultipleVotes,
      pollExpiresAt
    } = req.body;

    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    // Validate poll-specific fields
    if (type === 'poll') {
      if (!pollOptions || pollOptions.length < 2) {
        return res.status(400).json({ message: 'Polls must have at least 2 options' });
      }
      if (!pollExpiresAt) {
        return res.status(400).json({ message: 'Poll expiration date is required' });
      }
    }

    const questionData = {
      title: title.trim(),
      content: content.trim(),
      type: type || 'question',
      category,
      author: req.user.id,
      priority: priority || 'normal'
    };

    if (tags) {
      questionData.tags = Array.isArray(tags) 
        ? tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
        : tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    if (type === 'poll') {
      questionData.pollOptions = pollOptions.map(option => ({
        option: option.trim(),
        votes: []
      }));
      questionData.allowMultipleVotes = allowMultipleVotes || false;
      questionData.pollExpiresAt = new Date(pollExpiresAt);
    }

    const question = new Question(questionData);
    await question.save();

    // Populate author info for response
    await question.populate('author', 'name profileImage planType');

    res.status(201).json({
      message: 'Question created successfully',
      question: {
        ...question.toObject(),
        likeCount: 0,
        totalVotes: 0
      }
    });
  } catch (error) {
    console.error('Error creating question:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update question (author or admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is author or admin
    const isAuthor = question.author.toString() === req.user.id;
    const isAdmin = req.user.planType === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this question' });
    }

    const {
      title,
      content,
      category,
      tags,
      priority,
      status,
      featured
    } = req.body;

    const updateData = {};

    if (title) updateData.title = title.trim();
    if (content) updateData.content = content.trim();
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;
    
    if (tags) {
      updateData.tags = Array.isArray(tags) 
        ? tags.map(tag => tag.trim()).filter(tag => tag.length > 0)
        : tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    // Only admin can update status and featured
    if (isAdmin) {
      if (status) updateData.status = status;
      if (featured !== undefined) updateData.featured = featured;
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name profileImage planType');

    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete question (author or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user is author or admin
    const isAuthor = question.author.toString() === req.user.id;
    const isAdmin = req.user.planType === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    // Delete all answers associated with this question
    await Answer.deleteMany({ question: question._id });

    // Delete the question
    await Question.findByIdAndDelete(req.params.id);

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike question
router.post('/:id/like', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const userId = req.user.id;
    const existingLike = question.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      // Unlike
      question.likes = question.likes.filter(like => like.user.toString() !== userId);
    } else {
      // Like
      question.likes.push({ user: userId });
    }

    await question.save();

    res.json({
      liked: !existingLike,
      likeCount: question.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on poll
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.type !== 'poll') {
      return res.status(400).json({ message: 'This is not a poll question' });
    }

    if (question.pollExpiresAt && new Date() > question.pollExpiresAt) {
      return res.status(400).json({ message: 'This poll has expired' });
    }

    if (optionIndex < 0 || optionIndex >= question.pollOptions.length) {
      return res.status(400).json({ message: 'Invalid poll option' });
    }

    const userId = req.user.id;

    // Check if user has already voted
    const hasVoted = question.pollOptions.some(option => 
      option.votes.some(vote => vote.user.toString() === userId)
    );

    if (hasVoted && !question.allowMultipleVotes) {
      return res.status(400).json({ message: 'You have already voted on this poll' });
    }

    // If not allowing multiple votes, remove existing vote
    if (!question.allowMultipleVotes) {
      question.pollOptions.forEach(option => {
        option.votes = option.votes.filter(vote => vote.user.toString() !== userId);
      });
    }

    // Add new vote
    question.pollOptions[optionIndex].votes.push({ user: userId });

    await question.save();

    // Calculate vote counts for response
    const pollResults = question.pollOptions.map(option => ({
      option: option.option,
      voteCount: option.votes.length
    }));

    const totalVotes = pollResults.reduce((sum, option) => sum + option.voteCount, 0);

    res.json({
      message: 'Vote recorded successfully',
      pollResults,
      totalVotes
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report question
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user has already reported
    const existingReport = question.reports.find(
      report => report.user.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this question' });
    }

    question.reports.push({
      user: req.user.id,
      reason,
      details: details || ''
    });

    question.reportCount = question.reports.length;

    await question.save();

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error reporting question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get question statistics (admin only)
router.get('/admin/stats', auth, adminAuth, async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          reported: {
            $sum: { $cond: [{ $eq: ['$status', 'reported'] }, 1, 0] }
          },
          questions: {
            $sum: { $cond: [{ $eq: ['$type', 'question'] }, 1, 0] }
          },
          discussions: {
            $sum: { $cond: [{ $eq: ['$type', 'discussion'] }, 1, 0] }
          },
          polls: {
            $sum: { $cond: [{ $eq: ['$type', 'poll'] }, 1, 0] }
          },
          opinions: {
            $sum: { $cond: [{ $eq: ['$type', 'opinion'] }, 1, 0] }
          }
        }
      }
    ]);

    const answerStats = await Answer.aggregate([
      {
        $group: {
          _id: null,
          totalAnswers: { $sum: 1 },
          activeAnswers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          reportedAnswers: {
            $sum: { $cond: [{ $eq: ['$status', 'reported'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      questions: stats[0] || {
        total: 0, active: 0, closed: 0, reported: 0,
        questions: 0, discussions: 0, polls: 0, opinions: 0
      },
      answers: answerStats[0] || {
        totalAnswers: 0, activeAnswers: 0, reportedAnswers: 0
      }
    });
  } catch (error) {
    console.error('Error fetching Q&A stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

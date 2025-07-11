const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get answers for a specific question
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options: 'createdAt', '-createdAt', 'likes', '-likes', 'best'
    let sortOption = {};
    switch (sort) {
      case '-createdAt':
        sortOption = { createdAt: -1 };
        break;
      case 'likes':
        sortOption = { likeCount: 1 };
        break;
      case '-likes':
        sortOption = { likeCount: -1 };
        break;
      case 'best':
        sortOption = { isBestAnswer: -1, createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: 1 };
    }

    const answers = await Answer.find({ 
      question: questionId, 
      status: 'active' 
    })
      .populate('author', 'name profileImage planType')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Answer.countDocuments({ 
      question: questionId, 
      status: 'active' 
    });

    const answersWithComputed = answers.map(answer => ({
      ...answer,
      likeCount: answer.likes ? answer.likes.length : 0
    }));

    res.json({
      answers: answersWithComputed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single answer by ID
router.get('/:id', async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id)
      .populate('author', 'name profileImage planType bio')
      .populate('question', 'title slug');

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    res.json({
      answer: {
        ...answer.toObject(),
        likeCount: answer.likes ? answer.likes.length : 0
      }
    });
  } catch (error) {
    console.error('Error fetching answer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new answer (authenticated users only)
router.post('/', auth, async (req, res) => {
  try {
    const { content, questionId } = req.body;

    if (!content || !questionId) {
      return res.status(400).json({ message: 'Content and question ID are required' });
    }

    // Check if question exists and is active
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.status !== 'active') {
      return res.status(400).json({ message: 'Cannot answer this question' });
    }

    const answer = new Answer({
      content: content.trim(),
      question: questionId,
      author: req.user.id
    });

    await answer.save();

    // Add answer reference to question
    await Question.findByIdAndUpdate(questionId, {
      $push: { answers: answer._id },
      $inc: { answerCount: 1 }
    });

    // Populate author info for response
    await answer.populate('author', 'name profileImage planType');

    res.status(201).json({
      message: 'Answer created successfully',
      answer: {
        ...answer.toObject(),
        likeCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating answer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update answer (author or admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is author or admin
    const isAuthor = answer.author.toString() === req.user.id;
    const isAdmin = req.user.planType === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this answer' });
    }

    const { content, status } = req.body;

    const updateData = {};
    if (content) updateData.content = content.trim();
    
    // Only admin can update status
    if (isAdmin && status) {
      updateData.status = status;
    }

    const updatedAnswer = await Answer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name profileImage planType');

    res.json({
      message: 'Answer updated successfully',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Error updating answer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete answer (author or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user is author or admin
    const isAuthor = answer.author.toString() === req.user.id;
    const isAdmin = req.user.planType === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this answer' });
    }

    // Remove answer reference from question
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id },
      $inc: { answerCount: -1 }
    });

    // If this was the best answer, remove it
    await Question.findOneAndUpdate(
      { bestAnswer: answer._id },
      { $unset: { bestAnswer: 1 } }
    );

    // Delete the answer
    await Answer.findByIdAndDelete(req.params.id);

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike answer
router.post('/:id/like', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user.id;
    const existingLike = answer.likes.find(like => like.user.toString() === userId);

    if (existingLike) {
      // Unlike
      answer.likes = answer.likes.filter(like => like.user.toString() !== userId);
    } else {
      // Like
      answer.likes.push({ user: userId });
    }

    await answer.save();

    res.json({
      liked: !existingLike,
      likeCount: answer.likes.length
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as best answer (question author or admin only)
router.post('/:id/mark-best', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('question');
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const question = answer.question;
    
    // Check if user is question author or admin
    const isQuestionAuthor = question.author.toString() === req.user.id;
    const isAdmin = req.user.planType === 'admin';

    if (!isQuestionAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to mark best answer' });
    }

    // Remove best answer status from other answers
    await Answer.updateMany(
      { question: question._id },
      { isBestAnswer: false }
    );

    // Mark this answer as best
    answer.isBestAnswer = true;
    await answer.save();

    // Update question's best answer reference
    await Question.findByIdAndUpdate(question._id, {
      bestAnswer: answer._id
    });

    res.json({ message: 'Answer marked as best answer' });
  } catch (error) {
    console.error('Error marking best answer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to answer
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const answer = await Answer.findById(req.params.id);
    
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const comment = {
      author: req.user.id,
      content: content.trim()
    };

    answer.comments.push(comment);
    await answer.save();

    // Populate the new comment with author info
    await answer.populate('comments.author', 'name profileImage planType');
    const newComment = answer.comments[answer.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report answer
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user has already reported
    const existingReport = answer.reports.find(
      report => report.user.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this answer' });
    }

    answer.reports.push({
      user: req.user.id,
      reason,
      details: details || ''
    });

    answer.reportCount = answer.reports.length;

    await answer.save();

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error reporting answer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's answers (with pagination)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const answers = await Answer.find({ 
      author: userId, 
      status: 'active' 
    })
      .populate('question', 'title slug category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Answer.countDocuments({ 
      author: userId, 
      status: 'active' 
    });

    const answersWithComputed = answers.map(answer => ({
      ...answer,
      likeCount: answer.likes ? answer.likes.length : 0
    }));

    res.json({
      answers: answersWithComputed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user answers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

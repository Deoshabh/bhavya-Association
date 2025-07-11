import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  CheckCircle, 
  Edit, 
  Trash2,
  Calendar,
  Share2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import BackButton from '../components/BackButton';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/questions/${id}`);
        setQuestion(response.data.question);
        setAnswers(response.data.answers || []);
        
        // Check if user has liked this question
        if (user && response.data.question.likes) {
          setLiked(response.data.question.likes.some(like => like.user === user.id));
        }
        
        // Check if user has voted in poll
        if (response.data.question.type === 'poll' && user) {
          const userVoted = response.data.question.pollOptions?.some(option =>
            option.votes?.some(vote => vote.user === user.id)
          );
          setHasVoted(userVoted);
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        if (error.response?.status === 404) {
          setError('Question not found');
        } else {
          setError('Failed to load question');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like this question');
      return;
    }

    try {
      const response = await api.post(`/questions/${question._id}/like`);
      setLiked(response.data.liked);
      setQuestion(prev => ({
        ...prev,
        likeCount: response.data.likeCount
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleVote = async (optionIndex) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    if (hasVoted && !question.allowMultipleVotes) {
      alert('You have already voted on this poll');
      return;
    }

    try {
      const response = await api.post(`/questions/${question._id}/vote`, {
        optionIndex
      });
      
      // Update poll results
      setQuestion(prev => ({
        ...prev,
        totalVotes: response.data.totalVotes,
        pollOptions: prev.pollOptions.map((option, index) => ({
          ...option,
          voteCount: response.data.pollResults[index].voteCount
        }))
      }));
      
      setHasVoted(true);
      alert('Vote recorded successfully!');
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.response?.data?.message || 'Failed to record vote');
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to answer this question');
      return;
    }

    if (!newAnswer.trim()) {
      return;
    }

    try {
      setSubmittingAnswer(true);
      const response = await api.post('/answers', {
        content: newAnswer.trim(),
        questionId: question._id
      });
      
      setAnswers(prev => [...prev, response.data.answer]);
      setQuestion(prev => ({
        ...prev,
        answerCount: prev.answerCount + 1
      }));
      setNewAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleAnswerLike = async (answerId) => {
    if (!user) {
      alert('Please login to like answers');
      return;
    }

    try {
      const response = await api.post(`/answers/${answerId}/like`);
      setAnswers(prev => prev.map(answer => 
        answer._id === answerId 
          ? { ...answer, likeCount: response.data.likeCount }
          : answer
      ));
    } catch (error) {
      console.error('Error toggling answer like:', error);
    }
  };

  const handleMarkBestAnswer = async (answerId) => {
    try {
      await api.post(`/answers/${answerId}/mark-best`);
      
      // Update answers to reflect the best answer
      setAnswers(prev => prev.map(answer => ({
        ...answer,
        isBestAnswer: answer._id === answerId
      })));
      
      setQuestion(prev => ({
        ...prev,
        bestAnswer: answerId
      }));
      
      alert('Answer marked as best answer!');
    } catch (error) {
      console.error('Error marking best answer:', error);
      alert('Failed to mark as best answer');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await api.delete(`/questions/${question._id}`);
        navigate('/questions');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: question.title,
          text: question.content,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800',
      'business': 'bg-blue-100 text-blue-800',
      'education': 'bg-green-100 text-green-800',
      'technology': 'bg-purple-100 text-purple-800',
      'health': 'bg-red-100 text-red-800',
      'social': 'bg-pink-100 text-pink-800',
      'politics': 'bg-orange-100 text-orange-800',
      'culture': 'bg-indigo-100 text-indigo-800',
      'other': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'question': return '❓';
      case 'discussion': return '💬';
      case 'poll': return '📊';
      case 'opinion': return '💭';
      default: return '❓';
    }
  };

  const isAuthor = user && question && question.author._id === user.id;
  const canMarkBestAnswer = isAuthor || (user && user.planType === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/questions"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Questions
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton />
          
          {/* Question Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getTypeIcon(question.type)}</span>
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(question.category)}`}>
                    {question.category}
                  </span>
                  {question.featured && (
                    <span className="ml-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  )}
                  <span className={`ml-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    question.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    question.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    question.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {question.priority}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isAuthor && (
                  <>
                    <Link
                      to={`/questions/${question._id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {question.title}
            </h1>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-6">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {question.content}
              </p>
            </div>

            {/* Poll Section */}
            {question.type === 'poll' && question.pollOptions && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Poll</h3>
                  <div className="text-sm text-gray-600">
                    {question.totalVotes || 0} votes
                  </div>
                </div>

                {question.pollExpiresAt && new Date(question.pollExpiresAt) > new Date() ? (
                  <div className="mb-4 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Expires: {formatDate(question.pollExpiresAt)}
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-red-600">
                    This poll has expired
                  </div>
                )}

                <div className="space-y-3">
                  {question.pollOptions.map((option, index) => {
                    const voteCount = option.voteCount || (option.votes ? option.votes.length : 0);
                    const percentage = question.totalVotes > 0 
                      ? Math.round((voteCount / question.totalVotes) * 100) 
                      : 0;

                    return (
                      <div key={index} className="relative">
                        <button
                          onClick={() => handleVote(index)}
                          disabled={!user || (hasVoted && !question.allowMultipleVotes) || 
                                   (question.pollExpiresAt && new Date(question.pollExpiresAt) <= new Date())}
                          className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex justify-between items-center">
                            <span>{option.option}</span>
                            <span className="text-sm text-gray-600">
                              {voteCount} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="mt-2 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {question.allowMultipleVotes && (
                  <p className="text-xs text-gray-500 mt-3">
                    Multiple votes allowed
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats and Actions */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      liked 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span>{question.likeCount || 0}</span>
                  </button>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageCircle className="w-5 h-5" />
                    <span>{question.answerCount || 0} answers</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Eye className="w-5 h-5" />
                    <span>{question.views || 0} views</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <img
                      src={question.author?.profileImage || '/default-avatar.png'}
                      alt={question.author?.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{question.author?.name}</div>
                      <div className="text-xs">{formatDate(question.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Answers Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Answers ({answers.length})
            </h2>

            {/* Answer Form */}
            {user && question.status === 'active' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
                <form onSubmit={handleAnswerSubmit}>
                  <textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Write your answer here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={1500}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-xs text-gray-500">
                      {newAnswer.length}/1500
                    </div>
                    <button
                      type="submit"
                      disabled={submittingAnswer || !newAnswer.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingAnswer ? 'Posting...' : 'Post Answer'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Answers List */}
            <div className="space-y-6">
              {answers.map(answer => (
                <div
                  key={answer._id}
                  className={`bg-white rounded-lg shadow-sm border p-6 ${
                    answer.isBestAnswer ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  {answer.isBestAnswer && (
                    <div className="flex items-center mb-4 text-green-700">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Best Answer</span>
                    </div>
                  )}

                  <div className="prose prose-lg max-w-none mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {answer.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleAnswerLike(answer._id)}
                        className="flex items-center space-x-2 px-3 py-1 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span>{answer.likeCount || 0}</span>
                      </button>
                      
                      {canMarkBestAnswer && !answer.isBestAnswer && (
                        <button
                          onClick={() => handleMarkBestAnswer(answer._id)}
                          className="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          Mark as Best
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <img
                        src={answer.author?.profileImage || '/default-avatar.png'}
                        alt={answer.author?.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{answer.author?.name}</span>
                      <span>•</span>
                      <span>{formatDate(answer.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {answers.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No answers yet</h3>
                <p className="text-gray-600">Be the first to answer this question!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetail;

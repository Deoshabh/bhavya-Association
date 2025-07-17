import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Share2,
  Tag,
  User,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const NewsDetail = () => {
  const { slug } = useParams();
  const { user, api: contextApi } = useContext(AuthContext);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchNews();
    }
  }, [slug]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/news/${slug}`);
      const newsData = response.data;

      setNews(newsData);
      setLikeCount(newsData.likeCount || 0);
      setComments(newsData.comments || []);

      // Check if user has liked this news
      if (user && newsData.likes) {
        setLiked(newsData.likes.includes(user.id));
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      if (error.response?.status === 404) {
        setError("News article not found");
      } else {
        setError("Failed to load news article");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("Please login to like this post");
      return;
    }

    try {
      const response = await contextApi.post(`/news/${news._id}/like`);
      setLiked(response.data.liked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Error liking news:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment");
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await contextApi.post(`/news/${news._id}/comments`, {
        content: newComment.trim(),
      });

      setComments((prev) => [...prev, response.data]);
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      news: "bg-blue-100 text-blue-800",
      event: "bg-green-100 text-green-800",
      announcement: "bg-orange-100 text-orange-800",
      "press-release": "bg-purple-100 text-purple-800",
      "photo-gallery": "bg-pink-100 text-pink-800",
      notice: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: news.title,
          text: news.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // Debug the image path
    console.log("Processing image path:", imagePath);

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      console.log("Full URL detected, returning as is");
      return imagePath;
    }

    // Handle case where image might be an object with url property (for backward compatibility)
    if (typeof imagePath === "object" && imagePath !== null && imagePath.url) {
      console.log("Image is an object with url property");
      return getImageUrl(imagePath.url);
    }

    const baseUrl =
      process.env.REACT_APP_API_URL || "https://api.bhavyasangh.com";

    // If it starts with '/uploads' or similar, prepend the base URL
    if (imagePath.startsWith("/")) {
      const fullUrl = `${baseUrl}${imagePath}`;
      console.log("Image path starts with /, constructed URL:", fullUrl);
      return fullUrl;
    }

    // Otherwise, construct the full URL assuming it's just the filename
    const fullUrl = `${baseUrl}/uploads/news/${imagePath}`;
    console.log("Constructed URL with uploads/news path:", fullUrl);
    return fullUrl;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.error("Image failed to load:", news?.image);
    // Try to set fallback image
    if (e.target) {
      try {
        e.target.src = "/share-images/bhavya-social-share.png";
      } catch (fallbackError) {
        console.error("Failed to set fallback image:", fallbackError);
        setImageError(true);
      }
    } else {
      setImageError(true);
    }
    setImageLoading(false);
  };

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
            to="/latest-events"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to News
          </Link>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton />

          <article className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                    news.category
                  )}`}
                >
                  {news.category.charAt(0).toUpperCase() +
                    news.category.slice(1).replace("-", " ")}
                </span>
                {news.featured && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {news.title}
              </h1>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    <span>By {news.author?.name || "Admin"}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span>{formatDate(news.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye size={16} className="mr-2" />
                    <span>{news.views || 0} views</span>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  className="flex items-center px-3 py-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Share2 size={16} className="mr-1" />
                  Share
                </button>
              </div>

              {news.category === "event" &&
                (news.eventDate || news.eventLocation) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-800 mb-2">
                      Event Details
                    </h3>
                    <div className="space-y-2">
                      {news.eventDate && (
                        <div className="flex items-center text-green-700">
                          <Calendar size={16} className="mr-2" />
                          <span>{formatDate(news.eventDate)}</span>
                        </div>
                      )}
                      {news.eventLocation && (
                        <div className="flex items-center text-green-700">
                          <MapPin size={16} className="mr-2" />
                          <span>{news.eventLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              <p className="text-lg text-gray-700 leading-relaxed">
                {news.excerpt}
              </p>
            </div>

            {/* Featured Image */}
            {news.image && (
              <div className="relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 h-64 md:h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {imageError ? (
                  <div className="flex items-center justify-center bg-gray-100 h-64 md:h-96">
                    <div className="text-center text-gray-500">
                      <ImageIcon size={48} className="mx-auto mb-2" />
                      <p>Image could not be loaded</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={getImageUrl(news.image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer block relative group"
                    title="Click to view full image"
                  >
                    <img
                      src={getImageUrl(news.image)}
                      alt={news.title}
                      className="w-full h-64 md:h-96 object-cover cursor-pointer transition-all duration-300"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: imageLoading ? "none" : "block" }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white bg-black bg-opacity-70 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform scale-90 group-hover:scale-100">
                        Click to view full size
                      </span>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Additional Images Gallery */}
            {news.images && news.images.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gallery ({news.images.length}{" "}
                  {news.images.length === 1 ? "image" : "images"})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {news.images.map((imagePath, index) => (
                    <div key={index} className="relative group">
                      <a
                        href={getImageUrl(imagePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer"
                        title={`View image ${index + 1} in full size`}
                      >
                        <img
                          src={getImageUrl(imagePath)}
                          alt={`${news.title} - Gallery ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-all duration-300 group-hover:shadow-lg"
                          onError={(e) => {
                            console.error(
                              "Additional image failed to load:",
                              imagePath
                            );
                            e.target.style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black bg-opacity-70 px-3 py-1 rounded shadow-lg transition-all duration-300">
                            View Full Size
                          </span>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {news.content}
                </div>
              </div>

              {/* Tags */}
              {news.tags && news.tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center flex-wrap gap-2">
                    <Tag size={16} className="text-gray-500" />
                    {news.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handleLike}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        liked
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Heart
                        size={20}
                        className={liked ? "fill-current" : ""}
                      />
                      <span>{likeCount}</span>
                    </button>

                    <div className="flex items-center space-x-2 text-gray-600">
                      <MessageCircle size={20} />
                      <span>{comments.length} comments</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Reading time:{" "}
                    {news.readTime ||
                      Math.ceil(news.content.split(" ").length / 200)}{" "}
                    min
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  maxLength="500"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {newComment.length}/500 characters
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Login
                  </Link>{" "}
                  to post a comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {comment.user?.name || "Anonymous"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Related/Back Navigation */}
          <div className="mt-8 text-center">
            <Link
              to="/latest-events"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to All News & Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;

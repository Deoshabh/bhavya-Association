import { ArrowRight, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      setNews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Latest News</h1>
        <p className="text-gray-600">Stay updated with the latest news and announcements</p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Calendar className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No News Available</h3>
            <p>Check back later for the latest news and updates.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article) => (
            <div key={article._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h2>
                
                {article.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.description}
                  </p>
                )}

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDate(article.createdAt)}</span>
                  {article.author && (
                    <>
                      <span className="mx-2">•</span>
                      <span>By {article.author}</span>
                    </>
                  )}
                </div>

                <Link
                  to={`/news/${article._id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Read More
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default News;

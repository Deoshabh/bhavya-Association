import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import api from '../services/api';
import '../styles/LatestNews.css';

const LatestNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLatestNews();
  }, []);

  const fetchLatestNews = async () => {
    try {
      const response = await api.get('/news/latest?limit=4');
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching latest news:', error);
      setError('Failed to load latest news');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'event':
        return <Calendar size={16} className="text-blue-600" />;
      case 'press-release':
        return <ExternalLink size={16} className="text-green-600" />;
      case 'photo-gallery':
        return <ExternalLink size={16} className="text-purple-600" />;
      case 'announcement':
        return <ExternalLink size={16} className="text-orange-600" />;
      default:
        return <ExternalLink size={16} className="text-gray-600" />;
    }
  };

  const getCategoryDisplayName = (category) => {
    switch (category) {
      case 'press-release':
        return 'Press Release';
      case 'photo-gallery':
        return 'Photo Gallery';
      case 'announcement':
        return 'Announcement';
      case 'event':
        return 'Event';
      case 'news':
        return 'News';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="latest-news-events py-6">
        <div className="container mx-auto px-4">
          <div className="latest1 mb-6">
            <h4 className="text-2xl font-bold text-gray-800">Latest News & Events</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="latest-news-events py-6">
        <div className="container mx-auto px-4">
          <div className="latest1 mb-6">
            <h4 className="text-2xl font-bold text-gray-800">Latest News & Events</h4>
          </div>
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-news-events py-6 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="region region-home-latestnews">
          <div id="block-views-latestnews-new-block" className="block block-views first last odd">
            <div className="view view-latestnews-new-block view-id-latestnews_new_block view-display-id-block view-home-tabs view-dom-id-7a3d704ef2f6c0c9d875455275b896f8">
              
              {/* Header */}
              <div className="view-header mb-6">
                <div className="latest1">
                  <h4 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
                    Latest News & Events
                  </h4>
                </div>
              </div>

              {/* Content */}
              <div className="view-content">
                {news.length > 0 ? (
                  <div className="item-list">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {news.map((item) => (
                        <div key={item._id} className="views-row bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                          <Link 
                            to={`/news/${item.slug}`}
                            className="block p-4 hover:bg-gray-50 transition-colors duration-300"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getCategoryIcon(item.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="what_new_title">
                                  <h5 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                                    {item.title}
                                  </h5>
                                </div>
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {getCategoryDisplayName(item.category)}
                                    </span>
                                    <Clock size={14} className="ml-2 mr-1" />
                                    <span>{formatDate(item.createdAt)}</span>
                                  </div>
                                  {item.category === 'event' && item.eventDate && (
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Calendar size={14} className="mr-1" />
                                      <span className="mr-3">{formatDate(item.eventDate)}</span>
                                      {item.eventLocation && (
                                        <>
                                          <MapPin size={14} className="mr-1" />
                                          <span className="truncate">{item.eventLocation}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                  {item.excerpt && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                      {item.excerpt}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                    
                    {/* Static links for existing sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="views-row bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <a 
                          href="/press-release" 
                          role="link"
                          className="block p-4 hover:bg-gray-50 transition-colors duration-300"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              <ExternalLink size={16} className="text-green-600" />
                            </div>
                            <div className="what_new_title">
                              <h5 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-300">
                                Press Releases by Ministry of MSME
                              </h5>
                            </div>
                          </div>
                        </a>
                      </div>
                      
                      <div className="views-row bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <a 
                          href="/pressrelease/photo-gallery" 
                          role="link"
                          className="block p-4 hover:bg-gray-50 transition-colors duration-300"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              <ExternalLink size={16} className="text-purple-600" />
                            </div>
                            <div className="what_new_title">
                              <h5 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-300">
                                Photo Gallery
                              </h5>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No news or events available at the moment.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="view-footer mt-6 text-center">
                <div className="custom-view-more">
                  <Link 
                    to="/latest-events" 
                    role="link"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-300"
                  >
                    View All
                    <ExternalLink size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

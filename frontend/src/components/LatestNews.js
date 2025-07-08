import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
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
      setLoading(true);
      // Use the correct endpoint that matches the backend routes
      const response = await api.get('/news', {
        params: {
          limit: 10,
          page: 1,
          sort: '-createdAt' // Backend expects sort format like this
        }
      });
      setNews(response.data.news || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load latest news');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Handle case where image might be an object with url property (for backward compatibility)
    if (typeof imagePath === 'object' && imagePath !== null && imagePath.url) {
      return getImageUrl(imagePath.url);
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || 'https://api.bhavyasangh.com';
    
    // If it starts with '/uploads' or similar, prepend the base URL
    if (imagePath.startsWith('/')) {
      return `${baseUrl}${imagePath}`;
    }
    
    // Otherwise, assume it's just the filename and construct the full URL
    return `${baseUrl}/uploads/news/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="latest-news-events">
        <div className="region region-home-latestnews">
          <div className="view-header">
            <div className="latest1">
              <h4>Latest News &amp; Events</h4>
            </div>
          </div>
          <div className="marquee-loading">
            <div className="loading-text">Loading latest updates...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="latest-news-events">
        <div className="region region-home-latestnews">
          <div className="view-header">
            <div className="latest1">
              <h4>Latest News &amp; Events</h4>
            </div>
          </div>
          <div className="marquee-container">
            <div className="marquee-content">
              <div className="marquee-item">
                <span className="news-title">Stay tuned for the latest updates from BHAVYA Association!</span>
                <span className="news-date">• Recent</span>
              </div>
            </div>
          </div>
          <div className="view-footer">
            <div className="custom-view-more">
              <Link to="/latest-events">View All</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-news-events">
      <div className="region region-home-latestnews">
        <div className="view-header">
          <div className="latest1">
            <h4>Latest News &amp; Events</h4>
          </div>
        </div>
        
        <div className="marquee-container">
          <div className="marquee-content">
            {/* Duplicate content for seamless loop */}
            {[...news, ...news].map((item, index) => (
              <div key={`${item._id}-${index}`} className="marquee-item">
                <Link to={`/news/${item.slug || item._id}`} className="news-link">
                  <div className="news-thumbnail">
                    {item.image ? (
                      <img 
                        src={getImageUrl(item.image)} 
                        alt={item.title}
                        className="news-image"
                        onError={(e) => {
                          e.target.src = '/share-images/bhavya-social-share.png';
                          console.error('Image failed to load:', item.image);
                        }}
                      />
                    ) : (
                      <div className="news-image-placeholder">
                        {item.category === 'event' ? '🎉' : 
                         item.category === 'announcement' ? '📢' :
                         item.category === 'press-release' ? '📝' :
                         item.category === 'photo-gallery' ? '📸' :
                         item.category === 'notice' ? '⚠️' : '📰'}
                      </div>
                    )}
                    <div className="category-indicator" style={{
                      backgroundColor: item.category === 'event' ? '#10b981' : 
                                      item.category === 'announcement' ? '#f59e0b' :
                                      item.category === 'press-release' ? '#8b5cf6' :
                                      item.category === 'photo-gallery' ? '#ec4899' :
                                      item.category === 'notice' ? '#ef4444' : '#3b82f6'
                    }}></div>
                  </div>
                  <div className="news-content">
                    <div className="news-header">
                      <span className="news-category-tag">
                        {item.category === 'event' ? '🎉 Event' : 
                         item.category === 'announcement' ? '📢 Announcement' :
                         item.category === 'press-release' ? '📝 Press Release' :
                         item.category === 'photo-gallery' ? '📸 Gallery' :
                         item.category === 'notice' ? '⚠️ Notice' : '📰 News'}
                      </span>
                      {item.featured && <span className="featured-badge">★ Featured</span>}
                    </div>
                    <span className="news-title line-clamp-2">{item.title}</span>
                    <span className="news-date">• {formatDate(item.createdAt)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        <div className="view-footer">
          <div className="custom-view-more">
            <Link to="/latest-events" data-discover="true">View All</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

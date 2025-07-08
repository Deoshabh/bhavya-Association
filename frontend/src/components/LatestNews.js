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
        <div id="block-views-latestnews-new-block-block" className="block block-views first last odd">
          <div className="view view-latestnews-new-block view-id-latestnews_new_block view-display-id-block view-home-tabs view-dom-id-7a3d704ef2f6c0c9d875455275b896f8">
            
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
                    <Link to={`/news/${item._id}`} className="news-link">
                      <span className="news-category">{item.category === 'event' ? '🎉' : '📰'}</span>
                      <span className="news-title">{item.title}</span>
                      <span className="news-date">• {formatDate(item.createdAt)}</span>
                      {item.featured && <span className="featured-badge">★ Featured</span>}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="view-footer">
              <div className="custom-view-more">
                <Link to="/latest-events">View All News & Events</Link>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

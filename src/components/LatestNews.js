import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LatestNews.css';

const LatestNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fixed API endpoint - adjust this URL to match your actual API
        const response = await fetch('https://api.bhavyasangh.com/api/news?limit=10&page=1&sort=-createdAt');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setNews(data.news || data.data || data); // Handle different response structures
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Helper function to get image URL
  const getImageUrl = (item) => {
    // Handle different possible image field names
    const imageField = item.image || item.imageUrl || item.thumbnail || item.featuredImage;
    
    if (!imageField) return null;
    
    // If it's already a full URL, return it
    if (typeof imageField === 'string' && imageField.startsWith('http')) {
      return imageField;
    }
    
    // If it's a relative path, construct full URL
    if (typeof imageField === 'string') {
      return `https://api.bhavyasangh.com${imageField.startsWith('/') ? '' : '/'}${imageField}`;
    }
    
    // If it's an object with url property
    if (typeof imageField === 'object' && imageField.url) {
      return imageField.url.startsWith('http') ? imageField.url : `https://api.bhavyasangh.com${imageField.url}`;
    }
    
    return null;
  };

  // Handle click on news item
  const handleNewsClick = (newsItem) => {
    // Navigate to the Latest News page with the specific post ID and complete data
    navigate(`/latest-events/${newsItem._id || newsItem.id}`, { 
      state: { 
        newsItem: {
          ...newsItem,
          postType: newsItem.type || newsItem.category || 'news' // Handle different type field names
        }
      } 
    });
  };

  // Handle "View All" click
  const handleViewAllClick = (e) => {
    e.preventDefault();
    navigate('/latest-events');
  };

  if (loading) {
    return (
      <div className="latest-news-events">
        <div className="region region-home-latestnews">
          <div className="view-header">
            <div className="latest1">
              <h4>Latest News & Events</h4>
            </div>
          </div>
          <div className="marquee-container">
            <div className="marquee-content">
              <div className="marquee-item">
                <span className="news-title">Loading latest updates...</span>
                <span className="news-date">• Loading</span>
              </div>
            </div>
          </div>
          <div className="view-footer">
            <div className="custom-view-more">
              <a href="/latest-events" data-discover="true">View All</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="latest-news-events">
        <div className="region region-home-latestnews">
          <div className="view-header">
            <div className="latest1">
              <h4>Latest News & Events</h4>
            </div>
          </div>
          <div className="marquee-container">
            <div className="marquee-content">
              <div className="marquee-item">
                <span className="news-title">Error loading news: {error}</span>
                <span className="news-date">• Error</span>
              </div>
            </div>
          </div>
          <div className="view-footer">
            <div className="custom-view-more">
              <a href="/latest-events" data-discover="true">View All</a>
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
            <h4>Latest News & Events</h4>
          </div>
        </div>
        <div className="marquee-container">
          <div className="marquee-content">
            {news.length > 0 ? (
              <>
                {news.map((item, index) => (
                  <div 
                    key={index} 
                    className="marquee-item clickable-news-item"
                    onClick={() => handleNewsClick(item)}
                    role="button"
                    tabIndex="0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNewsClick(item);
                      }
                    }}
                  >
                    <span className="news-title">{item.title}</span>
                    <span className="news-date">
                      • {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {/* Duplicate items for seamless loop */}
                {news.map((item, index) => (
                  <div 
                    key={`duplicate-${index}`} 
                    className="marquee-item clickable-news-item"
                    onClick={() => handleNewsClick(item)}
                    role="button"
                    tabIndex="0"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNewsClick(item);
                      }
                    }}
                  >
                    <span className="news-title">{item.title}</span>
                    <span className="news-date">
                      • {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="marquee-item">
                <span className="news-title">Stay tuned for the latest updates from BHAVYA Association!</span>
                <span className="news-date">• Recent</span>
              </div>
            )}
          </div>
        </div>
        <div className="view-footer">
          <div className="custom-view-more">
            <a 
              href="/latest-events" 
              onClick={handleViewAllClick}
              data-discover="true"
            >
              View All
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

import React, { useState, useEffect } from 'react';
import './LatestNews.css';

const LatestNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="news-loading">Loading news...</div>;
  }

  if (error) {
    return <div className="news-error">Error loading news: {error}</div>;
  }

  return (
    <div className="latest-news">
      <h2>Latest News</h2>
      <div className="news-marquee-container">
        <div className="news-marquee">
          {news.map((item, index) => (
            <div key={index} className="news-item">
              <div className="news-content">
                {getImageUrl(item) && (
                  <div className="news-image">
                    <img 
                      src={getImageUrl(item)} 
                      alt={item.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="news-text">
                  <h3>{item.title}</h3>
                  <p>{item.excerpt || item.description}</p>
                  <span className="news-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {/* Duplicate items for seamless loop */}
          {news.map((item, index) => (
            <div key={`duplicate-${index}`} className="news-item">
              <div className="news-content">
                {getImageUrl(item) && (
                  <div className="news-image">
                    <img 
                      src={getImageUrl(item)} 
                      alt={item.title}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="news-text">
                  <h3>{item.title}</h3>
                  <p>{item.excerpt || item.description}</p>
                  <span className="news-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

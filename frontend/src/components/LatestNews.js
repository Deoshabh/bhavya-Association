import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "../styles/LatestNews.css";

const LatestNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLatestNews();
  }, []);

  const fetchLatestNews = async () => {
    try {
      setLoading(true);
      console.log("Attempting to fetch news from /api/news/latest...");

      // Try the latest endpoint first
      const response = await api.get("/api/news/latest", {
        params: {
          limit: 10,
        },
      });
      console.log("Successfully fetched news:", response.data);
      setNews(response.data || []);
    } catch (err) {
      console.error("Error fetching news from /api/news/latest:", err);

      // Try fallback to main news endpoint
      try {
        console.log("Trying fallback endpoint /api/news...");
        const fallbackResponse = await api.get("/api/news", {
          params: {
            limit: 10,
            page: 1,
            sort: "-createdAt",
          },
        });
        console.log("Fallback successful:", fallbackResponse.data);
        setNews(fallbackResponse.data.news || []);
      } catch (fallbackErr) {
        console.error("All API endpoints failed. Using fallback content.");

        // Use fallback placeholder news data
        const fallbackNews = [
          {
            _id: "fallback-1",
            title: "Welcome to BHAVYA Association",
            category: "announcement",
            createdAt: new Date().toISOString(),
            featured: true,
          },
          {
            _id: "fallback-2",
            title: "Connecting Communities, Creating Opportunities",
            category: "news",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            _id: "fallback-3",
            title: "Join our Growing Network of Professionals",
            category: "event",
            createdAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ];

        setNews(fallbackNews);
        setError(""); // Clear error since we have fallback content
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format date function is already defined above

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
                <span className="news-title">
                  Stay tuned for the latest updates from BHAVYA Association!
                </span>
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
            {news.length === 0 ? (
              <div className="marquee-item">
                <span className="news-title">
                  Stay tuned for the latest updates from BHAVYA Association!
                </span>
                <span className="news-date">• Recent</span>
              </div>
            ) : (
              // Duplicate content for seamless infinite loop
              [...news, ...news, ...news].map((item, index) => (
                <div key={`${item._id}-${index}`} className="marquee-item">
                  <Link
                    to={`/news/${item.slug || item._id}`}
                    className="news-link"
                  >
                    <span className="news-icon">
                      {item.category === "event"
                        ? "🎉"
                        : item.category === "announcement"
                        ? "📢"
                        : item.category === "press-release"
                        ? "📝"
                        : item.category === "photo-gallery"
                        ? "📸"
                        : item.category === "notice"
                        ? "⚠️"
                        : "📰"}
                    </span>
                    <span className="news-title">{item.title}</span>
                    <span className="news-date">
                      • {formatDate(item.createdAt)}
                    </span>
                    {item.featured && <span className="featured-badge">★</span>}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="view-footer">
          <div className="custom-view-more">
            <Link to="/latest-events" data-discover="true">
              View All
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;

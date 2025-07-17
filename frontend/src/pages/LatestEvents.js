import {
  Calendar,
  Clock,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Search,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import api from "../services/api";

const LatestEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    featured: searchParams.get("featured") || "",
  });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page")) || 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "news", label: "News" },
    { value: "event", label: "Events" },
    { value: "announcement", label: "Announcements" },
    { value: "press-release", label: "Press Releases" },
    { value: "photo-gallery", label: "Photo Gallery" },
    { value: "notice", label: "Notices" },
  ];

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL, return as is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Handle case where image might be an object with url property (for backward compatibility)
    if (typeof imagePath === "object" && imagePath !== null && imagePath.url) {
      return getImageUrl(imagePath.url);
    }

    const baseUrl =
      process.env.REACT_APP_API_URL || "https://api.bhavyasangh.com";

    // If it starts with '/uploads' or similar, prepend the base URL
    if (imagePath.startsWith("/")) {
      return `${baseUrl}${imagePath}`;
    }

    // Otherwise, construct the full URL assuming it's just the filename
    return `${baseUrl}/uploads/news/${imagePath}`;
  };

  useEffect(() => {
    fetchNews();
    updateURL();
  }, [filters, pagination.page]);

  const updateURL = () => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.search) params.set("search", filters.search);
    if (filters.featured) params.set("featured", filters.featured);
    if (pagination.page > 1) params.set("page", pagination.page.toString());
    setSearchParams(params);
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort: "-createdAt",
        ...filters,
      });

      const response = await api.get(`/news?${params}`);
      setNews(response.data.news);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages,
      }));
    } catch (error) {
      console.error("Error fetching news:", error);
      setError("Failed to fetch news and events");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Latest News & Events
          </h1>
          <p className="text-gray-600 mt-2">
            Stay updated with the latest news, events, and announcements from
            our community
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search news and events..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter
              </label>
              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange("featured", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Posts</option>
                <option value="true">Featured Only</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* News Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 animate-pulse rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 animate-pulse rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              No news or events found matching your criteria.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <article
                key={item._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                {item.image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.error("Image failed to load:", item.image);
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        item.category
                      )}`}
                    >
                      {categories.find((c) => c.value === item.category)
                        ?.label || item.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      {item.featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                      {item.images && item.images.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          📷 {item.images.length + 1} photos
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    <Link
                      to={`/news/${item.slug}`}
                      className="hover:text-blue-600 transition-colors duration-300"
                    >
                      {item.title}
                    </Link>
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-2" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    {item.category === "event" && item.eventDate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-2" />
                        <span>{formatDate(item.eventDate)}</span>
                        {item.eventLocation && (
                          <>
                            <MapPin size={14} className="ml-4 mr-1" />
                            <span className="truncate">
                              {item.eventLocation}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Tag size={14} className="mr-2" />
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{item.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye size={14} className="mr-1" />
                        <span>{item.views || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart size={14} className="mr-1" />
                        <span>{item.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle size={14} className="mr-1" />
                        <span>{item.commentCount || 0}</span>
                      </div>
                    </div>

                    <Link
                      to={`/news/${item.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNumber = Math.max(1, pagination.page - 2) + i;
                if (pageNumber > pagination.pages) return null;

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 border rounded-md ${
                      pageNumber === pagination.page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Results summary */}
        <div className="mt-6 text-center text-gray-600">
          {pagination.total > 0 && (
            <p>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestEvents;

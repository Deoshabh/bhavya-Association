import {
    Briefcase,
    Calendar,
    ChevronDown,
    Eye,
    Filter,
    GraduationCap,
    Heart,
    Lock,
    MapPin,
    Plus,
    Search,
    Users,
    X
} from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const MatrimonialListing = () => {
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    ageMin: '',
    ageMax: '',
    city: '',
    state: '',
    caste: '',
    education: '',
    occupation: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Load profiles
  const loadProfiles = React.useCallback(async (page = 1, reset = false) => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/api/matrimonial/profiles?${params}`);
      
      if (reset) {
        setProfiles(response.data.profiles);
      } else {
        setProfiles(prev => [...prev, ...response.data.profiles]);
      }
      
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      });
      
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError('Failed to load matrimonial profiles');
    } finally {
      setLoading(false);
    }
  }, [api, filters, searchTerm, pagination.limit]);

  useEffect(() => {
    loadProfiles(1, true);
  }, [filters, searchTerm]);

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      gender: '',
      ageMin: '',
      ageMax: '',
      city: '',
      state: '',
      caste: '',
      education: '',
      occupation: ''
    });
    setSearchTerm('');
  };

  // Load more profiles
  const loadMoreProfiles = () => {
    if (pagination.page < pagination.totalPages) {
      loadProfiles(pagination.page + 1, false);
    }
  };

  // Navigate to profile registration
  const handleCreateProfile = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/matrimonial/register');
  };

  // Check if user can view contact details
  const canViewContactDetails = (profile) => {
    return user && (user.planType === 'premium' || user.planType === 'admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Match
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Discover compatible partners within the Bahujan community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCreateProfile}
              className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your Profile
            </button>
            <Link
              to="/matrimonial/success-stories"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors flex items-center justify-center"
            >
              <Heart className="h-5 w-5 mr-2" />
              Success Stories
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, profession..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Clear Filters */}
            {(Object.values(filters).some(v => v) || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Age"
                  value={filters.ageMin}
                  onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Max Age"
                  value={filters.ageMax}
                  onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="State"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Caste"
                  value={filters.caste}
                  onChange={(e) => handleFilterChange('caste', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {pagination.total > 0 ? (
              <>Showing {profiles.length} of {pagination.total} profiles</>
            ) : (
              'No profiles found'
            )}
          </p>
          
          {!user && (
            <div className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              <Lock className="inline h-4 w-4 mr-1" />
              Login for full profile access
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Profiles Grid */}
        {loading && profiles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-3/4 mx-auto"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <div key={profile._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  {/* Profile Image */}
                  <div className="p-6 pb-4">
                    <div className="w-24 h-24 mx-auto mb-4">
                      {profile.profileImages && profile.profileImages.length > 0 ? (
                        <img
                          src={`/api/matrimonial/profiles/${profile._id}/image/0`}
                          alt={profile.fullName}
                          className="w-full h-full rounded-full object-cover border-4 border-pink-100"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                          <Users className="h-10 w-10 text-pink-600" />
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {profile.fullName}
                      </h3>
                      <div className="flex items-center justify-center text-gray-600 text-sm mb-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        {calculateAge(profile.dateOfBirth)} years • {profile.height}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center justify-center text-gray-600 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{profile.city}, {profile.state}</span>
                    </div>

                    {/* Education & Occupation */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <GraduationCap className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{profile.education}</span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{profile.occupation}</span>
                      </div>
                    </div>

                    {/* Caste */}
                    <div className="text-center mb-4">
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                        {profile.caste}
                      </span>
                    </div>

                    {/* Contact Info - Premium Only */}
                    {canViewContactDetails(profile) ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-green-800 font-medium mb-1">Contact Details:</p>
                        <p className="text-sm text-green-700">{profile.contactNumber}</p>
                        {profile.email && (
                          <p className="text-sm text-green-700">{profile.email}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-center">
                        <Lock className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                        <p className="text-xs text-amber-700">
                          {user ? 'Premium access required' : 'Login to view details'}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        to={`/matrimonial/profile/${profile._id}`}
                        className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Link>
                      
                      {canViewContactDetails(profile) && (
                        <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors">
                          <Heart className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMoreProfiles}
                  disabled={loading}
                  className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More Profiles'}
                </button>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
              <p className="text-gray-600 mb-6">
                {Object.values(filters).some(v => v) || searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Be the first to create a matrimonial profile'
                }
              </p>
              <button
                onClick={handleCreateProfile}
                className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                Create Your Profile
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MatrimonialListing;

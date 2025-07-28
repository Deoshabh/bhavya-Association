import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import React, { useContext, useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { AuthContext } from '../../context/AuthContext';

const MatrimonialManagement = () => {
  const { api, user } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    gender: '',
    city: ''
  });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Load matrimonial profiles and stats
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [profilesResponse, statsResponse] = await Promise.all([
        api.get('/api/admin/matrimonial/profiles', { 
          params: filters 
        }),
        api.get('/api/admin/matrimonial/stats')
      ]);

      setProfiles(profilesResponse.data.profiles || []);
      setStats(statsResponse.data.stats || {});
    } catch (err) {
      console.error('Error loading matrimonial data:', err);
      setError('Failed to load matrimonial profiles');
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check admin access
  if (!user || user.planType !== 'admin') {
    return <div>Access denied</div>;
  }

  // Handle profile approval
  const handleApproval = async (profileId, action) => {
    setActionLoading(profileId);
    try {
      await api.put(`/api/admin/matrimonial/profiles/${profileId}/approval`, {
        action,
        adminNotes: action === 'reject' ? 'Profile rejected by admin' : 'Profile approved'
      });

      // Reload data
      await loadData();
      
      if (selectedProfile && selectedProfile._id === profileId) {
        setShowDetailModal(false);
        setSelectedProfile(null);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle profile visibility toggle
  const handleVisibilityToggle = async (profileId, isVisible) => {
    setActionLoading(profileId);
    try {
      await api.put(`/api/admin/matrimonial/profiles/${profileId}/visibility`, {
        isVisible: !isVisible
      });

      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error updating visibility:', err);
      alert('Failed to update profile visibility.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle profile deletion
  const handleDelete = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    setActionLoading(profileId);
    try {
      await api.delete(`/api/admin/matrimonial/profiles/${profileId}`);
      await loadData();
      
      if (selectedProfile && selectedProfile._id === profileId) {
        setShowDetailModal(false);
        setSelectedProfile(null);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      alert('Failed to delete profile. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate age
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-pink-600" />
              Matrimonial Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage matrimonial profiles and approvals
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
                <Users className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">
                  Total Profiles
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">
                  Pending Approval
                </h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 text-green-700">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">Approved</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-50 text-red-700">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm font-medium">Rejected</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, city..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="Filter by city"
                value={filters.city}
                onChange={(e) => handleFilterChange("city", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profiles Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Matrimonial Profiles
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No profiles found
              </h3>
              <p className="text-gray-600">
                No matrimonial profiles match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr key={profile._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {profile.profileImages &&
                            profile.profileImages.length > 0 ? (
                              <img
                                src={`/api/matrimonial/profiles/${profile._id}/image/0`}
                                alt={profile.fullName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {profile.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {profile.profileType} profile
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {calculateAge(profile.dateOfBirth)} years,{" "}
                            {profile.gender}
                          </div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            {profile.city}, {profile.state}
                          </div>
                          <div className="flex items-center mt-1">
                            <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                            {profile.occupation}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {profile.contactNumber}
                          </div>
                          {profile.email && (
                            <div className="flex items-center mt-1">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              {profile.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profile.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : profile.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {profile.status}
                          </span>
                          <div>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                profile.isVisible
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {profile.isVisible ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProfile(profile);
                              setShowDetailModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {profile.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproval(profile._id, "approve")
                                }
                                disabled={actionLoading === profile._id}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleApproval(profile._id, "reject")
                                }
                                disabled={actionLoading === profile._id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() =>
                              handleVisibilityToggle(
                                profile._id,
                                profile.isVisible
                              )
                            }
                            disabled={actionLoading === profile._id}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            {profile.isVisible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Eye
                                className="h-4 w-4"
                                style={{ opacity: 0.5 }}
                              />
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(profile._id)}
                            disabled={actionLoading === profile._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showDetailModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedProfile.fullName} - Profile Details
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Basic Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Full Name:</span>{" "}
                      {selectedProfile.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Age:</span>{" "}
                      {calculateAge(selectedProfile.dateOfBirth)} years
                    </p>
                    <p>
                      <span className="font-medium">Gender:</span>{" "}
                      {selectedProfile.gender}
                    </p>
                    <p>
                      <span className="font-medium">Height:</span>{" "}
                      {selectedProfile.height}
                    </p>
                    {selectedProfile.weight && (
                      <p>
                        <span className="font-medium">Weight:</span>{" "}
                        {selectedProfile.weight}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {selectedProfile.city}, {selectedProfile.state}
                    </p>
                    <p>
                      <span className="font-medium">Caste:</span>{" "}
                      {selectedProfile.caste}
                    </p>
                    {selectedProfile.subCaste && (
                      <p>
                        <span className="font-medium">Sub Caste:</span>{" "}
                        {selectedProfile.subCaste}
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Professional Details
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Education:</span>{" "}
                      {selectedProfile.education}
                    </p>
                    <p>
                      <span className="font-medium">Occupation:</span>{" "}
                      {selectedProfile.occupation}
                    </p>
                    {selectedProfile.income && (
                      <p>
                        <span className="font-medium">Income:</span>{" "}
                        {selectedProfile.income}
                      </p>
                    )}
                  </div>
                </div>

                {/* Family Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Family Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Family Type:</span>{" "}
                      {selectedProfile.familyType}
                    </p>
                    {selectedProfile.fatherOccupation && (
                      <p>
                        <span className="font-medium">
                          Father's Occupation:
                        </span>{" "}
                        {selectedProfile.fatherOccupation}
                      </p>
                    )}
                    {selectedProfile.motherOccupation && (
                      <p>
                        <span className="font-medium">
                          Mother's Occupation:
                        </span>{" "}
                        {selectedProfile.motherOccupation}
                      </p>
                    )}
                    {selectedProfile.siblings && (
                      <p>
                        <span className="font-medium">Siblings:</span>{" "}
                        {selectedProfile.siblings.brothers} Brothers,{" "}
                        {selectedProfile.siblings.sisters} Sisters
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Contact Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedProfile.contactNumber}
                    </p>
                    {selectedProfile.email && (
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedProfile.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* About Me */}
              {selectedProfile.aboutMe && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">About Me</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedProfile.aboutMe}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                {selectedProfile.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        handleApproval(selectedProfile._id, "reject")
                      }
                      disabled={actionLoading === selectedProfile._id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject Profile
                    </button>
                    <button
                      onClick={() =>
                        handleApproval(selectedProfile._id, "approve")
                      }
                      disabled={actionLoading === selectedProfile._id}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Approve Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default MatrimonialManagement;

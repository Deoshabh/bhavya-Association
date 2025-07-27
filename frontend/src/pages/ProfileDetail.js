import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    Heart,
    Home,
    IndianRupee,
    Lock,
    Mail,
    MapPin,
    Phone,
    Share2,
    UserCheck,
    Users
} from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProfileDetail = () => {
  const { id } = useParams();
  const { user, api } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(`/api/matrimonial/profiles/${id}`);
        setProfile(response.data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.response?.data?.msg || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProfile();
    }
  }, [id, api]);

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

  // Check if user has premium access
  const hasPremiumAccess = () => {
    return user && (user.planType === 'premium' || user.planType === 'admin');
  };

  // Handle contact details access
  const handleContactAccess = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!hasPremiumAccess()) {
      setShowPremiumPrompt(true);
      return;
    }
  };

  // Handle biodata download
  const handleBiodataDownload = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!hasPremiumAccess()) {
      setShowPremiumPrompt(true);
      return;
    }

    try {
      const response = await api.get(`/api/matrimonial/profiles/${id}/biodata`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${profile.fullName}_biodata.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading biodata:', err);
      alert('Failed to download biodata. Please try again.');
    }
  };

  // Handle image navigation
  const nextImage = () => {
    if (profile.profileImages && profile.profileImages.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === profile.profileImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (profile.profileImages && profile.profileImages.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? profile.profileImages.length - 1 : prev - 1
      );
    }
  };

  // Share profile
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.fullName} - Matrimonial Profile`,
          text: `Check out this matrimonial profile on Bahujan Association`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested profile could not be found.'}</p>
          <Link
            to="/matrimonial"
            className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <button
              onClick={handleShare}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Profile Image */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {profile.profileImages && profile.profileImages.length > 0 ? (
                    <>
                      <img
                        src={`/api/matrimonial/profiles/${profile._id}/image/${currentImageIndex}`}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                      />
                      {profile.profileImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-r-md hover:bg-opacity-70 transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-l-md hover:bg-opacity-70 transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-white bg-opacity-20 flex items-center justify-center">
                      <Users className="h-16 w-16 text-white opacity-60" />
                    </div>
                  )}
                </div>
                {profile.profileImages && profile.profileImages.length > 1 && (
                  <div className="flex justify-center mt-2 space-x-1">
                    {profile.profileImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{profile.fullName}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-white text-opacity-90 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {calculateAge(profile.dateOfBirth)} years
                  </div>
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-1" />
                    {profile.height}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.city}, {profile.state}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex justify-center md:justify-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Eye className="h-4 w-4 mr-1" />
                    {profile.isVisible ? 'Active Profile' : 'Profile Under Review'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Information */}
              <div className="lg:col-span-2 space-y-8">
                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-pink-600" />
                    Professional Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Education</p>
                        <p className="text-gray-900">{profile.education}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Occupation</p>
                        <p className="text-gray-900">{profile.occupation}</p>
                      </div>
                      {profile.income && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Annual Income</p>
                          <p className="text-gray-900 flex items-center">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {profile.income}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-pink-600" />
                    Personal Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                        <p className="text-gray-900">
                          {new Date(profile.dateOfBirth).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Gender</p>
                        <p className="text-gray-900 capitalize">{profile.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Height</p>
                        <p className="text-gray-900">{profile.height}</p>
                      </div>
                      {profile.weight && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Weight</p>
                          <p className="text-gray-900">{profile.weight}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700">Caste</p>
                        <p className="text-gray-900">{profile.caste}</p>
                      </div>
                      {profile.subCaste && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Sub Caste</p>
                          <p className="text-gray-900">{profile.subCaste}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-700">Religion</p>
                        <p className="text-gray-900">{profile.religion}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Family Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2 text-pink-600" />
                    Family Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Family Type</p>
                        <p className="text-gray-900 capitalize">{profile.familyType} Family</p>
                      </div>
                      {profile.fatherOccupation && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Father's Occupation</p>
                          <p className="text-gray-900">{profile.fatherOccupation}</p>
                        </div>
                      )}
                      {profile.motherOccupation && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Mother's Occupation</p>
                          <p className="text-gray-900">{profile.motherOccupation}</p>
                        </div>
                      )}
                    </div>

                    {/* Siblings Information */}
                    {profile.siblings && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Siblings</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="bg-white p-2 rounded">
                            <p className="font-medium">{profile.siblings.brothers}</p>
                            <p className="text-gray-600">Brothers</p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <p className="font-medium">{profile.siblings.sisters}</p>
                            <p className="text-gray-600">Sisters</p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <p className="font-medium">{profile.siblings.marriedBrothers}</p>
                            <p className="text-gray-600">Married Brothers</p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <p className="font-medium">{profile.siblings.marriedSisters}</p>
                            <p className="text-gray-600">Married Sisters</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* About Me */}
                {profile.aboutMe && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About Me</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
                    </div>
                  </div>
                )}

                {/* Partner Preferences */}
                {profile.partnerPreferences && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-pink-600" />
                      Partner Preferences
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.partnerPreferences.ageRange && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Age Range</p>
                            <p className="text-gray-900">
                              {profile.partnerPreferences.ageRange.min} - {profile.partnerPreferences.ageRange.max} years
                            </p>
                          </div>
                        )}
                        {profile.partnerPreferences.education && profile.partnerPreferences.education.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Preferred Education</p>
                            <p className="text-gray-900">{profile.partnerPreferences.education.join(', ')}</p>
                          </div>
                        )}
                        {profile.partnerPreferences.occupation && profile.partnerPreferences.occupation.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Preferred Occupation</p>
                            <p className="text-gray-900">{profile.partnerPreferences.occupation.join(', ')}</p>
                          </div>
                        )}
                        {profile.partnerPreferences.location && profile.partnerPreferences.location.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Preferred Location</p>
                            <p className="text-gray-900">{profile.partnerPreferences.location.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  
                  {hasPremiumAccess() ? (
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-5 w-5 mr-3 text-green-600" />
                        <span>{profile.contactNumber}</span>
                      </div>
                      {profile.email && (
                        <div className="flex items-center text-gray-700">
                          <Mail className="h-5 w-5 mr-3 text-blue-600" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        {user ? 'Premium membership required' : 'Login required'}
                      </p>
                      <button
                        onClick={handleContactAccess}
                        className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors"
                      >
                        {user ? 'Upgrade to Premium' : 'Login to View'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Biodata Download */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Biodata</h3>
                  
                  {hasPremiumAccess() ? (
                    <button
                      onClick={handleBiodataDownload}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download PDF
                    </button>
                  ) : (
                    <div className="text-center">
                      <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        {user ? 'Premium membership required' : 'Login required'}
                      </p>
                      <button
                        onClick={handleBiodataDownload}
                        className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center"
                      >
                        <Lock className="h-5 w-5 mr-2" />
                        {user ? 'Premium Required' : 'Login Required'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profile Type:</span>
                      <span className="text-gray-900 capitalize">{profile.profileType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        profile.approvalStatus === 'approved' ? 'text-green-600' :
                        profile.approvalStatus === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {profile.approvalStatus === 'approved' ? 'Verified' :
                         profile.approvalStatus === 'rejected' ? 'Under Review' :
                         'Pending Verification'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Prompt Modal */}
      {showPremiumPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium Access Required</h3>
              <p className="text-gray-600 mb-6">
                Upgrade to premium membership to access contact details and download biodata files.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPremiumPrompt(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <Link
                  to="/pricing"
                  className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-pink-700 transition-colors text-center"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDetail;

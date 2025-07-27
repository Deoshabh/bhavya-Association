import {
  AlertCircle,
  Camera,
  FileText,
  Heart,
  MapPin,
  Save,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const MatrimonialRegistration = () => {
  const { api, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Info
    profileType: "self",
    fullName: "",
    dateOfBirth: "",
    gender: "",
    height: "",
    weight: "",

    // Contact
    contactNumber: user?.phoneNumber || "",
    email: "",

    // Location
    city: "",
    state: "",
    country: "India",

    // Religion & Caste
    caste: "",
    subCaste: "",
    religion: "Hindu",

    // Education & Career
    education: "",
    occupation: "",
    income: "",

    // Family
    familyType: "nuclear",
    fatherOccupation: "",
    motherOccupation: "",
    siblings: {
      brothers: 0,
      sisters: 0,
      marriedBrothers: 0,
      marriedSisters: 0,
    },

    // About & Preferences
    aboutMe: "",
    partnerPreferences: {
      ageRange: { min: 18, max: 35 },
      heightRange: { min: "", max: "" },
      education: [],
      occupation: [],
      location: [],
      caste: [],
    },
  });

  const [files, setFiles] = useState({
    biodata: null,
    profileImages: [],
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle nested object changes (siblings, partner preferences)
  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  // Handle array changes for partner preferences
  const handleArrayChange = (parent, field, value) => {
    const values = value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v);
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: values,
      },
    }));
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;

    if (name === "biodata") {
      if (selectedFiles[0] && selectedFiles[0].type !== "application/pdf") {
        setError("Biodata must be a PDF file");
        return;
      }
      if (selectedFiles[0] && selectedFiles[0].size > 10 * 1024 * 1024) {
        // 10MB limit
        setError("Biodata file must be smaller than 10MB");
        return;
      }
      setFiles((prev) => ({ ...prev, biodata: selectedFiles[0] }));
    } else if (name === "profileImages") {
      const imageFiles = Array.from(selectedFiles).filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length !== selectedFiles.length) {
        setError("Only image files are allowed for profile pictures");
        return;
      }

      // Check file sizes
      const oversizedFiles = imageFiles.filter(
        (file) => file.size > 5 * 1024 * 1024
      ); // 5MB limit per image
      if (oversizedFiles.length > 0) {
        setError("Each profile image must be smaller than 5MB");
        return;
      }

      if (imageFiles.length > 5) {
        setError("Maximum 5 profile images allowed");
        return;
      }

      setFiles((prev) => ({ ...prev, profileImages: imageFiles }));
    }

    setError("");
  };

  // Validate current step
  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return (
          formData.profileType &&
          formData.fullName &&
          formData.dateOfBirth &&
          formData.gender &&
          formData.height &&
          formData.contactNumber
        );
      case 2:
        return (
          formData.city &&
          formData.state &&
          formData.caste &&
          formData.education &&
          formData.occupation
        );
      case 3:
        return formData.familyType;
      case 4:
        return true; // No mandatory files for step 4
      default:
        return true;
    }
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(4)) {
      setError("Please complete all required fields");
      return;
    }

    // Additional file size validation before submission
    if (files.biodata && files.biodata.size > 10 * 1024 * 1024) {
      setError("Biodata file must be smaller than 10MB");
      return;
    }

    const oversizedImages = files.profileImages.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (oversizedImages.length > 0) {
      setError("Each profile image must be smaller than 5MB");
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const submitData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (typeof formData[key] === "object" && formData[key] !== null) {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Add files
      if (files.biodata) {
        submitData.append("biodata", files.biodata);
      }

      files.profileImages.forEach((image, index) => {
        submitData.append("profileImages", image);
      });

      await api.post("/api/matrimonial/profiles", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds for file upload
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setSuccess(
        "Profile submitted successfully! It will be reviewed by our admin team."
      );
      setTimeout(() => {
        navigate("/matrimonial");
      }, 3000);
    } catch (err) {
      console.error("Profile submission error:", err);

      // Provide specific error messages for different error types
      let errorMessage = "Failed to submit profile. Please try again.";

      if (err.code === "ECONNABORTED") {
        errorMessage =
          "Upload is taking longer than expected. Please check your internet connection and try again with smaller files if possible.";
      } else if (err.response?.status === 413) {
        errorMessage =
          "File size is too large. Please reduce the file size and try again.";
      } else if (err.response?.status === 400) {
        errorMessage =
          err.response?.data?.msg ||
          "Invalid form data. Please check all fields and try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Please log in again to submit your profile.";
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      setError("");
    } else {
      setError("Please fill in all required fields for this step");
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    setError("");
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Type *
                </label>
                <select
                  name="profileType"
                  value={formData.profileType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="self">Myself</option>
                  <option value="son">Son</option>
                  <option value="daughter">Daughter</option>
                  <option value="brother">Brother</option>
                  <option value="sister">Sister</option>
                  <option value="relative">Relative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
                {formData.dateOfBirth && (
                  <p className="text-sm text-gray-500 mt-1">
                    Age: {calculateAge(formData.dateOfBirth)} years
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height *
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  placeholder="e.g., 5'8&quot; or 173 cm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 65 kg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Location & Background
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caste *
                </label>
                <input
                  type="text"
                  name="caste"
                  value={formData.caste}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Caste
                </label>
                <input
                  type="text"
                  name="subCaste"
                  value={formData.subCaste}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Religion
                </label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education *
                </label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor's in Engineering"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation *
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Income
                </label>
                <input
                  type="text"
                  name="income"
                  value={formData.income}
                  onChange={handleInputChange}
                  placeholder="e.g., 5-10 LPA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Family Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Type *
                </label>
                <select
                  name="familyType"
                  value={formData.familyType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="nuclear">Nuclear Family</option>
                  <option value="joint">Joint Family</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Occupation
                </label>
                <input
                  type="text"
                  name="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mother's Occupation
                </label>
                <input
                  type="text"
                  name="motherOccupation"
                  value={formData.motherOccupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">
                Siblings Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brothers
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.siblings.brothers}
                    onChange={(e) =>
                      handleNestedChange(
                        "siblings",
                        "brothers",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sisters
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.siblings.sisters}
                    onChange={(e) =>
                      handleNestedChange(
                        "siblings",
                        "sisters",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Married Brothers
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.siblings.marriedBrothers}
                    onChange={(e) =>
                      handleNestedChange(
                        "siblings",
                        "marriedBrothers",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Married Sisters
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.siblings.marriedSisters}
                    onChange={(e) =>
                      handleNestedChange(
                        "siblings",
                        "marriedSisters",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Me
              </label>
              <textarea
                name="aboutMe"
                value={formData.aboutMe}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
                placeholder="Tell us about yourself, your interests, values, and what makes you unique..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.aboutMe.length}/1000 characters
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Upload className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Photos & Documents (Optional)
              </h3>
            </div>

            <div className="space-y-6">
              {/* Biodata Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="biodata" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload Biodata PDF (Optional)
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PDF files up to 10MB. Uploading biodata helps potential
                        matches know more about you.
                      </span>
                    </label>
                    <input
                      id="biodata"
                      name="biodata"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>
                </div>
                {files.biodata && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-green-600">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {files.biodata.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Images Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="profileImages" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload Profile Photos (Optional)
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        Image files up to 5MB each, maximum 5 photos
                      </span>
                    </label>
                    <input
                      id="profileImages"
                      name="profileImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>
                </div>
                {files.profileImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Selected Images ({files.profileImages.length}/5):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {files.profileImages.map((file, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Partner Preferences */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 text-pink-600 mr-2" />
                  Partner Preferences (Optional)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="18"
                        max="70"
                        value={formData.partnerPreferences.ageRange.min}
                        onChange={(e) =>
                          handleNestedChange("partnerPreferences", "ageRange", {
                            ...formData.partnerPreferences.ageRange,
                            min: parseInt(e.target.value) || 18,
                          })
                        }
                        placeholder="Min"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                      <span className="self-center text-gray-500">to</span>
                      <input
                        type="number"
                        min="18"
                        max="70"
                        value={formData.partnerPreferences.ageRange.max}
                        onChange={(e) =>
                          handleNestedChange("partnerPreferences", "ageRange", {
                            ...formData.partnerPreferences.ageRange,
                            max: parseInt(e.target.value) || 35,
                          })
                        }
                        placeholder="Max"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Education (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.partnerPreferences.education.join(", ")}
                      onChange={(e) =>
                        handleArrayChange(
                          "partnerPreferences",
                          "education",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Graduate, Post Graduate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Occupation (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.partnerPreferences.occupation.join(", ")}
                      onChange={(e) =>
                        handleArrayChange(
                          "partnerPreferences",
                          "occupation",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Engineer, Doctor, Business"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Location (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.partnerPreferences.location.join(", ")}
                      onChange={(e) =>
                        handleArrayChange(
                          "partnerPreferences",
                          "location",
                          e.target.value
                        )
                      }
                      placeholder="e.g., Mumbai, Delhi, Bangalore"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Matrimonial Profile
          </h1>
          <p className="text-gray-600">
            Create a comprehensive matrimonial profile to find your perfect
            match
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-pink-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? "bg-pink-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2 space-x-8">
            <span className="text-xs text-gray-500">Basic Info</span>
            <span className="text-xs text-gray-500">Background</span>
            <span className="text-xs text-gray-500">Family</span>
            <span className="text-xs text-gray-500">Photos</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {uploadProgress > 0
                          ? `Uploading... ${uploadProgress}%`
                          : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Submit Profile
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MatrimonialRegistration;

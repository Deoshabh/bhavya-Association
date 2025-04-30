/**
 * Social Media Sharing Image Utility
 * 
 * This utility helps determine the appropriate social sharing image
 * based on content type and available data.
 */

/**
 * Get the appropriate sharing image URL for a user profile
 * 
 * @param {Object} user - User profile data
 * @returns {string} URL to the sharing image
 */
export const getProfileShareImage = (user) => {
  // Use user's profile image if available, otherwise use the default profile sharing image
  if (user && user.profileImage) {
    return user.profileImage;
  }
  return '/share-images/profile-share.png';
};

/**
 * Get the appropriate sharing image URL for a business listing
 * 
 * @param {Object} listing - Listing data
 * @returns {string} URL to the sharing image
 */
export const getListingShareImage = (listing) => {
  // Use listing's image if available, otherwise use the default listing sharing image
  if (listing && listing.image) {
    return listing.image;
  }
  return '/share-images/listing-share.png';
};

/**
 * Get default sharing image for the site
 * 
 * @param {string} pageType - Optional page type identifier
 * @returns {string} URL to the sharing image
 */
export const getDefaultShareImage = (pageType = null) => {
  // Use different default images based on the page type
  switch (pageType) {
    case 'directory':
      return '/share-images/directory-share.png';
    case 'events':
      return '/share-images/events-share.png';
    case 'about':
      return '/share-images/about-share.png';
    default:
      return '/share-images/default-share.png';
  }
};

/**
 * Generate proper meta tags for a user profile
 * 
 * @param {Object} user - User profile data
 * @returns {Object} Meta tag properties
 */
export const generateProfileMetaTags = (user) => {
  if (!user) return {};
  
  // Create a description from the user's information
  let description = user.bio || `${user.name}'s profile on BHAVYA Associates`;
  if (description.length > 155) {
    description = description.substring(0, 152) + '...';
  }
  
  // Add profession if available and not already in description
  if (user.profession && !description.toLowerCase().includes(user.profession.toLowerCase())) {
    description = `${user.profession} - ${description}`;
  }
  
  return {
    title: `${user.name} | BHAVYA Member Profile`,
    description: description,
    image: getProfileShareImage(user),
    url: `https://bhavyasangh.com/user-profile/${user._id}`,
    type: 'profile',
    schemaType: 'Person',
    structuredData: {
      jobTitle: user.profession || user.occupation || '',
      memberOf: {
        "@type": "Organization",
        "name": "BHAVYA Associates",
        "url": "https://bhavyasangh.com"
      }
    }
  };
};

/**
 * Generate proper meta tags for a business listing
 * 
 * @param {Object} listing - Listing data
 * @returns {Object} Meta tag properties
 */
export const generateListingMetaTags = (listing) => {
  if (!listing) return {};
  
  // Create a description from the listing information
  let description = listing.description || `${listing.title} - Service listing on BHAVYA Associates`;
  if (description.length > 155) {
    description = description.substring(0, 152) + '...';
  }
  
  // Add category if available and not already in description
  if (listing.category && !description.toLowerCase().includes(listing.category.toLowerCase())) {
    description = `${listing.category} - ${description}`;
  }
  
  return {
    title: `${listing.title} | BHAVYA Service Listing`,
    description: description,
    image: getListingShareImage(listing),
    url: `https://bhavyasangh.com/service-listings/${listing._id}`,
    type: 'product',
    schemaType: 'Service',
    structuredData: {
      provider: listing.user ? {
        "@type": "Person",
        "name": listing.user.name,
        "url": `https://bhavyasangh.com/user-profile/${listing.user._id}`
      } : undefined,
      category: listing.category || undefined,
      areaServed: "Bahujan Community",
      serviceType: listing.category || undefined
    }
  };
};
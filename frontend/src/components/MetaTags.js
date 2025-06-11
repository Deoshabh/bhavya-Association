import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * MetaTags component for managing meta tags and OpenGraph/Twitter card information
 * This component allows for dynamic meta tag updates across the app and will override
 * the default static tags in index.html when provided
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.url - Canonical URL for the page (full absolute URL)
 * @param {string} props.image - Image URL for social media sharing (full absolute URL)
 * @param {string} props.type - Content type (default: 'website')
 * @param {string} props.schemaType - Schema.org type for JSON-LD (default based on type)
 * @param {Object} props.structuredData - Additional structured data for JSON-LD
 */
const MetaTags = ({
  title = 'बहुजन व्यापार एसोसिएशन - BHAVYA Associates',
  description = 'लिंक पर क्लिक करके बहुजन व्यापार एसोसिएशन कम्युनिटी की सदस्यता निशुल्क प्राप्त करे     Get the free membership of Bahujan Vyapar Association by clicking on the given Link https://bhavyasangh.com/bahujan-directory/',
  url = 'https://bhavyasangh.com',
  image = 'https://bhavyasangh.com/share-images/bhavya-social-share.png',
  type = 'website',
  schemaType,
  structuredData = {}
}) => {
  // Make sure all URLs are absolute
  const siteUrl = 'https://bhavyasangh.com';
  
  // Ensure URL is absolute
  const absoluteUrl = url.startsWith('http') ? url : `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  // Ensure image URL is absolute
  const absoluteImageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  
  // Determine the schema type based on the OG type if not explicitly provided
  const jsonLdType = schemaType || (
    type === 'website' ? 'WebSite' :
    type === 'article' ? 'Article' :
    type === 'profile' ? 'Person' :
    type === 'product' ? 'Product' : 'Organization'
  );
  
  // Prepare structured data for JSON-LD
  const prepareJsonLd = () => {
    // Base structured data
    const baseData = {
      "@context": "https://schema.org",
      "@type": jsonLdType,
      "name": title,
      "description": description,
      "url": absoluteUrl,
      "image": absoluteImageUrl,
    };
    
    // Add organization data for all pages
    const orgData = {
      "publisher": {
        "@type": "Organization",
        "name": "BHAVYA Associates",
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/logo192.png`
        }
      }
    };
    
    // Merge base data with type-specific data and custom structured data
    return {
      ...baseData,
      ...orgData,
      ...structuredData
    };
  };
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={absoluteUrl} />
      
      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:secure_url" content={absoluteImageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="BHAVYA Associates" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={absoluteUrl} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      <meta name="twitter:image:alt" content={`BHAVYA Associates - ${title}`} />
      
      {/* Structured Data (JSON-LD) for SEO and Rich Snippets */}
      <script type="application/ld+json">
        {JSON.stringify(prepareJsonLd())}
      </script>
    </Helmet>
  );
};

export default MetaTags;
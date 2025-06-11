import React from 'react';
import { Helmet } from 'react-helmet';
import { SOCIAL_SHARE_CONFIG } from '../utils/socialShareConfig';

/**
 * Enhanced MetaTags component for comprehensive social sharing and SEO
 * Supports Hindi content with proper encoding and all major social platforms
 */
const MetaTags = ({ 
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  article = null,
  useCustomMessage = true
}) => {
  const config = SOCIAL_SHARE_CONFIG;
  
  // Set defaults with fallbacks
  const metaTitle = title || config.defaultTitle;
  const metaDescription = description || (useCustomMessage ? config.defaultDescription : 'Connect with professionals and entrepreneurs from the Bahujan Samaj. Join our community to collaborate and grow together.');
  const metaImage = image || config.defaultImage;
  const metaUrl = url || config.siteUrl;
  const metaKeywords = keywords || config.keywords.join(', ');
  
  // Ensure URLs are absolute
  const absoluteUrl = metaUrl.startsWith('http') ? metaUrl : `${config.siteUrl}${metaUrl.startsWith('/') ? '' : '/'}${metaUrl}`;
  const absoluteImageUrl = metaImage.startsWith('http') ? metaImage : `${config.siteUrl}${metaImage.startsWith('/') ? '' : '/'}${metaImage}`;
  
  // Prepare structured data
  const prepareJsonLd = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type === 'website' ? 'WebSite' : 'Organization',
      "name": metaTitle,
      "description": metaDescription,
      "url": absoluteUrl,
      "image": absoluteImageUrl,
      "publisher": {
        "@type": "Organization",
        "name": config.siteName,
        "logo": {
          "@type": "ImageObject",
          "url": config.logoImage
        }
      }
    };
    
    if (article) {
      return {
        ...baseData,
        "@type": "Article",
        "author": {
          "@type": "Person",
          "name": article.author || config.author
        },
        "datePublished": article.publishedTime,
        "dateModified": article.modifiedTime || article.publishedTime
      };
    }
    
    return baseData;
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={config.author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Hindi" />
      <meta name="charset" content="utf-8" />
      <link rel="canonical" href={absoluteUrl} />
      
      {/* Open Graph / Facebook Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:secure_url" content={absoluteImageUrl} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${config.siteName} - बहुजन समुदाय का व्यापारिक नेटवर्क`} />
      <meta property="og:site_name" content={config.siteName} />
      <meta property="og:locale" content={config.locale} />
      <meta property="og:locale:alternate" content="en_US" />
      
      {/* Article-specific Open Graph */}
      {article && (
        <>
          <meta property="article:author" content={article.author || config.author} />
          <meta property="article:publisher" content={config.publisher} />
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={config.twitterHandle} />
      <meta name="twitter:creator" content={config.twitterHandle} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      <meta name="twitter:image:alt" content={`${config.siteName} - बहुजन समुदाय का व्यापारिक नेटवर्क`} />
      <meta name="twitter:url" content={absoluteUrl} />
      
      {/* WhatsApp/Telegram Sharing (uses Open Graph) */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* LinkedIn Sharing */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="627" />
      
      {/* Mobile and Theme */}
      <meta name="theme-color" content="#1e40af" />
      <meta name="apple-mobile-web-app-title" content={config.appName} />
      <meta name="application-name" content={config.appName} />
      
      {/* Geographic Information */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.country" content="India" />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(prepareJsonLd())}
      </script>
    </Helmet>
  );
};

export default MetaTags;
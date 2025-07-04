import React from 'react';
import { Helmet } from 'react-helmet';
import { SOCIAL_SHARE_CONFIG, generatePageMeta } from '../utils/socialShareConfig';

/**
 * Enhanced SEO component with comprehensive Open Graph and Twitter Card support
 * Supports Hindi content with proper encoding
 */
const SEOMetaTags = ({ 
  pageKey = 'home',
  title,
  description,
  image,
  url,
  type = 'website',
  article = null,
  customMeta = {}
}) => {
  // Generate meta data for the page
  const meta = generatePageMeta(pageKey, { title, description, image, url });
  const config = SOCIAL_SHARE_CONFIG;
  
  // Construct canonical URL
  const canonicalUrl = url || meta.url;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="author" content={config.author} />
      <meta name="publisher" content={config.publisher} />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Language and Character Encoding */}
      <meta charSet="utf-8" />
      <meta httpEquiv="Content-Language" content="hi, en" />
      <meta name="language" content="Hindi" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:image:secure_url" content={meta.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${config.siteName} - बहुजन समुदाय का व्यापारिक नेटवर्क`} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={config.siteName} />
      <meta property="og:locale" content={config.locale} />
      <meta property="og:locale:alternate" content="en_US" />
      
      {/* Article-specific Open Graph (for blog posts, etc.) */}
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
          {article.section && (
            <meta property="article:section" content={article.section} />
          )}
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={config.twitterHandle} />
      <meta name="twitter:creator" content={config.twitterHandle} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={meta.image} />
      <meta name="twitter:image:alt" content={`${config.siteName} - बहुजन समुदाय का व्यापारिक नेटवर्क`} />
      <meta name="twitter:url" content={canonicalUrl} />
      
      {/* Facebook App ID (if available) */}
      {config.facebookAppId && (
        <meta property="fb:app_id" content={config.facebookAppId} />
      )}
      
      {/* WhatsApp Sharing (Open Graph covers this, but explicit is better) */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      
      {/* LinkedIn Sharing */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="627" />
      
      {/* Mobile App Meta Tags */}
      <meta name="apple-mobile-web-app-title" content={config.appName} />
      <meta name="application-name" content={config.appName} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#1e40af" />
      <meta name="msapplication-TileColor" content="#1e40af" />
      <meta name="msapplication-navbutton-color" content="#1e40af" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#1e40af" />
      
      {/* Geographic and Business Information */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.country" content="India" />
      <meta name="geo.placename" content="India" />
      <meta name="ICBM" content="20.5937, 78.9629" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />
      <meta name="revisit-after" content="1 days" />
      <meta name="coverage" content="Worldwide" />
      <meta name="target" content="all" />
      <meta name="HandheldFriendly" content="True" />
      <meta name="MobileOptimized" content="320" />
      
      {/* Rich Snippets / Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": config.siteName,
          "url": config.siteUrl,
          "logo": config.logoImage,
          "description": meta.description,
          "foundingDate": "2024",
          "founders": [
            {
              "@type": "Person",
              "name": config.author
            }
          ],
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN",
            "addressRegion": "India"
          },
          "sameAs": [
            config.siteUrl
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": ["Hindi", "English"]
          }
        })}
      </script>
      
      {/* Custom Meta Tags */}
      {Object.entries(customMeta).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
    </Helmet>
  );
};

export default SEOMetaTags;

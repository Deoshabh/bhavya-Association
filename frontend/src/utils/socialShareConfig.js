/**
 * Social sharing metadata configuration
 * Contains all the content for Open Graph and Twitter Card meta tags
 */

export const SOCIAL_SHARE_CONFIG = {
  // Site Information
  siteName: "BHAVYA - Bharat Vyapar Associates",
  siteUrl: "https://bhavyasangh.com",
  
  // Default Meta Information
  defaultTitle: "BHAVYA - Bharat Vyapar Associates | बहुजन समुदाय का व्यापारिक नेटवर्क",
  defaultDescription: `बहुजनो----
(समाज का पैसा समाज में) 

"अपना धन अपने पास" 
सेवा में चुनो अपना खास।
अपनों को सहयोग करो,
स्वनिर्मित उपभोग करो।।

1. इंजीनियर *बहुजन* चुनिए
2. मेडिकल स्टोर *बहुजन* चुनिए
3. मोची *बहुजन* चुनिए
4. नाई *बहुजन* चुनिए
5. ट्रेवल बुकिंग *बहुजन* चुनिए
6. मिठाई की दुकान *बहुजन* चुनिए
7. सब्जी और फ्रूट वाला *बहुजन* चुनिए
8. भाजी वाला *बहुजन* चुनिए
9. होटल *बहुजन* चुनिए
10. वकील *बहुजन* चुनिए
11. बीमा सलाहकार *बहुजन* चुनिए
12. कपड़े का शोरूम व दुकान *बहुजन* चुनिए
13. हार्डवेअर दुकान *बहुजन* चुनिए
14. प्रिटिंग प्रेस *बहुजन* चुनिए
15. मोबाइल रिचार्ज स्टोर *बहुजन* चुनिए
16. दूध डेरी *बहुजन* चुनिए
17. Xerox सेंटर *बहुजन* चुनिए
18. स्टेशनरी स्टोर्स *बहुजन* चुनिए
19. सी.ए. *बहुजन* चुनिए
20. डॉक्टर *बहुजन* चुनिए
21. दूधवाला *बहुजन* चुनिए
22. कृषि सेवा केंद्र *बहुजन* चुनिए
23. फ्लोर मिल *बहुजन* चुनिए
24. मिस्त्री *बहुजन* चुनिए
25. इलेक्ट्रॉनिक व इलेक्ट्रीकल स्टोर *बहुजन* चुनिए
26. किराना स्टोअर्स *बहुजन* चुनिए
27. और सभी चीजों के लिए स्वसमाज सर्विस एवं प्रोडक्श ही चुनें।

मिशन संदेश को शेयर करें जुड़ेंगे जीतेंगे ।
*और अपना धन रहेगा अपनों के पास*

रजिस्टर्ड करें निशुल्क 
ताकि और भी बहुजन आपसे बात संपर्क कर सकें।`,
  // Images
  defaultImage: "https://bhavyasangh.com/share-images/bhavya-social-share.png",
  logoImage: "https://bhavyasangh.com/logo192.png",
  faviconImage: "https://bhavyasangh.com/favicon.ico",
  
  // Social Media
  twitterHandle: "@bhavyasangh",
  facebookAppId: "", // Add if you have one
  
  // Author/Organization
  author: "BHAVYA Associates",
  publisher: "BHAVYA - Bharat Vyapar Associates",
  
  // Additional SEO
  keywords: [
    "बहुजन",
    "व्यापार",
    "समुदाय",
    "नेटवर्क", 
    "bahujan",
    "business",
    "community",
    "bhavya",
    "associates",
    "भारत व्यापार",
    "समाज सेवा",
    "उद्योग",
    "व्यवसाय"
  ],
  
  // Language and Region
  locale: "hi_IN",
  alternateLocales: ["en_US", "hi_IN"],
  
  // App Information
  appName: "BHAVYA",
  appId: {
    ios: "", // Add if you have iOS app
    android: "", // Add if you have Android app
    windows: ""
  }
};

/**
 * Page-specific meta configurations
 */
export const PAGE_META = {
  home: {
    title: "BHAVYA - बहुजन समुदाय का व्यापारिक नेटवर्क | Home",
    description: "बहुजन समुदाय के लिए व्यापारिक नेटवर्क। अपना धन अपने पास रखें। स्वसमाज की सेवा चुनें।",
    keywords: ["home", "bhavya", "bahujan", "business", "network"]
  },
  
  directory: {
    title: "Directory - बहुजन व्यापारी खोजें | BHAVYA",
    description: "बहुजन समुदाय के व्यापारियों और सेवा प्रदाताओं की डायरेक्टरी। अपने क्षेत्र के बहुजन व्यापारियों से जुड़ें।",
    keywords: ["directory", "bahujan", "business", "professionals", "services"]
  },
  
  services: {
    title: "Services - बहुजन सेवाएं | BHAVYA",
    description: "बहुजन समुदाय की विभिन्न सेवाएं - इंजीनियर, डॉक्टर, वकील, व्यापारी और अन्य पेशेवर।",
    keywords: ["services", "bahujan", "professionals", "business"]
  },
  
  profile: {
    title: "Profile - प्रोफाइल | BHAVYA",
    description: "अपनी प्रोफाइल बनाएं और बहुजन समुदाय के नेटवर्क में शामिल हों।",
    keywords: ["profile", "registration", "bahujan", "community"]
  }
};

/**
 * Generate meta tags for a specific page
 */
export const generatePageMeta = (pageKey, customData = {}) => {
  const defaultMeta = SOCIAL_SHARE_CONFIG;
  const pageMeta = PAGE_META[pageKey] || {};
  
  return {
    title: customData.title || pageMeta.title || defaultMeta.defaultTitle,
    description: customData.description || pageMeta.description || defaultMeta.defaultDescription,
    image: customData.image || defaultMeta.defaultImage,
    url: customData.url || `${defaultMeta.siteUrl}${pageKey === 'home' ? '' : '/' + pageKey}`,
    keywords: [...(pageMeta.keywords || []), ...defaultMeta.keywords].join(', ')
  };
};

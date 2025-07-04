# Social Banner Image Requirements

## Location
The social banner image should be created at:
`frontend/public/share-images/social-banner.jpg`

## Specifications
- **Size**: 1200 × 630 pixels (Facebook/LinkedIn optimal)
- **Format**: JPG (for smaller file size and compatibility)
- **Content**: 
  - BHAVYA logo prominently displayed
  - Hindi text: "बहुजन समुदाय का व्यापारिक नेटवर्क"
  - Subtitle: "अपना धन अपने पास"
  - Website URL: bhavyasangh.com
  - Color scheme matching your brand

## Alternative Images
Create these additional sizes for optimal social sharing:

1. **Twitter**: 1200 × 600 pixels
2. **WhatsApp**: 1080 × 1080 pixels (square)
3. **Instagram**: 1080 × 1080 pixels (square)

## Fallback
Until custom banner is created, the system will use:
- `logo192.png` as fallback image
- Existing brand colors and styling

## Creating the Banner
You can:
1. Use the existing `logo4-1.png` from assets folder
2. Add the Hindi text overlay
3. Use brand colors (blue theme: #1e40af)
4. Include website URL at bottom

## File Structure
```
frontend/public/share-images/
├── social-banner.jpg          (1200×630 - Primary)
├── social-banner-twitter.jpg  (1200×600 - Twitter)
├── social-banner-square.jpg   (1080×1080 - WhatsApp/Instagram)
└── README.txt                 (This file)
```

## Test Links
After deployment, test social sharing on:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
- WhatsApp: Share directly to check preview

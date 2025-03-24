backend/
├── app.js                  # Main Express application file
├── config/
│   └── db.js               # Database configuration and connection
├── middleware/
│   ├── dbConnection.js     # Database connection middleware
│   ├── auth.js             # Authentication middleware
│   └── roleBasedAccess.js  # Role-based access control middleware
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── profile.js          # Profile routes
│   ├── directory.js        # Directory routes
│   ├── users.js            # User routes
│   ├── listings.js         # Listings routes
│   └── admin.js            # Admin panel routes
├── controllers/
│   ├── userController.js   # User management logic
│   ├── listingController.js # Listing management logic
│   └── adminController.js  # Admin dashboard operations
└── utils/
    ├── validateUserSchema.js  # Schema validation utility
    ├── modelUtil.js           # Model verification
    └── adminUtils.js          # Admin utilities
    
frontend/
├── package.json            # NPM package configuration
└── src/
    ├── App.js              # Main React application component
    ├── components/
    │   ├── Navbar.js
    │   ├── ProtectedRoute.js
    │   ├── ServerStatus.js
    │   ├── AccountStatusManager.js
    │   ├── SidebarLayout.js
    │   ├── BottomNavigation.js
    │   ├── Footer.js
    │   ├── UserCard.js
    │   ├── DirectoryDebugConsole.js
    │   ├── PremiumBanner.js
    │   └── admin/
    │       ├── AdminSidebar.js
    │       ├── UserManagement.js
    │       ├── ListingModeration.js
    │       ├── PremiumMembershipManager.js
    │       ├── SystemStatusMonitor.js
    │       └── ConfigPanel.js
    ├── context/
    │   ├── AuthContext.js    # Authentication context provider
    │   └── AdminContext.js   # Admin state management
    ├── hooks/
    │   ├── useAuthenticatedRequest.js
    │   └── useAdminActions.js
    ├── pages/
    │   ├── Home.js
    │   ├── Login.js
    │   ├── Register.js
    │   ├── Profile.js
    │   ├── Directory.js
    │   ├── UserProfilePage.js
    │   ├── UpgradeMembership.js
    │   ├── ServiceListings.js
    │   ├── CreateListing.js
    │   ├── ListingDetails.js
    │   ├── PrivacyPolicy.js
    │   ├── Terms.js
    │   ├── FAQ.js
    │   └── admin/
    │       ├── AdminDashboard.js
    │       ├── UserDirectory.js
    │       ├── ListingApproval.js
    │       ├── CategoryManagement.js
    │       ├── PaymentTracking.js
    │       └── SystemSettings.js
    ├── styles/
    │   ├── Directory.css
    │   └── Admin.css
    └── utils/
        ├── serverUtils.js
        └── adminUtils.js
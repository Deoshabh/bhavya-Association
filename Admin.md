Understand the Bhavya Associates Website:-
this is a community website for the "Bhavya Associates" with the following core features:
Current Website Structure & Logic
User Management System

Registration and login (phone number based authentication)
User profiles with personal information
JWT-based authentication
Member Directory

Searchable database of members
Privacy controls (users can hide their profiles)
Visibility based on account status (active, deactivated, suspended)
Tiered Membership Model

Free/Basic members: Limited access to contact information
Premium members (₹499/year): Full access to contact details
Admin users (currently rudimentary)
Service Listings / Business Directory

Users can create service listings
Contact information visibility is controlled by membership tier
Technical Architecture
Frontend: React.js with context-based state management
Backend: Express.js REST API with MongoDB
Directory data caching and throttling
Admin Requirements
To create a comprehensive admin functionality for this website, you would need:

1. Admin Authentication & Authorization:- 
•	Admin Login Panel: Dedicated or enhanced login for admins
•	Authorization Middleware.
•	Role-Based Access Control: Expanded permissions system beyond the current basic check
2. Admin Dashboard
•	Overview Dashboard: Stats on users, listings, premium conversions
3. User Management Features with CRUDE functionaites:-
•	User Directory: Enhanced view of all users regardless of visibility settings
•	User Editing: Ability to modify user details, including:
•	Change membership tier (free/premium/admin)
•	Modify account status (active/deactivated/suspended)
•	Reset passwords or assist with account recovery
•	User Search: Advanced filtering and search capabilities
4. Service Listing Management
•	Listing Approval Workflow: Review and approve new listings
•	Content Moderation: Edit or remove inappropriate listings
•	Category Management: Create/edit service categories
5. Premium Membership Management
•	Payment Tracking: Monitor premium subscription payments
•	Manual Upgrades: Force upgrade a user to premium
•	Subscription Management: Extend, revoke, or modify premium status
6. Configuration Controls
•	Directory Settings: Configure visibility rules and search behavior
•	System Settings: Modify application behaviors without code changes
•	Feature Toggles: Enable/disable specific features
7. Support Tools
•	User Impersonation: View site as a specific user for troubleshooting
•	Audit Logs: Track admin actions for accountability
•	Support Case Management: Handle user issues and requests
8. Technical Requirements
•	Secure Admin API Routes: Additional backend routes for admin functions
•	Enhanced Frontend Components: Admin-specific UI components
•	Logging & Monitoring: Track admin actions and system performance
•	The existing codebase already has some admin functionality (particularly in directory   management), but would need significant expansion to create a full-featured admin system.

# Bhavya Associates Admin Guide

This document provides instructions for creating and managing admin users in the Bhavya Associates application.

## Creating an Admin User

To create an admin user, follow these steps:

1. Ensure you have a user registered in the system with a regular account
2. Run the admin creation script:

```bash
cd backend
node scripts/create-admin.js
```

3. Follow the prompts to select a user to promote to admin
4. The selected user will be promoted to admin and will have the following characteristics:
   - Plan type set to "admin"
   - Hidden from the Directory (isPublic set to false)
   - Full access to admin features

## Admin Features

As an admin user, you will have access to:

1. Admin Dashboard with statistics
2. User Management
3. Listing Management
4. Directory Configuration
5. Settings Management

## Admin Login

Admin users can log in through:

1. The regular login page - they will be redirected to the admin dashboard
2. The dedicated admin login page at `/admin-login`

## Important Notes

- Admin users are automatically hidden from the Directory page
- Admin users have full access to all features and can modify any user or listing
- Be careful when promoting users to admin as they will have full control over the application

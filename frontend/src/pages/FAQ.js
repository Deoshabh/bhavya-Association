import React from 'react';
import BackButton from '../components/BackButton';

const FAQ = () => {
  return (
    <div className="faq-container">
      <div className="faq-header">
        <BackButton />
        <h1>Frequently Asked Questions</h1>
      </div>
      
      <div className="faq-content">
        <section className="faq-section">
          <h2>Account & Registration</h2>
          
          <div className="faq-item">
            <h3>How do I create an account?</h3>
            <p>
              You can create an account by clicking the "Register" button in the top right corner of the website. 
              You'll need to provide your name, phone number, occupation, and create a password.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Is there any fee to register?</h3>
            <p>
              Basic registration is free. However, we offer a Premium membership tier with additional features for an annual fee.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>How do I update my profile information?</h3>
            <p>
              After logging in, go to your Profile page and click the "Edit Profile" button. You can update your bio, 
              interests, profile picture, and other details there.
            </p>
          </div>
        </section>
        
        <section className="faq-section">
          <h2>Membership Tiers</h2>
          
          <div className="faq-item">
            <h3>What's the difference between Basic and Premium membership?</h3>
            <p>
              Basic members can view the directory but have limited access to contact information. Premium members 
              can view full contact details of all members, receive priority support, and access exclusive features.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>How much does Premium membership cost?</h3>
            <p>
              Premium membership costs ₹499 per year. This gives you full access to all features for 12 months from 
              the date of purchase.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Can I upgrade to Premium membership at any time?</h3>
            <p>
              Yes, you can upgrade your membership at any time from the "Upgrade Membership" page in your account.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Is there a refund if I don't like the Premium features?</h3>
            <p>
              All Premium membership payments are non-refundable. We encourage you to review the Premium features 
              before upgrading.
            </p>
          </div>
        </section>
        
        <section className="faq-section">
          <h2>Directory Features</h2>
          
          <div className="faq-item">
            <h3>How do I search for members in the directory?</h3>
            <p>
              You can search for members by name, occupation, or interests using the search bar in the Member Directory. 
              You can also filter by occupation to narrow down your search.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Can I hide my profile from the directory?</h3>
            <p>
              Yes, you can control your profile visibility from the Privacy Settings tab in your Profile page. 
              When hidden, your profile won't appear in directory searches for other members.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Can Basic members see my contact information?</h3>
            <p>
              Basic members can see your name, occupation, and interests, but not your full contact details. 
              Only Premium members can view your phone number and email address.
            </p>
          </div>
        </section>
        
        <section className="faq-section">
          <h2>Business Directory</h2>
          
          <div className="faq-item">
            <h3>How do I list my business or service?</h3>
            <p>
              You can create a business listing by clicking the "Add New Service" button in the Business Directory. 
              You'll need to provide details about your service, category, and contact information.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Is there a fee to list my services?</h3>
            <p>
              Creating a business listing is free for all members.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Who can see my business listing?</h3>
            <p>
              All members can see your business listing, but only Premium members can view your full contact details.
            </p>
          </div>
        </section>
        
        <section className="faq-section">
          <h2>Privacy & Security</h2>
          
          <div className="faq-item">
            <h3>How is my personal information protected?</h3>
            <p>
              We implement security measures to protect your information. For full details, please review our 
              <a href="/privacy-policy"> Privacy Policy</a>.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>Can I delete my account?</h3>
            <p>
              Yes, you can delete your account permanently from the Profile Settings page. This will remove all your 
              data from our system.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>What happens if I deactivate my account?</h3>
            <p>
              Account deactivation temporarily hides your profile from the directory, but preserves your account 
              data. You can reactivate your account by logging in again.
            </p>
          </div>
        </section>
        
        <section className="faq-section">
          <h2>Technical Support</h2>
          
          <div className="faq-item">
            <h3>What should I do if I forget my password?</h3>
            <p>
              If you forget your password, click the "Forgot Password" link on the login page. 
              You'll receive instructions to reset your password via the phone number or email associated with your account.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>The website isn't working properly. What should I do?</h3>
            <p>
              Try refreshing the page or clearing your browser cache. If the issue persists, please contact our support 
              team at support@bhavyaAssociates.org.
            </p>
          </div>
          
          <div className="faq-item">
            <h3>How do I report a bug or issue?</h3>
            <p>
              You can report bugs or issues by emailing our support team at support@bhavyaAssociates.org. Please include 
              details about the issue and steps to reproduce it if possible.
            </p>
          </div>
        </section>
        
        <section className="faq-section">
          <h2>Contact & Support</h2>
          
          <div className="faq-item">
            <h3>How can I contact Bhavya Associates?</h3>
            <p>
              For general inquiries, you can reach us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> contact@bhavyaAssociates.org</p>
              <p><strong>Phone:</strong> +91 12345 67890</p>
            </div>
          </div>
          
          <div className="faq-item">
            <h3>How can I provide feedback or suggestions?</h3>
            <p>
              We welcome your feedback and suggestions! Please email us at feedback@bhavyaAssociates.org with your ideas.
            </p>
          </div>
        </section>
        
        <div className="faq-footer">
          <p>Last Updated: May 2024</p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

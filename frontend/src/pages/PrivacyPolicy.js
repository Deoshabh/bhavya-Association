import React from 'react';
import BackButton from '../components/BackButton';
import '../styles/PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-header">
        <BackButton />
        <h1>Privacy Policy</h1>
      </div>
      
      <div className="privacy-policy-content">
        <section className="policy-section">
          <h2>Introduction</h2>
          <p>
            Welcome to Bhavya Association's Privacy Policy. This Privacy Policy describes how your personal information 
            is collected, used, and shared when you visit or make use of our website and services.
          </p>
          <p>
            We respect your privacy and are committed to protecting your personal data. Please read this 
            Privacy Policy carefully to understand our policies and practices regarding your information.
          </p>
        </section>
        
        <section className="policy-section">
          <h2>Information We Collect</h2>
          <p>
            We collect several types of information from and about users of our website, including:
          </p>
          <ul>
            <li>
              <strong>Personal identifiable information</strong> such as your name, phone number, email address, 
              occupation, and other details you provide when registering on our site.
            </li>
            <li>
              <strong>Profile information</strong> including your biography, interests, profile picture, and address 
              that you choose to share on your profile.
            </li>
            <li>
              <strong>Usage data</strong> which may include information about how you use our website and services.
            </li>
            <li>
              <strong>Technical data</strong> including internet protocol (IP) address, browser type and version, 
              time zone setting, and operating system and platform.
            </li>
          </ul>
        </section>
        
        <section className="policy-section">
          <h2>How We Use Your Information</h2>
          <p>
            We use the information we collect about you to:
          </p>
          <ul>
            <li>Create and manage your account</li>
            <li>Provide the services you request</li>
            <li>Display your profile in the member directory (if you've opted to be publicly visible)</li>
            <li>Improve and optimize our website and services</li>
            <li>Communicate with you about your account or our services</li>
            <li>Detect and prevent fraudulent or unauthorized activity</li>
          </ul>
        </section>
        
        <section className="policy-section">
          <h2>Sharing Your Information</h2>
          <p>
            We share your personal information with other members of Bhavya Association according to your privacy 
            settings and membership level. Premium members have access to more contact information than non-premium members.
          </p>
          <p>
            We may also share your information with:
          </p>
          <ul>
            <li>Service providers who perform services on our behalf</li>
            <li>Professional advisers including lawyers, auditors, and insurers</li>
            <li>Government bodies that require us to report processing activities</li>
          </ul>
          <p>
            We will not sell your personal information to third parties.
          </p>
        </section>
        
        <section className="policy-section">
          <h2>Your Privacy Controls</h2>
          <p>
            You have several choices about how we use your information:
          </p>
          <ul>
            <li>
              <strong>Account Information:</strong> You can update, correct or delete your account information at any time by logging into your account.
            </li>
            <li>
              <strong>Privacy Settings:</strong> You can control the visibility of your profile in the directory through the Profile Settings page.
            </li>
            <li>
              <strong>Account Deactivation:</strong> You can temporarily deactivate your account, which hides your profile from the directory.
            </li>
            <li>
              <strong>Account Deletion:</strong> You can permanently delete your account and all associated information.
            </li>
          </ul>
        </section>
        
        <section className="policy-section">
          <h2>Data Security</h2>
          <p>
            We have implemented measures designed to secure your personal information from accidental loss and from 
            unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on 
            secure servers.
          </p>
          <p>
            Unfortunately, the transmission of information via the internet is not completely secure. Although we do 
            our best to protect your personal information, we cannot guarantee the security of your personal information 
            transmitted to our website.
          </p>
        </section>
        
        <section className="policy-section">
          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18, and we do not knowingly collect personal 
            information from children under 18. If you are a parent or guardian and believe we have collected information 
            from your child, please contact us so that we can delete the information.
          </p>
        </section>
        
        <section className="policy-section">
          <h2>Changes to Our Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. If we make material changes, we will notify you by email 
            or through a notice on our home page. The date this Privacy Policy was last revised is identified at the bottom 
            of the page.
          </p>
        </section>
        
        <section className="policy-section">
          <h2>Contact Information</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> contact@bhavyaassociation.org</p>
            <p><strong>Phone:</strong> +91 12345 67890</p>
          </div>
        </section>
        
        <div className="policy-footer">
          <p>Last Updated: May 2024</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

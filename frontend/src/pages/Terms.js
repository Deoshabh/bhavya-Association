import React from 'react';
import BackButton from '../components/BackButton';
import '../styles/Terms.css';

const Terms = () => {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <BackButton />
        <h1>Terms & Conditions</h1>
      </div>
      
      <div className="terms-content">
        <section className="terms-section">
          <h2>Introduction</h2>
          <p>
            Welcome to Bhavya Association's Terms and Conditions. These terms govern your use of our website and services.
            By accessing or using the Bhavya Association website and services, you agree to be bound by these Terms.
          </p>
          <p>
            Please read these Terms carefully before using our website. If you do not agree to these Terms, you must not use our website.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Membership</h2>
          <p>
            Membership in Bhavya Association is available to eligible individuals from the Bahujan Samaj community.
            By registering for an account, you agree to:
          </p>
          <ul>
            <li>Provide accurate and complete information during the registration process</li>
            <li>Maintain and update your information to keep it accurate and current</li>
            <li>Protect your account credentials and not share them with others</li>
            <li>Accept responsibility for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>
        
        <section className="terms-section">
          <h2>Membership Tiers</h2>
          <p>
            We offer different membership tiers with varying features and benefits:
          </p>
          <ul>
            <li><strong>Basic Membership:</strong> Free membership with limited access to member directory and basic features</li>
            <li><strong>Premium Membership:</strong> Paid membership with full access to contact information, priority support, and enhanced services</li>
          </ul>
          <p>
            Premium membership is subject to payment of applicable fees as described on our website. All payments are non-refundable unless otherwise stated.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Acceptable Use</h2>
          <p>
            When using our website and services, you agree NOT to:
          </p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others, including privacy and intellectual property rights</li>
            <li>Share or post content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
            <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity</li>
            <li>Attempt to gain unauthorized access to other user accounts, computer systems, or networks</li>
            <li>Transmit any viruses, malware, or other harmful code</li>
            <li>Use automated means to access or collect data from our website without our prior consent</li>
            <li>Interfere with the proper functioning of the website</li>
          </ul>
        </section>
        
        <section className="terms-section">
          <h2>User Content</h2>
          <p>
            When you post, upload, or share content on our platform ("User Content"), you:
          </p>
          <ul>
            <li>Retain all ownership rights to your User Content</li>
            <li>Grant us a non-exclusive, transferable, sub-licensable, royalty-free, worldwide license to use, store, display, reproduce, modify, and distribute your User Content</li>
            <li>Represent and warrant that you own or have the necessary rights to your User Content and that it does not violate these Terms</li>
          </ul>
          <p>
            We reserve the right to remove any User Content that violates these Terms or that we find objectionable for any reason.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Directory Listings</h2>
          <p>
            The business and member directories are provided for the benefit of our community. We are not responsible for:
          </p>
          <ul>
            <li>The accuracy or reliability of information provided by members in their directory listings</li>
            <li>The quality of services or interactions between members</li>
            <li>Any transactions, agreements, or arrangements made between members</li>
          </ul>
          <p>
            Users are encouraged to exercise due diligence when contacting or engaging with other members.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Intellectual Property</h2>
          <p>
            All content on our website, including text, graphics, logos, icons, images, and software, is the property of 
            Bhavya Association or our licensors and is protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p>
            You may access, view, download, and print content from our website for your personal, non-commercial use, provided 
            you do not modify or delete any copyright, trademark, or other proprietary notices.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Bhavya Association and its officers, directors, employees, and agents 
            shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not 
            limited to, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
          <p>
            Our total liability for any claims under these Terms shall not exceed the amount you paid to us in the past 12 months.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Termination</h2>
          <p>
            We may terminate or suspend your account and access to our services at our sole discretion, without prior notice or 
            liability, for any reason, including without limitation if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use our services will immediately cease. All provisions of these Terms which by their 
            nature should survive termination shall survive, including without limitation, ownership provisions, warranty disclaimers, 
            indemnity, and limitations of liability.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of any material changes by posting the 
            new Terms on our website and updating the "Last Updated" date at the bottom of this page.
          </p>
          <p>
            Your continued use of our website after any changes to these Terms constitutes your acceptance of the new Terms.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict 
            of law provisions.
          </p>
        </section>
        
        <section className="terms-section">
          <h2>Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> contact@bhavyaassociation.org</p>
            <p><strong>Phone:</strong> +91 12345 67890</p>
          </div>
        </section>
        
        <div className="terms-footer">
          <p>Last Updated: May 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;

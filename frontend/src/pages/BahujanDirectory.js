import React from 'react';
import { useNavigate } from 'react-router-dom';
import MetaTags from '../components/MetaTags';

const BahujanDirectory = () => {
  const navigate = useNavigate();

  return (
    <>
      <MetaTags 
        title="बहुजन व्यापार एसोसिएशन - निशुल्क सदस्यता"
        description="लिंक पर क्लिक करके बहुजन व्यापार एसोसिएशन कम्युनिटी की सदस्यता निशुल्क प्राप्त करे     Get the free membership of Bahujan Vyapar Association by clicking on the given Link https://bhavyasangh.com/bahujan-directory/"
        url="https://bhavyasangh.com/bahujan-directory/"
        image="https://bhavyasangh.com/share-images/bhavya-social-share.png"
        type="website"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                बहुजन व्यापार एसोसिएशन
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-100 mb-6">
                BHAVYA Associates
              </h2>
              <p className="text-xl text-blue-50 mb-8">
                निशुल्क सदस्यता प्राप्त करें
              </p>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  स्वागत है! Welcome!
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  बहुजन व्यापार एसोसिएशन में आपका स्वागत है। यहाँ आप निशुल्क सदस्यता प्राप्त कर सकते हैं।
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Welcome to Bahujan Vyapar Association. Get your free membership here.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="text-xl font-semibold text-blue-800 mb-3">
                    सदस्यता के लाभ / Membership Benefits:
                  </h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• व्यावसायिक नेटवर्किंग / Professional Networking</li>
                    <li>• व्यापारिक अवसर / Business Opportunities</li>
                    <li>• सामुदायिक सहयोग / Community Support</li>
                    <li>• मुफ्त डायरेक्टरी लिस्टिंग / Free Directory Listing</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 transform hover:scale-105"
                  >
                    अभी पंजीकरण करें
                    <br />
                    <span className="text-sm">Register Now</span>
                  </button>
                  
                  <button
                    onClick={() => navigate('/directory')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 transform hover:scale-105"
                  >
                    सदस्य निर्देशिका देखें
                    <br />
                    <span className="text-sm">View Directory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BahujanDirectory;

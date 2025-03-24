import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <button className="back-button" onClick={handleBack}>
      <ArrowLeft size={18} />
      <span>Back</span>
    </button>
  );
};

export default BackButton;

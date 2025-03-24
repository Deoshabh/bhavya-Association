import React from 'react';
import '../../styles/Admin/StatCard.css';

const StatCard = ({ title, value, icon, color = 'blue', subtitle, onClick }) => {
  return (
    <div 
      className={`stat-card ${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-details">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value">{value}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatCard;

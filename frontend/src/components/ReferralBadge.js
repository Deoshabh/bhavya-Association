import React from 'react';
import { Users, Award, Star, Trophy } from 'lucide-react';

const ReferralBadge = ({ user, compact = false }) => {
  if (!user?.referralStats || user.referralStats.successfulReferrals === 0) {
    return null;
  }

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'text-orange-600 bg-orange-100 border-orange-200',
      silver: 'text-gray-600 bg-gray-100 border-gray-200',
      gold: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      platinum: 'text-purple-600 bg-purple-100 border-purple-200',
      diamond: 'text-blue-600 bg-blue-100 border-blue-200'
    };
    return colors[tier] || colors.bronze;
  };

  const getTierIcon = (tier) => {
    const icons = {
      bronze: <Award className="h-4 w-4" />,
      silver: <Award className="h-4 w-4" />,
      gold: <Trophy className="h-4 w-4" />,
      platinum: <Star className="h-4 w-4" />,
      diamond: <Star className="h-4 w-4" />
    };
    return icons[tier] || icons.bronze;
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTierColor(user.referralPerks?.currentTier)}`}>
          {getTierIcon(user.referralPerks?.currentTier)}
          <span className="ml-1 capitalize">{user.referralPerks?.currentTier}</span>
        </div>
        <span className="text-xs text-gray-500">
          {user.referralStats.successfulReferrals} referrals
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Community Contributor</h3>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTierColor(user.referralPerks?.currentTier)}`}>
          {getTierIcon(user.referralPerks?.currentTier)}
          <span className="ml-2 capitalize">{user.referralPerks?.currentTier} Member</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-5 w-5 text-blue-600 mr-1" />
            <span className="text-2xl font-bold text-gray-900">
              {user.referralStats.successfulReferrals}
            </span>
          </div>
          <p className="text-sm text-gray-600">Members Referred</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="h-5 w-5 text-yellow-600 mr-1" />
            <span className="text-2xl font-bold text-gray-900">
              {user.referralStats.totalRewardsEarned || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Rewards Earned</p>
        </div>
      </div>

      {user.referralPerks?.specialBadges && user.referralPerks.specialBadges.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Achievements</p>
          <div className="flex flex-wrap gap-1">
            {user.referralPerks.specialBadges.map((badge, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              >
                <Star className="h-3 w-3 mr-1" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralBadge;

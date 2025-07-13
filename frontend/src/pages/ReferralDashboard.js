import {
  Award,
  CheckCircle,
  Copy,
  Eye,
  Gift,
  RefreshCw,
  Share2,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const ReferralDashboard = () => {
  const { api, user } = useContext(AuthContext);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/referrals/info");
      setReferralData(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching referral data:", err);

      // Better error handling based on status codes
      if (err.response) {
        const status = err.response.status;
        const errorMessage =
          err.response.data?.msg ||
          err.response.data?.error ||
          "Unknown server error";

        if (status === 401) {
          setError("Please log in to view your referral dashboard.");
        } else if (status === 404) {
          setError("User not found. Please try logging in again.");
        } else if (status === 500) {
          setError(
            `Server error: ${errorMessage}. Our team has been notified.`
          );
        } else {
          setError(`Error: ${errorMessage}`);
        }
      } else if (err.request) {
        setError(
          "Unable to connect to server. Please check your internet connection."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData?.referralLink) return;

    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareReferralLink = async () => {
    if (!referralData?.referralLink) return;

    const shareData = {
      title: "Join Bhavya Associates",
      text: `Join me on Bhavya Associates - Connect with the Bahujan community worldwide!`,
      url: referralData.referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copying
      copyReferralLink();
    }
  };

  const regenerateCode = async () => {
    try {
      const response = await api.post("/api/referrals/regenerate-code");
      setReferralData((prev) => ({
        ...prev,
        referralCode: response.data.newReferralCode,
        referralLink: response.data.referralLink,
      }));
    } catch (err) {
      console.error("Error regenerating code:", err);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: "text-orange-600 bg-orange-100",
      silver: "text-gray-600 bg-gray-100",
      gold: "text-yellow-600 bg-yellow-100",
      platinum: "text-purple-600 bg-purple-100",
      diamond: "text-blue-600 bg-blue-100",
    };
    return colors[tier] || colors.bronze;
  };

  const getTierIcon = (tier) => {
    const icons = {
      bronze: <Award className="h-5 w-5" />,
      silver: <Award className="h-5 w-5" />,
      gold: <Trophy className="h-5 w-5" />,
      platinum: <Star className="h-5 w-5" />,
      diamond: <Star className="h-5 w-5" />,
    };
    return icons[tier] || icons.bronze;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchReferralData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Referral Dashboard
        </h1>
        <p className="text-gray-600">
          Invite friends and earn rewards for growing our community
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Referrals
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {referralData?.referralStats?.successfulReferrals || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Members
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {referralData?.referralStats?.activeReferrals || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div
              className={`p-3 rounded-lg ${getTierColor(
                referralData?.referralPerks?.currentTier
              )
                .replace("text-", "bg-")
                .replace("-600", "-100")}`}
            >
              {getTierIcon(referralData?.referralPerks?.currentTier)}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Tier</p>
              <p
                className={`text-lg font-bold capitalize ${getTierColor(
                  referralData?.referralPerks?.currentTier
                )}`}
              >
                {referralData?.referralPerks?.currentTier}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Gift className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Rewards Earned
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {referralData?.referralStats?.totalRewardsEarned || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Your Referral Link
          </h2>
          <button
            onClick={regenerateCode}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate Code
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-sm text-gray-600 mb-1">Referral Code</p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {referralData?.referralCode}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={copyReferralLink}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copySuccess ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={shareReferralLink}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Your referral link:</p>
          <p className="break-all">{referralData?.referralLink}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Eye },
            { id: "progress", label: "Progress", icon: TrendingUp },
            { id: "history", label: "History", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tier Progress */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tier Progress
            </h3>

            {referralData?.tierInfo?.next ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    Progress to {referralData.tierInfo.next.tier}
                  </span>
                  <span className="text-sm font-medium">
                    {referralData.referralStats.successfulReferrals} /{" "}
                    {referralData.tierInfo.next.minReferrals}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (referralData.referralStats.successfulReferrals /
                          referralData.tierInfo.next.minReferrals) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {referralData.tierInfo.next.minReferrals -
                    referralData.referralStats.successfulReferrals}{" "}
                  more referrals needed
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-900">
                  Maximum Tier Reached!
                </p>
                <p className="text-gray-600">
                  You've achieved the highest tier
                </p>
              </div>
            )}
          </div>

          {/* Unlocked Features */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Unlocked Features
            </h3>
            <div className="space-y-3">
              {referralData?.referralPerks?.unlockedFeatures?.map(
                (feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700 capitalize">
                      {feature.replace("_", " ")}
                    </span>
                  </div>
                )
              ) || <p className="text-gray-500">No features unlocked yet</p>}
            </div>

            {referralData?.referralPerks?.specialBadges?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Special Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  {referralData.referralPerks.specialBadges.map(
                    (badge, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        {badge}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "progress" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Tier System
          </h3>
          <div className="space-y-4">
            {referralData?.tierInfo?.all?.map((tier, index) => {
              const isActive =
                tier.tier === referralData.referralPerks.currentTier;
              const isCompleted =
                referralData.referralStats.successfulReferrals >=
                tier.minReferrals;

              return (
                <div
                  key={tier.tier}
                  className={`border rounded-lg p-4 ${
                    isActive
                      ? "border-blue-500 bg-blue-50"
                      : isCompleted
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-4 ${getTierColor(
                          tier.tier
                        )}`}
                      >
                        {getTierIcon(tier.tier)}
                      </div>
                      <div>
                        <h4 className="font-semibold capitalize">
                          {tier.tier} Tier
                        </h4>
                        <p className="text-sm text-gray-600">
                          {tier.minReferrals} referrals required
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                        Current
                      </span>
                    )}
                    {isCompleted && !isActive && (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Benefits:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tier.features.map((feature, fIndex) => (
                        <span
                          key={fIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {feature.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Referrals
          </h3>
          {referralData?.recentReferrals?.length > 0 ? (
            <div className="space-y-4">
              {referralData.recentReferrals.map((referral, index) => (
                <div
                  key={referral._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-4">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{referral.referred?.name}</p>
                      <p className="text-sm text-gray-600">
                        Joined{" "}
                        {new Date(
                          referral.referred?.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No referrals yet</p>
              <p className="text-sm text-gray-400">
                Start sharing your referral link to see your referrals here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferralDashboard;

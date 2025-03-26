// Before:
export const DirectoryListing = ({ member }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col sm:flex-row items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
        <img src={member.profileImage || "/default-avatar.png"} alt={member.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-grow text-center sm:text-left">
        <h3 className="text-lg font-semibold text-neutral-800">{member.name}</h3>
        <p className="text-sm text-neutral-600">{member.role || "Member"}</p>
        <p className="text-sm text-neutral-500">{member.location}</p>
      </div>
      <div className="mt-3 sm:mt-0">
        <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );
};

// After:
export const DirectoryListing = ({ member }) => {
  return (
    <div className="card mb-4 flex flex-col sm:flex-row items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
        <img src={member.profileImage || "/default-avatar.png"} alt={member.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-grow text-center sm:text-left">
        <h3 className="heading-3 mb-1">{member.name}</h3>
        <p className="body-text-sm mb-1">{member.role || "Member"}</p>
        <p className="body-text-sm text-neutral-500">{member.location}</p>
      </div>
      <div className="mt-3 sm:mt-0">
        <button className="btn btn-primary">
          View Profile
        </button>
      </div>
    </div>
  );
};


const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} mx-auto mb-2`}
        ></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

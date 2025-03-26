// Complex component with dynamic classes
export const Alert = ({ type = "info", title, message, onClose }) => {
  // Map alert types to component classes
  const alertClasses = {
    success: "alert alert-success",
    error: "alert alert-danger",
    warning: "alert alert-warning",
    info: "alert alert-info"
  };

  // Get the appropriate class or default to info
  const className = alertClasses[type] || alertClasses.info;

  return (
    <div className={className}>
      {title && <h4 className="font-medium mb-1">{title}</h4>}
      <p className={title ? "text-sm" : ""}>{message}</p>
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-current opacity-70 hover:opacity-100"
          aria-label="Close"
        >
          &times;
        </button>
      )}
    </div>
  );
};

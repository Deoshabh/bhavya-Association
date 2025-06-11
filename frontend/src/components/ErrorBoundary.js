import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Oops! Something went wrong</h2>
            <p>We're sorry for the inconvenience. The page encountered an error.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>
                <summary>Error Details (Development Only)</summary>
                <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
                <p><strong>Stack:</strong> {this.state.errorInfo.componentStack}</p>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="retry-button"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="home-button"
              >
                Go Home
              </button>
            </div>
          </div>
          
          <style jsx>{`
            .error-boundary {
              padding: 20px;
              text-align: center;
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .error-content {
              max-width: 500px;
              padding: 30px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background: #f9f9f9;
            }
            
            .error-actions {
              margin-top: 20px;
              display: flex;
              gap: 10px;
              justify-content: center;
            }
            
            .retry-button, .home-button {
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            }
            
            .retry-button {
              background: #007bff;
              color: white;
            }
            
            .home-button {
              background: #6c757d;
              color: white;
            }
            
            .retry-button:hover, .home-button:hover {
              opacity: 0.9;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React from "react";

interface LoadingIndicatorProps {
    isLoading: boolean;
    message?: string;
  }
  
  const LoadingIndicator = ({ isLoading, message = 'Processing...' }: LoadingIndicatorProps) => {
    if (!isLoading) return null;
  
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-md mb-5" role="alert">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-700">{message}</span>
      </div>
    );
  };
  
  export default LoadingIndicator;
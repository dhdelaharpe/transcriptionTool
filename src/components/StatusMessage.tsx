import React from "react";

interface StatusMessageProps {
    status: {
      type: 'error' | 'success' | '';
      message: string;
    };
  }
  
  const StatusMessage = ({ status }: StatusMessageProps) => {
    if (!status.message) return null;
  
    const statusStyles = {
      error: 'bg-red-50 text-red-700',
      success: 'bg-green-50 text-green-700',
      '': ''
    };
  
    return (
      <div 
        className={`p-3 rounded-md mb-5 ${statusStyles[status.type]}`}
        role="alert"
      >
        {status.message}
      </div>
    );
  };
  
  export default StatusMessage;
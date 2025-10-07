import React from 'react';
import { XCircle, AlertCircle, Eye } from 'lucide-react';

const SeverityBadge = ({ severity }) => {
  const config = {
    high: { color: 'text-red-600 bg-red-50', icon: XCircle, label: 'High' },
    medium: { color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle, label: 'Medium' },
    low: { color: 'text-blue-600 bg-blue-50', icon: Eye, label: 'Low' }
  };
  
  const { color, icon: Icon, label } = config[severity] || config.low;
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-lg ${color} text-xs font-semibold`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </div>
  );
};

export default SeverityBadge;
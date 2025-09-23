import React from 'react';
import { RequestStatus } from '../types/types';
import { STATUS_COLORS } from '../utils/constants';

interface StatusBadgeProps {
  status: RequestStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClasses = STATUS_COLORS[status] || 'bg-gray-200 text-gray-800';
  const formattedStatus = status.replace(/_/g, ' ').toLowerCase();

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colorClasses}`}
    >
      {formattedStatus}
    </span>
  );
};

export default StatusBadge;
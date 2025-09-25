import React from 'react';
import { RequestStatus } from '../types/types';
import { STATUS_COLORS } from '../utils/constants';

interface StatusBadgeProps {
  status: RequestStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClasses = STATUS_COLORS[status] || 'bg-gray-200 text-gray-800';
  
  // Better formatting for the new status types
  const getFormattedStatus = (status: RequestStatus): string => {
    switch (status) {
      case 'PENDING_VALIDATION':
        return 'Pending Manager';
      case 'PENDING_FINANCE':
        return 'Pending Finance';
      case 'PENDING_CEO':
        return 'Pending CEO';
      case 'PENDING_APPROVAL':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'PROCESSING_PAYMENT':
        return 'Processing Payment';
      case 'PAID':
        return 'Paid';
      case 'PENDING_LIQUIDATION':
        return 'Pending Liquidation';
      default:
        return status.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colorClasses}`}
    >
      {getFormattedStatus(status)}
    </span>
  );
};

export default StatusBadge;
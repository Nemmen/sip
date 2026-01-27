interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const statusConfig: Record<string, { bg: string; text: string; dot?: boolean }> = {
    // Application statuses
    SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-700', dot: true },
    UNDER_REVIEW: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: true },
    SHORTLISTED: { bg: 'bg-purple-100', text: 'text-purple-700', dot: true },
    INTERVIEW_SCHEDULED: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: true },
    ACCEPTED: { bg: 'bg-green-100', text: 'text-green-700', dot: true },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', dot: true },
    WITHDRAWN: { bg: 'bg-gray-100', text: 'text-gray-700', dot: true },
    
    // Internship statuses
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
    PUBLISHED: { bg: 'bg-green-100', text: 'text-green-700' },
    CLOSED: { bg: 'bg-red-100', text: 'text-red-700' },
    
    // KYC statuses
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
    VERIFIED: { bg: 'bg-green-100', text: 'text-green-700' },
    
    // User statuses
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
    INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700' },
    
    // Default
    default: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${config.bg} ${config.text} font-medium rounded-full`}>
      {config.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')}`}></span>
      )}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

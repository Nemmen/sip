interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const statusConfig: Record<string, { bg: string; text: string; border: string; dot?: boolean }> = {
    // Application statuses
    SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: true },
    UNDER_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: true },
    SHORTLISTED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: true },
    INTERVIEW_SCHEDULED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: true },
    ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: true },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: true },
    WITHDRAWN: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: true },
    
    // Internship statuses
    DRAFT: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    PUBLISHED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    CLOSED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    
    // KYC statuses
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    VERIFIED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    
    // User statuses
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    INACTIVE: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    
    // Default
    default: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${config.bg} ${config.text} ${config.border} border font-semibold uppercase tracking-wide`}>
      {config.dot && (
        <span className={`w-1.5 h-1.5 ${config.text.replace('text-', 'bg-')}`}></span>
      )}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

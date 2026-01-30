interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-20 h-20 bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-6">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-bold text-[var(--primary)] mb-2">{title}</h3>
      
      {description && (
        <p className="text-[var(--text-secondary)] max-w-sm mb-8">{description}</p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-light)] transition-colors uppercase tracking-wide text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

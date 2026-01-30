interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="bg-white border-b-2 border-[var(--border)]">
      <div className="px-6 py-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-[var(--accent)] transition font-medium">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-semibold text-[var(--primary)]">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[var(--primary)]">{title}</h1>
            {description && (
              <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
            )}
          </div>
          
          {actions && (
            <div className="ml-4 flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

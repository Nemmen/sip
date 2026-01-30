interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  actor?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
        return 'bg-[var(--primary)]';
      default:
        return 'bg-[var(--text-muted)]';
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-[var(--border)]"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-4">
                <div>
                  <span className={`h-8 w-8 flex items-center justify-center ${getStatusColor(event.status)}`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">{event.title}</p>
                    {event.description && (
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{event.description}</p>
                    )}
                    {event.actor && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">by {event.actor}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-[var(--text-muted)] font-medium">
                    <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleDateString()}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

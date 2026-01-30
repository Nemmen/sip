interface UserAvatarProps {
  name?: string;
  email?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showEmail?: boolean;
}

export function UserAvatar({ name, email, src, size = 'md', showName, showEmail }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  const getInitials = () => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const colors = [
    'bg-[var(--primary)]',
    'bg-[var(--accent)]',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-rose-600',
  ];

  const getColorClass = () => {
    const str = name || email || '';
    const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} flex items-center justify-center text-white font-bold ${getColorClass()}`}>
        {src ? (
          <img src={src} alt={name || email} className="w-full h-full object-cover" />
        ) : (
          getInitials()
        )}
      </div>
      
      {(showName || showEmail) && (
        <div className="flex-1 min-w-0">
          {showName && name && (
            <p className="text-sm font-semibold text-[var(--primary)] truncate">{name}</p>
          )}
          {showEmail && email && (
            <p className="text-xs text-[var(--text-secondary)] truncate">{email}</p>
          )}
        </div>
      )}
    </div>
  );
}

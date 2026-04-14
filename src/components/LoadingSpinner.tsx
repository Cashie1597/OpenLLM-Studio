interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'coral' | 'dark' | 'gray';
}

export function LoadingSpinner({ size = 'md', color = 'coral' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    coral: 'border-[#d4d0c6] border-t-[#DE7356]',
    dark: 'border-[#d4d0c6] border-t-[#1a1a1a]',
    gray: 'border-[#d4d0c6] border-t-[#6a6a6a]',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full animate-spin`}
      />
    </div>
  );
}
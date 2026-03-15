import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DataListProps {
  children: ReactNode;
  className?: string;
}

export function DataList({ children, className }: DataListProps) {
  return (
    <ul className={cn(
      "list bg-base-100 rounded-box shadow-sm mb-4 border border-base-300",
      className
    )}>
      {children}
    </ul>
  );
}

interface DataListItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataListItem({ children, className, onClick }: DataListItemProps) {
  return (
    <li
      className={cn(
        "list-row items-center hover:bg-base-200/50 transition-colors group first:rounded-t-box last:rounded-b-box",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </li>
  );
}

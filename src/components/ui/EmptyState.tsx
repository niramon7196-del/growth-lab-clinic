import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <PackageOpen className="w-12 h-12 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-text-dark mb-2">{title}</h3>
      <p className="text-text-dark/60 max-w-sm mb-8">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

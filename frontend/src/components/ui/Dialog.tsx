import React from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl">
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    {children}
  </div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold text-gray-900">{children}</h2>
);

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

export const DialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
    {children}
  </div>
);
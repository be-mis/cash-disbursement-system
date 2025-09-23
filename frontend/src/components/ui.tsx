import React, { useState, useEffect } from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizeClasses = {
        sm: 'h-9 rounded-md px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
    };
    
    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

type CardProps = React.HTMLAttributes<HTMLDivElement>;
export const Card: React.FC<CardProps> = ({ className, ...props }) => (
    <div className={`rounded-lg border bg-white text-card-foreground shadow-sm transition-all duration-200 ${className}`} {...props} />
);

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export const CardHeader: React.FC<CardHeaderProps> = ({ className, ...props }) => (
    <div className={`flex flex-col space-y-1.5 p-6 border-b ${className}`} {...props} />
);

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export const CardTitle: React.FC<CardTitleProps> = ({ className, ...props }) => (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export const CardDescription: React.FC<CardDescriptionProps> = ({ className, ...props }) => (
    <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export const CardContent: React.FC<CardContentProps> = ({ className, ...props }) => (
    <div className={`p-6 pt-0 ${className}`} {...props} />
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean };
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    const errorClasses = 'border-red-500 ring-red-500 focus-visible:ring-red-500';
    return (
      <input
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${error ? errorClasses : ''} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean };
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    const errorClasses = 'border-red-500 ring-red-500 focus:ring-red-500';
    return (
      <select
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${error ? errorClasses : ''} ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        const errorClasses = 'border-red-500 ring-red-500 focus-visible:ring-red-500';
        return (
            <textarea
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${error ? errorClasses : ''} ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
    <label className={`text-sm font-medium leading-none text-secondary-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
);


interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children, className }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setVisible(true), 10); // Small delay to allow initial render
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl m-4 w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`p-6 border-b ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
);

export const DialogContent: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`p-6 overflow-y-auto ${className}`}>{children}</div>
);

export const DialogFooter: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`p-6 border-t flex justify-end gap-2 ${className}`}>{children}</div>
);


export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
    <div className="relative w-full overflow-auto">
        <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
);
export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
    <thead className={`[&_tr]:border-b ${className}`} {...props} />
);
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
);
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
    <tr className={`border-b transition-colors hover:bg-blue-50 data-[state=selected]:bg-muted ${className}`} {...props} />
);
export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
    <th className={`h-12 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);
export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
    <td className={`p-3 align-middle [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);
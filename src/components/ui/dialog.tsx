import * as React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-xl text-gray-400 hover:text-gray-700 cursor-pointer"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

Dialog.Content = function DialogContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
};

Dialog.Title = function DialogTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h3 className="text-lg font-semibold mb-2">{children}</h3>;
};

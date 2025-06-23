import * as React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
        <span
          className="absolute top-4 right-4 text-xl text-gray-400 hover:text-gray-700 cursor-pointer select-none"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpenChange(false);
          }}
        >
          ×
        </span>
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

import { AlertTriangle, X, CheckCircle2, Copy } from "lucide-react";
import { CoffeeEntry } from "@shared/schema";

interface DuplicateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duplicateEntry: CoffeeEntry | null;
  newRoasterName: string;
}

export default function DuplicateConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  duplicateEntry,
  newRoasterName,
}: DuplicateConfirmationModalProps) {
  if (!isOpen || !duplicateEntry) return null;

  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#2C1810]/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md animate-slide-up"
      >
        {/* Decorative coffee stain */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#6F4E37]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />

        {/* Card */}
        <div className="relative bg-gradient-to-br from-[#F5EFE7] to-[#E8DCC8] rounded-2xl shadow-2xl overflow-hidden border-3 border-[#D4C5B0]">
          {/* Warning stripe */}
          <div className="h-2 bg-gradient-to-r from-[#D4A574] via-[#B8860B] to-[#D4A574]" />

          {/* Header */}
          <div className="relative p-6 border-b-2 border-[#D4C5B0]/40">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#6F4E37]/10 hover:bg-[#6F4E37]/20 transition-colors group"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-[#6F4E37] group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="flex items-start gap-4">
              {/* Warning icon with pulse */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-[#D4A574]/30 rounded-full animate-ping" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A574] to-[#B8860B] flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-serif font-bold text-[#2C1810] mb-1">
                  Possible Duplicate
                </h2>
                <p className="text-sm text-[#6F4E37] font-medium">
                  We found a similar coffee entry
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Existing entry card */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Copy className="w-4 h-4 text-[#8B6F47]" />
                <p className="text-sm font-semibold text-[#6F4E37] uppercase tracking-wide">
                  Existing Entry
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border-2 border-[#D4C5B0]/50 shadow-md">
                <div className="flex items-start gap-3">
                  {duplicateEntry.frontPhotoUrl && (
                    <img
                      src={duplicateEntry.frontPhotoUrl}
                      alt="Existing coffee"
                      className="w-16 h-16 rounded-lg object-cover border-2 border-[#D4C5B0] shadow-sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-[#2C1810] text-lg mb-1 line-clamp-2">
                      {duplicateEntry.roasterName}
                    </h3>
                    <div className="space-y-1">
                      {duplicateEntry.origin && (
                        <p className="text-xs text-[#6F4E37]">
                          <span className="font-medium">Origin:</span> {duplicateEntry.origin}
                        </p>
                      )}
                      <p className="text-xs text-[#8B6F47]">
                        <span className="font-medium">Added:</span> {formatDate(duplicateEntry.createdAt)}
                      </p>
                      {duplicateEntry.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-[#8B6F47] font-medium">Rating:</span>
                          <div className="flex">
                            {Array.from({ length: duplicateEntry.rating }).map((_, i) => (
                              <span key={i} className="text-[#D4AF37] text-sm">★</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-[#D4C5B0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-gradient-to-r from-[#F5EFE7] to-[#E8DCC8] text-xs font-semibold text-[#8B6F47] uppercase tracking-wider">
                  New Entry
                </span>
              </div>
            </div>

            {/* New entry info */}
            <div className="bg-[#6F4E37]/5 rounded-xl p-4 border-2 border-dashed border-[#6F4E37]/20">
              <p className="text-sm text-[#6F4E37] mb-2">
                <span className="font-semibold">Roaster:</span> {newRoasterName}
              </p>
              <p className="text-xs text-[#8B6F47] italic">
                If this is a different coffee from the same roaster, click "Save Anyway" to continue.
              </p>
            </div>

            {/* Warning message */}
            <div className="flex items-start gap-2 p-3 bg-[#D4A574]/10 rounded-lg border border-[#D4A574]/30">
              <AlertTriangle className="w-4 h-4 text-[#B8860B] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#6F4E37] leading-relaxed">
                Duplicate entries can clutter your collection. Consider updating the existing entry instead.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="py-3 px-4 bg-white/80 text-[#6F4E37] font-semibold rounded-xl border-2 border-[#D4C5B0] hover:bg-white hover:border-[#8B6F47] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="py-3 px-4 bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md border-2 border-[#5D4029]/20"
              >
                Save Anyway
              </button>
            </div>
          </div>

          {/* Decorative bottom border */}
          <div className="h-1 bg-gradient-to-r from-transparent via-[#D4A574]/40 to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

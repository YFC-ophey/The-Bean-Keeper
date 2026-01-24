import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle2, AlertCircle, ExternalLink, Key } from 'lucide-react';

interface NotionAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onOwnerLogin?: (password: string) => Promise<boolean>;
  mode: 'instructions' | 'error';
}

export function NotionAuthModal({ isOpen, onClose, onContinue, onOwnerLogin, mode }: NotionAuthModalProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerLoginError, setOwnerLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleOwnerLogin = async () => {
    if (!onOwnerLogin || !ownerPassword.trim()) return;

    setIsLoggingIn(true);
    setOwnerLoginError(false);

    try {
      const success = await onOwnerLogin(ownerPassword);
      if (success) {
        onClose();
        setOwnerPassword('');
        setShowOwnerLogin(false);
      } else {
        setOwnerLoginError(true);
      }
    } catch (error) {
      setOwnerLoginError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#F5EFE7] to-[#E8DCC8] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] px-6 py-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {mode === 'instructions' ? (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                  <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/>
                  <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083z" fill="#000"/>
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            )}
            <h2 className="text-xl font-clash-medium text-white">
              {mode === 'instructions' ? t('auth:notion.title') : t('auth:notion.errorTitle')}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {mode === 'instructions' ? (
            <>
              <p className="text-[#5D4E37] text-sm leading-relaxed">
                {t('auth:notion.description')}
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-[#6F4E37] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                    1
                  </div>
                  <p className="text-[#5D4E37] text-sm">
                    {t('auth:notion.step1')}
                  </p>
                </div>

                <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-[#6F4E37] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <div className="text-[#5D4E37] text-sm">
                    <p className="font-medium text-[#6F4E37]">{t('auth:notion.step2Title')}</p>
                    <p>{t('auth:notion.step2')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-[#6F4E37] text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                    3
                  </div>
                  <p className="text-[#5D4E37] text-sm">
                    {t('auth:notion.step3')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-100/70 rounded-lg p-3 border border-amber-200">
                <CheckCircle2 className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 text-xs">
                  {t('auth:notion.tip')}
                </p>
              </div>

              {/* Reminder about re-login on different devices */}
              <div className="flex items-center gap-2 bg-blue-50/70 rounded-lg p-3 border border-blue-200">
                <svg className="h-5 w-5 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p className="text-blue-800 text-xs">
                  {t('auth:notion.reminder')}
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#5D4E37] text-sm leading-relaxed">
                {t('auth:notion.errorDescription')}
              </p>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">{t('auth:notion.whatHappened')}</h4>
                <p className="text-red-700 text-sm">
                  {t('auth:notion.errorExplanation')}
                </p>
              </div>

              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-medium text-[#6F4E37] mb-2">{t('auth:notion.howToFix')}</h4>
                <ul className="text-[#5D4E37] text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#6F4E37]">1.</span>
                    {t('auth:notion.fix1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6F4E37]">2.</span>
                    {t('auth:notion.fix2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6F4E37]">3.</span>
                    {t('auth:notion.fix3')}
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/30 border-t border-[#D4C5B0]">
          {showOwnerLogin ? (
            /* Owner Login Form */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-[#6F4E37]" />
                <span className="text-sm font-medium text-[#6F4E37]">{t('auth:login.ownerLogin')}</span>
              </div>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => {
                  setOwnerPassword(e.target.value);
                  setOwnerLoginError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleOwnerLogin()}
                placeholder={t('auth:login.ownerPassword')}
                className={`w-full px-4 py-2.5 rounded-full border-2 ${
                  ownerLoginError ? 'border-red-400 bg-red-50' : 'border-[#D4C5B0] bg-white'
                } text-sm focus:outline-none focus:border-[#6F4E37] transition-colors`}
                autoFocus
              />
              {ownerLoginError && (
                <p className="text-red-600 text-xs">{t('auth:login.error')}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowOwnerLogin(false);
                    setOwnerPassword('');
                    setOwnerLoginError(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-full border-2 border-[#6F4E37] text-[#6F4E37] font-clash-medium hover:bg-[#6F4E37]/10 transition-colors text-sm"
                >
                  {t('common:buttons.back')}
                </button>
                <button
                  onClick={handleOwnerLogin}
                  disabled={isLoggingIn || !ownerPassword.trim()}
                  className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white font-clash-medium hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                >
                  {isLoggingIn ? '...' : t('auth:login.ownerLoginButton')}
                </button>
              </div>
            </div>
          ) : (
            /* Normal Login Options */
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-full border-2 border-[#6F4E37] text-[#6F4E37] font-clash-medium hover:bg-[#6F4E37]/10 transition-colors"
                >
                  {t('common:buttons.cancel')}
                </button>
                <button
                  onClick={onContinue}
                  className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white font-clash-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  {mode === 'instructions' ? (
                    <>
                      {t('auth:notion.continue')}
                      <ExternalLink className="h-4 w-4" />
                    </>
                  ) : (
                    t('auth:notion.tryAgain')
                  )}
                </button>
              </div>
              {/* Owner Login Link - Only show in instructions mode */}
              {mode === 'instructions' && onOwnerLogin && (
                <button
                  onClick={() => setShowOwnerLogin(true)}
                  className="w-full text-center text-xs text-[#6F4E37]/60 hover:text-[#6F4E37] transition-colors flex items-center justify-center gap-1"
                >
                  <Key className="h-3 w-3" />
                  {t('auth:login.ownerLogin')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

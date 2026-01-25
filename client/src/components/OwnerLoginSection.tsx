import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key } from 'lucide-react';

interface OwnerLoginSectionProps {
  ownerLogin: (password: string) => Promise<boolean>;
}

export function OwnerLoginSection({ ownerLogin }: OwnerLoginSectionProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) return;

    setIsLoading(true);
    setError(false);

    try {
      const success = await ownerLogin(password);
      if (success) {
        setPassword('');
        setShowForm(false);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-8 sm:py-12 flex flex-col items-center justify-center">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs text-[#6F4E37]/40 hover:text-[#6F4E37]/70 transition-colors"
        >
          <Key className="h-3 w-3" />
          <span>{t('auth:login.ownerLogin')}</span>
        </button>
      ) : (
        <div className="w-full max-w-xs px-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-[#D4C5B0] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Key className="h-4 w-4 text-[#6F4E37]" />
              <span className="text-sm font-medium text-[#6F4E37]">
                {t('auth:login.ownerLogin')}
              </span>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('auth:login.ownerPassword')}
              className={`w-full px-4 py-2.5 rounded-full border-2 ${
                error ? 'border-red-400 bg-red-50' : 'border-[#D4C5B0] bg-white'
              } text-sm focus:outline-none focus:border-[#6F4E37] transition-colors`}
              autoFocus
            />

            {error && (
              <p className="text-red-600 text-xs mt-2">{t('auth:login.error')}</p>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setPassword('');
                  setError(false);
                }}
                className="flex-1 px-3 py-2 rounded-full border-2 border-[#6F4E37] text-[#6F4E37] text-sm hover:bg-[#6F4E37]/10 transition-colors"
              >
                {t('common:buttons.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !password.trim()}
                className="flex-1 px-3 py-2 rounded-full bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? '...' : t('auth:login.ownerLoginButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

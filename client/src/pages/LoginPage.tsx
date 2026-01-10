import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Coffee, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const [, setLocation] = useLocation();
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setLocation('/'); // Redirect to dashboard
        }
      })
      .catch(() => {/* Not logged in, show login page */});

    // Check URL params for OAuth callback status
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get('login');

    if (loginParam === 'success') {
      setLoginStatus('success');
      // Redirect to dashboard after short delay
      setTimeout(() => setLocation('/'), 1000);
    } else if (loginParam === 'error') {
      setLoginStatus('error');
    }
  }, [setLocation]);

  const handleLogin = () => {
    // Redirect to Notion OAuth
    window.location.href = '/api/auth/notion';
  };

  // Show success state
  if (loginStatus === 'success') {
    return (
      <div className="min-h-screen bg-background coffee-texture flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#6F4E37]/20 border-t-[#6F4E37] rounded-full mx-auto mb-4" />
          <p className="text-lg font-serif text-[#6F4E37]">
            {t('auth:login.success')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background coffee-texture flex items-center justify-center p-4 relative overflow-hidden">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>

      {/* Decorative Background Blurs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C4A57B]/10 rounded-full blur-3xl -z-10 animate-pulse"
        style={{ animationDuration: '4s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#6F4E37]/10 rounded-full blur-3xl -z-10 animate-pulse"
        style={{ animationDuration: '5s', animationDelay: '1s' }}
      />

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="relative bg-gradient-to-br from-[#F5EFE7] via-[#F0E6D2] to-[#E8DCC8] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#D4C5B0] p-8 md:p-10">

          {/* Decorative top border */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#6F4E37] via-[#8B6F47] to-[#6F4E37]" />

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src="/logo.jpeg"
                alt="The Bean Keeper"
                className="h-24 w-24 md:h-32 md:w-32 object-cover rounded-full shadow-xl ring-4 ring-white ring-offset-2 ring-offset-background"
              />
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-[#6F4E37]/10 rounded-full blur-2xl -z-10" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2C1810] mb-2 tracking-tight">
              {t('auth:welcome.title')}
            </h1>
            <p className="text-[#6F4E37] font-serif italic text-base md:text-lg">
              {t('auth:welcome.subtitle')}
            </p>
          </div>

          {/* Error Message */}
          {loginStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-serif text-center">
                {t('auth:login.error')}
              </p>
            </div>
          )}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            className="w-full py-6 bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white font-bold text-lg rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg border-2 border-[#5D4029]/20 flex items-center justify-center gap-3"
          >
            {/* Notion Logo */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
            </svg>
            {t('auth:login.connectNotion')}
          </Button>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#6F4E37]/70 font-serif leading-relaxed">
              {t('auth:login.description')}
            </p>
          </div>

          {/* Features List */}
          <div className="mt-8 space-y-3">
            {[
              { icon: Coffee, text: t('auth:features.privateDatabase') },
              { icon: Sparkles, text: t('auth:features.autoSetup') },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-[#6F4E37]">
                <feature.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-serif">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Decorative bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#6F4E37]/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}

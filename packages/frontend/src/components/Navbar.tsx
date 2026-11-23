import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Vote,
  UserCheck,
  Lock,
  BookOpen,
  Menu,
  X,
  Landmark,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { getStoredUser, clearStoredAuth } from '../services/api';
import { CitizenSignInModal } from './CitizenSignInModal';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<any>(getStoredUser());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync user state on storage change
  useEffect(() => {
    setUser(getStoredUser());
  }, [location.pathname]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('elanka_lang', lang);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    navigate('/');
  };

  const isAdmin = user && ['PANEL_MODERATOR', 'POLICY_ADMIN', 'SYSTEM_AUDITOR'].includes(user.role);

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Landmark },
    { to: '/petitions', label: t('nav.petitions'), icon: Vote },
    { to: '/profile', label: t('nav.dashboard'), icon: UserCheck },
    { to: '/academy', label: t('nav.lms'), icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top statutory compliance bar */}
      <div className="bg-lanka-maroon text-white text-[11px] font-medium py-1 px-4 flex justify-between items-center tracking-wider">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-lanka-gold" />
          <span>{t('app.pdpaBadge')}</span>
          <span className="hidden sm:inline text-white/50">•</span>
          <span className="hidden sm:inline">{t('app.encryptionBadge')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-300 hidden sm:inline">{t('nav.online')}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-300 font-bold">{t('nav.offline')}</span>
              </>
            )}
          </span>
          <span className="text-white/40">|</span>
          <span className="text-lanka-gold text-[10px] font-mono uppercase bg-black/30 px-1.5 py-0.5 rounded">
            {t('app.lowBandwidth')}
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4 flex-nowrap">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-lanka-maroon via-lanka-emerald to-slate-900 border border-lanka-gold/40 flex items-center justify-center shadow-inner shrink-0">
              <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-lanka-gold group-hover:scale-110 transition-transform" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">E-LANKA</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-lanka-gold text-slate-950 whitespace-nowrap">
                  DEMOCRACY
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-sinhala leading-none mt-0.5 whitespace-nowrap">
                ඩිජිටල් ප්‍රජාතන්ත්‍රවාදය • டிஜிட்டல் ஜனநாயகம்
              </p>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 whitespace-nowrap shrink-0">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-lanka-gold border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls: Language Switcher & Authentication */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 shrink-0 whitespace-nowrap">
            {/* Trilingual Pill Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  i18n.language === 'en'
                    ? 'bg-lanka-gold text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('si')}
                className={`px-2.5 py-1 rounded font-medium font-sinhala transition-all ${
                  i18n.language === 'si'
                    ? 'bg-lanka-gold text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="සිංහල භාෂාවට මාරු වන්න"
              >
                සිංහල
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('ta')}
                className={`px-2.5 py-1 rounded font-medium font-tamil transition-all ${
                  i18n.language === 'ta'
                    ? 'bg-lanka-gold text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="தமிழுக்கு மாறவும்"
              >
                தமிழ்
              </button>
            </div>

            {/* Authentication Control: Secure Sign-In or Active Session */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-800 bg-red-950/80 text-red-300 hover:bg-red-900 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{user.role}</span>
                  </Link>
                ) : (
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="max-w-[130px] truncate">{user.anonymizedAlias || 'Citizen'}</span>
                    {(user.isVerifiedCitizen || user.otpVerified) && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        ✓ Verified
                      </span>
                    )}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title={t('nav.logout') || 'Log Out'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-lanka-gold hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.login') || 'Citizen Sign In'}</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-slate-800 text-lanka-gold' : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-lanka-gold text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('si')}
                className={`px-2 py-1 rounded font-sinhala ${i18n.language === 'si' ? 'bg-lanka-gold text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                සිං
              </button>
              <button
                onClick={() => changeLanguage('ta')}
                className={`px-2 py-1 rounded font-tamil ${i18n.language === 'ta' ? 'bg-lanka-gold text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                த
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">{user.anonymizedAlias || user.role}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-xs text-red-400 hover:underline"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowSignInModal(true);
                }}
                className="text-xs font-semibold text-lanka-gold hover:underline"
              >
                Citizen Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Citizen Sign In Modal */}
      <CitizenSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Vote, UserCheck, Lock, BookOpen, Wifi, WifiOff, Menu, X, Landmark } from 'lucide-react';
import { getStoredUser, setStoredUser, clearStoredAuth, api } from '../services/api';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<any>(getStoredUser());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

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

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('elanka_lang', lang);
  };

  const handleRoleSwitch = async (role: string) => {
    try {
      const res = await api.login({
        role,
        nicNumber: role === 'CITIZEN' ? '199256789012' : undefined,
        district: 'Colombo',
        totpToken: role !== 'CITIZEN' ? '123456' : undefined
      });
      localStorage.setItem('elanka_auth_token', res.token);
      setStoredUser(res.user);
      setUser(res.user);
      setShowRoleModal(false);
      window.location.reload();
    } catch (e) {
      console.error('Role switch failed', e);
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Landmark },
    { to: '/petitions', label: t('nav.petitions'), icon: Vote },
    { to: '/dashboard', label: t('nav.dashboard'), icon: UserCheck },
    { to: '/admin', label: t('nav.admin'), icon: Lock, badge: '2FA' },
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lanka-maroon via-lanka-emerald to-slate-900 border border-lanka-gold/40 flex items-center justify-center shadow-inner">
              <Landmark className="w-5 h-5 text-lanka-gold group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">E-LANKA</span>
                <span className="text-[10px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-lanka-gold text-slate-950">
                  DEMOCRACY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sinhala leading-none mt-0.5">
                ඩිජිටල් ප්‍රජාතන්ත්‍රවාදය • டிஜிட்டல் ஜனநாயகம்
              </p>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-lanka-gold border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] bg-red-900/60 text-red-300 border border-red-700/50 px-1 rounded font-mono">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Controls: Language Switcher & Role Selector */}
          <div className="hidden sm:flex items-center gap-3">
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

            {/* Role Switcher Pill */}
            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-lanka-gold"></span>
              <span>{user?.role || 'CITIZEN'}</span>
            </button>
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
                {link.badge && (
                  <span className="text-[9px] bg-red-900/60 text-red-300 px-1 rounded font-mono">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
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
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setShowRoleModal(true);
              }}
              className="text-xs text-lanka-gold underline"
            >
              Role: {user?.role || 'CITIZEN'}
            </button>
          </div>
        </div>
      )}

      {/* Role Switcher Dialog */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-lanka-gold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Switch RBAC Identity Role
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Select an identity role to test different workflows across the 5-stage policy consultation lifecycle.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleRoleSwitch('CITIZEN')}
                className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white">CITIZEN</div>
                  <div className="text-xs text-slate-400">Cast survey responses, sign e-petitions, exercise PDPA rights</div>
                </div>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => handleRoleSwitch('PANEL_MODERATOR')}
                className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <span>PANEL_MODERATOR</span>
                    <span className="text-[10px] bg-red-900 text-red-200 px-1 rounded">2FA</span>
                  </div>
                  <div className="text-xs text-slate-400">Review Stage 1 proposals, approve PENDING ➔ APPROVED_PANEL</div>
                </div>
                <Lock className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => handleRoleSwitch('POLICY_ADMIN')}
                className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <span>POLICY_ADMIN</span>
                    <span className="text-[10px] bg-red-900 text-red-200 px-1 rounded">2FA</span>
                  </div>
                  <div className="text-xs text-slate-400">Formulate questionnaires, publish active consultations, trigger AI sync</div>
                </div>
                <Lock className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => handleRoleSwitch('SYSTEM_AUDITOR')}
                className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                    <span>SYSTEM_AUDITOR</span>
                    <span className="text-[10px] bg-red-900 text-red-200 px-1 rounded">2FA</span>
                  </div>
                  <div className="text-xs text-slate-400">Inspect immutable PDPA statutory audit ledger & verify HMAC chains</div>
                </div>
                <Shield className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


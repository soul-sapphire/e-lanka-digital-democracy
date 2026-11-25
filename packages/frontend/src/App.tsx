import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PublicPolicyHub } from './views/PublicPolicyHub';
import { PolicyDetailView } from './views/PolicyDetailView';
import { DynamicSurveyRunner } from './views/DynamicSurveyRunner';
import { EPetitionsView } from './views/EPetitionsView';
import { CitizenDashboard } from './views/CitizenDashboard';
import { AdminModerationPanel } from './views/AdminModerationPanel';
import { AdminLoginView } from './views/AdminLoginView';
import { LMSAcademyView } from './views/LMSAcademyView';
import { PrivacyPolicyView } from './views/PrivacyPolicyView';
import { CodeOfConductView } from './views/CodeOfConductView';
import { SecurityIncidentView } from './views/SecurityIncidentView';
import { AboutContactView } from './views/AboutContactView';
import { FieldCollectorView } from './views/FieldCollectorView';
import { OfflineQueueManager } from './services/offline-queue';
import { Wifi, WifiOff, CheckCircle2 } from 'lucide-react';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const tryScroll = () => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      if (!tryScroll()) {
        const interval = setInterval(() => {
          if (tryScroll()) {
            clearInterval(interval);
          }
        }, 100);
        const timer = setTimeout(() => clearInterval(interval), 2000);
        return () => {
          clearInterval(interval);
          clearTimeout(timer);
        };
      }
      return;
    }

    // Always reset viewport to the very top on route changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0 });
    document.body.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
};

export const App: React.FC = () => {
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      const result = await OfflineQueueManager.drainQueue();
      if (result.synced > 0) {
        setOfflineNotice(`Reconnected! Automatically synchronized ${result.synced} offline questionnaire submissions.`);
        setTimeout(() => setOfflineNotice(null), 5000);
      }
    };

    const handleOffline = () => {
      setOfflineNotice('Ultra-low bandwidth offline mode active. Submissions will be cached locally.');
      setTimeout(() => setOfflineNotice(null), 6000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for any lingering offline queue items
    if (navigator.onLine) {
      OfflineQueueManager.drainQueue().then((res) => {
        if (res.synced > 0) {
          setOfflineNotice(`Synchronized ${res.synced} cached survey submissions.`);
          setTimeout(() => setOfflineNotice(null), 4000);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-slate-950 font-sans selection:bg-lanka-gold/30 selection:text-slate-950">
        <Navbar />

        {/* Dynamic Offline / Sync Alert Banner */}
        {offlineNotice && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4" />
            <span>{offlineNotice}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Routes>
            <Route path="/" element={<PublicPolicyHub />} />
            <Route path="/policies/:id" element={<PolicyDetailView />} />
            <Route path="/policies/:id/survey" element={<DynamicSurveyRunner />} />
            <Route path="/petitions" element={<EPetitionsView />} />
            <Route path="/profile" element={<CitizenDashboard />} />
            <Route path="/dashboard" element={<CitizenDashboard />} />
            <Route path="/admin" element={<AdminModerationPanel />} />
            <Route path="/admin/login" element={<AdminLoginView />} />
            <Route path="/academy" element={<LMSAcademyView />} />
            <Route path="/collector" element={<FieldCollectorView />} />
            <Route path="/privacy" element={<PrivacyPolicyView />} />
            <Route path="/code-of-conduct" element={<CodeOfConductView />} />
            <Route path="/security" element={<SecurityIncidentView />} />
            <Route path="/about" element={<AboutContactView />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;


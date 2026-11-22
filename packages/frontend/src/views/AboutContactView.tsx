import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  MessageCircle,
  Heart,
  Send,
  CheckCircle2,
  Users,
  Globe2,
  ShieldCheck
} from 'lucide-react';

export const AboutContactView: React.FC = () => {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('GENERAL');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setSubmitted(true);
      setIsSending(false);
    }, 700);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto text-slate-300 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 text-white space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lanka-maroon/80 border border-lanka-gold/40 text-xs font-semibold text-lanka-gold">
          <Building2 className="w-3.5 h-3.5" />
          <span>Civil Society Organisation • Sri Lanka</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          About Centre for Society & Learning (CSLK) & Contact Us
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          The Centre for Society & Learning (CSLK) is a dedicated civil society institution committed to participatory democracy, rule of law, and digital constitutionalism across all communities and districts in Sri Lanka.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400 font-mono">
          <a
            href="https://www.cslk.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lanka-gold hover:text-amber-300 underline inline-flex items-center gap-1 font-semibold"
          >
            <span>Visit Official Site: www.cslk.org</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span>•</span>
          <span>Technical Partner: CIVICUS Digital Action Lab (DAL)</span>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Civic Empowerment
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Equipping youth, rural communities, and marginalized groups with digital tools to voice policy recommendations.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-lanka-gold font-bold text-xs uppercase tracking-wider">
            <Globe2 className="w-4 h-4" />
            Trilingual Democracy
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Ensuring every piece of civic legislation and consultation is equally accessible in Sinhala, Tamil, and English.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Digital Rights & PDPA
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Strict adherence to Sri Lanka's Personal Data Protection Act No. 9 of 2022 to safeguard citizen non-retaliation.
          </p>
        </div>
      </div>

      {/* Main Content & Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Directory */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-lanka-gold" />
            <span>Institutional Contact Directory</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headquarters Address</span>
              <p className="text-slate-200 leading-relaxed">
                Centre for Society & Learning (CSLK)<br />
                Colombo & Kandy Secretariat<br />
                Sri Lanka
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Channels</span>
              <div className="space-y-0.5 font-mono text-[11px]">
                <div>General Inquiries: <strong className="text-white">info@cslk.org</strong></div>
                <div>Media & Public Relations: <strong className="text-white">media@cslk.org</strong></div>
                <div>Data Protection Officer: <strong className="text-emerald-400">dpo@cslk.org</strong></div>
                <div>Security Vulnerabilities: <strong className="text-red-400">security@cslk.org</strong></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct WhatsApp Hotline</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Reach our citizen helpline directly on WhatsApp for guidance on policy submissions or technical assistance:
              </p>
              <a
                href="https://wa.me/94771234567?text=Hello%20CSLK%20Team%2C%20I%20have%20an%20inquiry%20regarding%20E-Lanka"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs mt-1 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Launch WhatsApp (+94 77 123 4567)</span>
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Inquiries Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Send an Inquiry to CSLK</span>
            </h2>
            <p className="text-xs text-slate-400">
              Our secretariat will respond to your inquiry within 2 business days.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <span>Message Received Successfully</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Thank you for reaching out to the Centre for Society & Learning. A representative will contact you via email shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium pt-1"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Citizen Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Inquiry Purpose *</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                >
                  <option value="GENERAL">General Platform Inquiry</option>
                  <option value="POLICY">Proposing a New Policy Initiative</option>
                  <option value="PETITION">E-Petition Guidance & Submission</option>
                  <option value="ACADEMY">Democracy Academy & Course Questions</option>
                  <option value="MEDIA">Press, Media & Civil Society Partnership</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can CSLK support your civic participation?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-lanka-gold"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-lanka-maroon hover:bg-red-900 border border-lanka-gold/40 text-lanka-gold font-bold text-xs uppercase tracking-wider transition shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Sending Message...' : 'Send Inquiry to CSLK'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

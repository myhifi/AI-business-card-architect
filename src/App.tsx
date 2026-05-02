/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Trash2, Library, Plus, Loader2, CreditCard, Sparkles, User, Building, Phone as PhoneIcon, Mail, Palette, Image as ImageIcon, Wand2, X, ShieldCheck, AlertTriangle, RotateCcw, FileText, Globe, Smartphone, QrCode, LayoutGrid, Download, HelpCircle, Settings } from 'lucide-react';
import { generateCardData, suggestSmartTheme, checkInputQuality } from './services/geminiService';
import { generateCardArt } from './services/imageService';
import { BusinessCard } from './types/card';
import { BusinessCardDisplay } from './components/BusinessCardDisplay';
import { getContrastColor } from './lib/colors';
import { AuthModal } from './components/AuthModal';
import { GuideModal } from './components/GuideModal';
import { AccountModal } from './components/AccountModal';
import { db } from './lib/storage';
import { User as UserType, Profile } from './types/auth';

const STORAGE_KEY = 'business-card-architect-gallery-v2';

export default function App() {
  const [nameInput, setNameInput] = useState('');
  const [professionInput, setProfessionInput] = useState('');
  const [phones, setPhones] = useState<string[]>(['']);
  const [includeEmail, setIncludeEmail] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [qrLinkInput, setQrLinkInput] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<"standard" | "centered" | "split">("standard");
  
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [suggestions, setSuggestions] = useState<{ name?: string, profession?: string }>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingTheme, setIsSuggestingTheme] = useState(false);
  const [isRegeneratingLogo, setIsRegeneratingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<BusinessCard | null>(null);
  const [gallery, setGallery] = useState<BusinessCard[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('bca_session_user');
    const savedProfile = localStorage.getItem('bca_session_profile');
    
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      
      const profiles = db.getProfiles().filter(p => p.userId === user.id);
      setAvailableProfiles(profiles);
      
      if (savedProfile) {
        setActiveProfile(JSON.parse(savedProfile));
      } else if (profiles.length > 0) {
        setActiveProfile(profiles[0]);
      }
    }
  }, []);

  // Load cards when profile changes
  useEffect(() => {
    const allCards = db.getCards();
    const profileId = activeProfile ? activeProfile.id : 'guest';
    setGallery(allCards.filter(c => c.profileId === profileId));

    // Load last state if exists
    if (activeProfile?.lastState) {
      setNameInput(activeProfile.lastState.name);
      setProfessionInput(activeProfile.lastState.profession);
      setPhones(activeProfile.lastState.phones);
      setEmailInput(activeProfile.lastState.email);
      setWebsiteInput(activeProfile.lastState.website);
      setQrLinkInput(activeProfile.lastState.qrLink);
      setSelectedLayout(activeProfile.lastState.layout);
    }
  }, [activeProfile, currentUser]);

  // Persist current state to active profile (debounced)
  useEffect(() => {
    if (!activeProfile) return;

    const timer = setTimeout(() => {
      const state = {
        name: nameInput,
        profession: professionInput,
        phones,
        email: emailInput,
        website: websiteInput,
        qrLink: qrLinkInput,
        layout: selectedLayout
      };

      const profiles = db.getProfiles();
      const updatedProfiles = profiles.map(p => {
        if (p.id === activeProfile.id) {
          return { ...p, lastState: state };
        }
        return p;
      });
      db.saveProfiles(updatedProfiles);
    }, 1000);

    return () => clearTimeout(timer);
  }, [nameInput, professionInput, phones, emailInput, websiteInput, qrLinkInput, selectedLayout]);

  // Sync session state to storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bca_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bca_session_user');
    }
    
    if (activeProfile) {
      localStorage.setItem('bca_session_profile', JSON.stringify(activeProfile));
    } else {
      localStorage.removeItem('bca_session_profile');
    }
  }, [currentUser, activeProfile]);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
    const profiles = db.getProfiles().filter(p => p.userId === user.id);
    
    if (profiles.length === 0) {
      // Create first profile automatically
      const firstProfile: Profile = {
        id: crypto.randomUUID(),
        userId: user.id,
        name: 'Default Profile',
        lastUsed: Date.now()
      };
      db.saveProfiles([...db.getProfiles(), firstProfile]);
      setAvailableProfiles([firstProfile]);
      setActiveProfile(firstProfile);
    } else {
      setAvailableProfiles(profiles);
      setActiveProfile(profiles[0]);
    }

    // Check for guest cards to migrate
    const guestCards = db.getCards().filter(c => c.profileId === 'guest');
    if (guestCards.length > 0) {
      setShowMigrateConfirm(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveProfile(null);
    setAvailableProfiles([]);
    localStorage.removeItem('bca_session_user');
    localStorage.removeItem('bca_session_profile');
  };

  const migrateGuestCards = () => {
    if (!activeProfile) return;
    db.syncGuestCards(activeProfile.id);
    setGallery(db.getCards().filter(c => c.profileId === activeProfile.id));
    setShowMigrateConfirm(false);
  };

  const createNewProfile = () => {
    if (!currentUser) return;
    const name = prompt('Enter profile name (e.g. Business, Personal)');
    if (name) {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        name,
        lastUsed: Date.now()
      };
      const updated = [...db.getProfiles(), newProfile];
      db.saveProfiles(updated);
      setAvailableProfiles(updated.filter(p => p.userId === currentUser.id));
      setActiveProfile(newProfile);
    }
  };

  const isQuotaError = (err: any) => {
    const msg = err?.message?.toLowerCase() || '';
    return msg.includes('429') || msg.includes('quota') || msg.includes('limit exceeded') || msg.includes('too many requests');
  };

  const clearVault = () => {
    const profileId = activeProfile ? activeProfile.id : 'guest';
    const allCards = db.getCards().filter(c => c.profileId !== profileId);
    db.saveCards(allCards);
    setGallery([]);
  };

  // Debounced Spell Check
  useEffect(() => {
    if (!spellCheckEnabled || !nameInput.trim() || !professionInput.trim()) {
      setSuggestions({});
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await checkInputQuality(nameInput, professionInput);
        if (!result.isPerfect) {
          setSuggestions({
            name: result.nameSuggestion,
            profession: result.professionSuggestion
          });
        } else {
          setSuggestions({});
        }
      } catch (err) {
        console.error("Spell check failed", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [nameInput, professionInput, spellCheckEnabled]);

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };
  const updatePhone = (index: number, val: string) => {
    const newPhones = [...phones];
    newPhones[index] = val;
    setPhones(newPhones);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !professionInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setCurrentCard(null);

    try {
      const metadata = await generateCardData(nameInput, professionInput);
      
      let logoUrl = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=256&h=256&auto=format&fit=crop';
      try {
        logoUrl = await generateCardArt(metadata.company || professionInput);
      } catch (err: any) {
        console.warn("Art synthesis failed, using fallback asset", err);
        if (isQuotaError(err)) {
          setError('AI Design Forge is currently cooling down due to high demand. We\'ve generated a professional layout for you with a temporary placeholder logo. You can try regenerating the logo in a minute!');
        }
      }

      const newCard: BusinessCard = {
        id: crypto.randomUUID(),
        profileId: activeProfile ? activeProfile.id : 'guest',
        name: nameInput,
        jobTitle: metadata.jobTitle || professionInput,
        company: metadata.company || 'Corporate Inc',
        phones: phones.filter(p => p.trim() !== '').length > 0 
          ? phones.filter(p => p.trim() !== '') 
          : ['(555) 000-0000'], // Fallback if user left it empty
        email: includeEmail && emailInput.trim() !== '' ? emailInput : undefined,
        website: websiteInput.trim() !== '' ? websiteInput : undefined,
        qrLink: qrLinkInput.trim() !== '' ? qrLinkInput : undefined,
        layout: selectedLayout,
        catchphrase: metadata.catchphrase || 'Excellence in every pixel.',
        logoUrl,
        theme: (metadata.theme as "light" | "dark") || 'light',
        accentColor: metadata.accentColor || '#2563eb',
      };

      setCurrentCard(newCard);
      setNameInput('');
      setProfessionInput('');
      setPhones(['']);
      setEmailInput('');
      setWebsiteInput('');
      setQrLinkInput('');
    } catch (err: any) {
      if (isQuotaError(err)) {
        setError('The AI synthesis engine is currently under high load. Please wait about 60 seconds before trying again. Your current inputs are preserved.');
      } else {
        setError(err.message || 'Something went wrong during design synthesis.');
      }
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToGallery = () => {
    if (currentCard) {
      const cardToSave = { ...currentCard, profileId: activeProfile ? activeProfile.id : 'guest' };
      const allCards = [cardToSave, ...db.getCards()];
      db.saveCards(allCards);
      setGallery(allCards.filter(c => c.profileId === (activeProfile ? activeProfile.id : 'guest')));
      setCurrentCard(null);
    }
  };

  const handleArchiveAllLayouts = () => {
    if (!currentCard) return;
    
    const layouts: ("standard" | "centered" | "split")[] = ["standard", "centered", "split"];
    const profileId = activeProfile ? activeProfile.id : 'guest';
    const newCards = layouts.map(layout => ({
      ...currentCard,
      id: crypto.randomUUID(),
      profileId,
      layout
    }));

    const allCards = [...newCards, ...db.getCards()];
    db.saveCards(allCards);
    setGallery(allCards.filter(c => c.profileId === profileId));
    setCurrentCard(null);
  };

  const handleSmartTheme = async () => {
    if (!currentCard || isSuggestingTheme) return;
    setIsSuggestingTheme(true);
    setError(null);
    try {
      const suggestion = await suggestSmartTheme(currentCard.jobTitle);
      setCurrentCard({
        ...currentCard,
        accentColor: suggestion.accentColor,
        theme: suggestion.theme,
        customTextColor: undefined // Reset to auto
      });
    } catch (err: any) {
      if (isQuotaError(err)) {
        setError('Smart Theme engine is cooling down. Please try again in a minute.');
      } else {
        console.error("Failed to suggest theme", err);
      }
    } finally {
      setIsSuggestingTheme(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentCard) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCard({ ...currentCard, backgroundUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    if (currentCard) {
      setCurrentCard({ ...currentCard, backgroundUrl: undefined });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentCard) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCard({ ...currentCard, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegenerateLogo = async () => {
    if (!currentCard || isRegeneratingLogo) return;
    setIsRegeneratingLogo(true);
    setError(null);
    try {
      const newLogoUrl = await generateCardArt(currentCard.company);
      setCurrentCard({ ...currentCard, logoUrl: newLogoUrl });
    } catch (err: any) {
      console.error("Failed to regenerate logo", err);
      if (isQuotaError(err)) {
        setError('AI Design Forge Logo module is currently cooling down. Try again in a minute.');
      } else {
        setError('Failed to synthesize logo. Please try again.');
      }
    } finally {
      setIsRegeneratingLogo(false);
    }
  };

  const deleteFromGallery = (id: string) => {
    const updatedCards = db.getCards().filter(c => c.id !== id);
    db.saveCards(updatedCards);
    setGallery(updatedCards.filter(c => c.profileId === (activeProfile ? activeProfile.id : 'guest')));
    if (currentCard?.id === id) {
      setCurrentCard(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-blue-100 italic selection:text-blue-900">
      <header className="relative py-16 px-6 overflow-hidden bg-white border-b border-zinc-200">
        <div className="absolute top-8 left-8 z-50">
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-100 transition-all text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900"
          >
            <HelpCircle size={14} className="text-blue-600" />
            Quick Guide
          </button>
        </div>
        <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-black text-zinc-900">{currentUser.username}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Cloud Sync Active</span>
              </div>
              <button 
                onClick={() => setIsAccountModalOpen(true)}
                className="p-3 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center"
                title="Account Settings"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={handleLogout}
                className="p-3 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2 text-xs font-bold px-4"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/10 flex items-center gap-2 text-xs font-bold"
            >
              <User size={16} />
              Login / Sign Up
            </button>
          )}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.05),transparent_70%)]" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-8"
          >
            <Sparkles size={12} />
            <span>Premium Design Engine v2.0</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-zinc-950">
            Business Card <span className="text-blue-600">Architect.</span>
          </h1>
          <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Personalize your identity with AI-driven color theory and minimalist design.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 flex flex-col xl:grid xl:grid-cols-12 gap-16 items-start">
        {/* Left Column: Form & Design Controls */}
        <div className="w-full xl:col-span-4 space-y-12 xl:sticky xl:top-12">
          <section className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
              <Plus className="text-blue-600" size={20} />
              Identity Setup
            </h2>
            
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="spellCheck" 
                    checked={spellCheckEnabled} 
                    onChange={(e) => setSpellCheckEnabled(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="spellCheck" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer flex items-center gap-1">
                    AI Spell Checker {spellCheckEnabled && <ShieldCheck size={10} className="text-emerald-500" />}
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Julian Vane"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-base font-medium"
                      required
                    />
                  </div>
                  {suggestions.name && spellCheckEnabled && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      type="button"
                      onClick={() => { setNameInput(suggestions.name!); setSuggestions(s => ({ ...s, name: undefined })); }}
                      className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-emerald-100 transition-colors ml-1"
                    >
                      <Wand2 size={10} /> Suggestion: {suggestions.name}
                    </motion.button>
                  )}
                  {nameInput.length > 25 && (
                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 px-1">
                      <AlertTriangle size={10} /> Name is quite long, may affect scaling.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Profession / Industry</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input
                      value={professionInput}
                      onChange={(e) => setProfessionInput(e.target.value)}
                      placeholder="Luxury Interior Design"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-base font-medium"
                      required
                    />
                  </div>
                  {suggestions.profession && spellCheckEnabled && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      type="button"
                      onClick={() => { setProfessionInput(suggestions.profession!); setSuggestions(s => ({ ...s, profession: undefined })); }}
                      className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-emerald-100 transition-colors ml-1"
                    >
                      <Wand2 size={10} /> Suggestion: {suggestions.profession}
                    </motion.button>
                  )}
                  {professionInput.length > 40 && (
                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 px-1">
                      <AlertTriangle size={10} /> Profession is long, title might be small.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Phone Numbers</label>
                    <button type="button" onClick={addPhone} className="text-[10px] font-black text-blue-600 hover:text-blue-700">+ ADD</button>
                  </div>
                  <div className="space-y-2">
                    {phones.map((phone, idx) => (
                      <div key={idx} className="relative">
                        <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                        <input
                          value={phone}
                          onChange={(e) => updatePhone(idx, e.target.value)}
                          placeholder="(555) 000-0000"
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-12 transition-all text-sm font-medium"
                          required={idx === 0}
                        />
                        {phones.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removePhone(idx)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {phones.length > 4 && (
                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 px-1 leading-tight">
                      <AlertTriangle size={10} className="shrink-0" /> 
                      Adding too many numbers may reduce font size and affect readability.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <input 
                      type="checkbox" 
                      id="incEmail" 
                      checked={includeEmail} 
                      onChange={(e) => setIncludeEmail(e.target.checked)}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="incEmail" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer">Include Email?</label>
                  </div>
                  {includeEmail && (
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                      <input
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="hello@julianvane.com"
                        className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-sm font-medium"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Professional Website</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                    <input
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder="www.julianvane.studio"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">QR Code Destination (e.g. LinkedIn)</label>
                  <div className="relative">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                    <input
                      value={qrLinkInput}
                      onChange={(e) => setQrLinkInput(e.target.value)}
                      placeholder="https://linkedin.com/in/julianvane"
                      className="w-full bg-zinc-50 border border-zinc-200 focus:border-blue-600/50 focus:ring-4 focus:ring-blue-600/5 focus:bg-white rounded-2xl py-3 pl-12 pr-4 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Initial Layout</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['standard', 'centered', 'split'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setSelectedLayout(l)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          selectedLayout === l 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full group bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-100 text-white font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Briefcase size={18} />}
                <span>{isGenerating ? 'Synthesizing...' : 'Design Card'}</span>
              </button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 border rounded-2xl text-xs font-medium flex gap-3 ${
                    error.includes('AI Design Forge is currently cooling down') || error.includes('synthesis engine is currently under high load')
                      ? 'bg-amber-50 border-amber-100 text-amber-700' 
                      : 'bg-red-50 border-red-100 text-red-600'
                  }`}
                >
                  <AlertTriangle size={16} className="shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </form>
          </section>

          {currentCard && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm space-y-6"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-2">Layout & Theme</h3>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Switch Layout</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'centered', 'split'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setCurrentCard({ ...currentCard, layout: l })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-1 border ${
                        currentCard.layout === l 
                          ? 'bg-zinc-950 border-zinc-950 text-white' 
                          : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      <LayoutGrid size={12} />
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Logo Management</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-bold"
                  >
                    <ImageIcon size={16} className="text-zinc-600" />
                    Upload Brand Logo
                  </button>
                  <input 
                    type="file" 
                    ref={logoFileInputRef} 
                    onChange={handleLogoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button
                    onClick={handleRegenerateLogo}
                    disabled={isRegeneratingLogo}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-bold"
                  >
                    {isRegeneratingLogo ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} className="text-blue-600" />}
                    Regen AI Logo
                  </button>
                </div>
                
                {currentCard && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = currentCard.logoUrl;
                      link.download = `${currentCard.company.replace(/\s+/g, '_')}_Logo.png`;
                      link.click();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-50 bg-blue-50/50 hover:bg-blue-100 transition-colors text-[10px] font-black uppercase text-blue-600"
                  >
                    <Download size={12} />
                    Download Current Logo Assets
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleSmartTheme}
                  disabled={isSuggestingTheme}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-bold"
                >
                  {isSuggestingTheme ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} className="text-blue-600" />}
                  Smart Theme
                </button>
                
                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 text-xs font-bold relative hover:bg-zinc-100 transition-colors group">
                  <Palette size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Custom Color</span>
                  <input 
                    type="color" 
                    value={currentCard.customBgColor || (currentCard.theme === 'dark' ? '#18181b' : '#ffffff')}
                    onChange={(e) => setCurrentCard({...currentCard, customBgColor: e.target.value})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Change Background Color"
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-zinc-200 mt-1" 
                    style={{ backgroundColor: currentCard.customBgColor || (currentCard.theme === 'dark' ? '#18181b' : '#ffffff') }} 
                  />
                </div>

                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 text-xs font-bold relative hover:bg-zinc-100 transition-colors group">
                  <FileText size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Text Color</span>
                  <input 
                    type="color" 
                    value={currentCard.customTextColor || (getContrastColor(currentCard.customBgColor || (currentCard.theme === 'dark' ? '#18181b' : '#ffffff')) === 'black' ? '#18181b' : '#ffffff')}
                    onChange={(e) => setCurrentCard({...currentCard, customTextColor: e.target.value})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Change Text Color"
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-zinc-200 mt-1" 
                    style={{ backgroundColor: currentCard.customTextColor || (getContrastColor(currentCard.customBgColor || (currentCard.theme === 'dark' ? '#18181b' : '#ffffff')) === 'black' ? '#18181b' : '#ffffff') }} 
                  />
                </div>

                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 text-xs font-bold relative hover:bg-zinc-100 transition-colors group">
                  <CreditCard size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Accent Color</span>
                  <input 
                    type="color" 
                    value={currentCard.accentColor}
                    onChange={(e) => setCurrentCard({...currentCard, accentColor: e.target.value})}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Change Accent Color"
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-zinc-200 mt-1" 
                    style={{ backgroundColor: currentCard.accentColor }} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                {currentCard.backgroundUrl ? (
                  <button
                    onClick={handleRemoveImage}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-xs font-bold text-red-600 group"
                  >
                    <RotateCcw size={16} className="group-hover:-rotate-45 transition-transform" />
                    Remove Brand Image
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-bold"
                    >
                      <ImageIcon size={16} className="text-purple-600" />
                      Upload Brand Image
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </>
                )}
                
                <button
                  onClick={() => setCurrentCard({...currentCard, theme: currentCard.theme === 'light' ? 'dark' : 'light'})}
                  className="w-full py-3 rounded-xl border border-zinc-200 bg-white text-xs font-bold hover:bg-zinc-50"
                >
                  Switch to {currentCard.theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSaveToGallery}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/10 active:scale-[0.98]"
                >
                  Archive Current View
                </button>
                <button
                  onClick={handleArchiveAllLayouts}
                  className="w-full bg-zinc-950 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-black/10 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Library size={16} />
                  Archive All 3 Layouts
                </button>
              </div>
            </motion.section>
          )}
        </div>

        {/* Center/Right Content Area */}
        <div className="w-full xl:col-span-8 flex flex-col gap-16">
          {/* Active Canvas */}
          <section className="w-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Design Canvas</h2>
                {activeProfile ? (
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                    Editing as: {activeProfile.name}
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                    Guest Session &bull; Local Only
                  </span>
                )}
              </div>
              {currentCard && <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1"><Sparkles size={10}/> EDITABLE LIVE</span>}
            </div>

            <div className="flex flex-col items-center justify-center min-h-[500px] bg-zinc-200/30 rounded-[48px] border-2 border-dashed border-zinc-200 p-8 shadow-inner overflow-hidden">
              <AnimatePresence mode="wait">
                {currentCard ? (
                  <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full flex justify-center"
                  >
                    <BusinessCardDisplay card={currentCard} onUpdate={setCurrentCard} />
                  </motion.div>
                ) : isGenerating ? (
                  <div className="flex flex-col items-center gap-6">
                    <Loader2 size={48} className="animate-spin text-blue-600" />
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Processing Architectonics...</p>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
                      <CreditCard size={40} className="text-zinc-300" />
                    </div>
                    <p className="font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Initialize a design to activate canvas</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Repository Repository */}
          <section className="w-full pt-16 border-t border-zinc-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-zinc-950 flex items-center gap-3 italic tracking-tight">
                  <Library size={24} className="text-blue-600" />
                  Vault <span className="text-xs bg-zinc-100 px-3 py-1 rounded-full text-zinc-400 font-mono not-italic border border-zinc-200">{gallery.length}</span>
                </h2>
                
                {currentUser && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={activeProfile?.id || ''} 
                      onChange={(e) => setActiveProfile(availableProfiles.find(p => p.id === e.target.value) || null)}
                      className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider focus:ring-0"
                    >
                      {availableProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={createNewProfile}
                      className="p-1.5 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors text-zinc-500"
                      title="Create New Profile"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {gallery.length > 0 && (
                  <button 
                    onClick={() => { if(confirm('Clear all archived designs in this vault?')) clearVault(); }}
                    className="text-[10px] font-black text-zinc-400 hover:text-red-500 px-4 py-2 rounded-xl transition-all"
                  >
                    PURGE VAULT
                  </button>
                )}
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="py-20 text-center text-zinc-300 uppercase tracking-widest text-[10px] font-black">
                Vault is currently empty
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence mode="popLayout">
                  {gallery.map(card => (
                    <BusinessCardDisplay 
                      key={card.id} 
                      card={card} 
                      compact={true} 
                      onDelete={deleteFromGallery}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="py-20 border-t border-zinc-200 bg-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em]">
            Architected with Pure Logic &bull; Powered by Gemini
          </p>
          <div className="h-px w-12 bg-zinc-200 mx-auto" />
          <p className="text-zinc-300 text-xs font-medium">
            &copy; 2026 AI Business Card Architect. All rights reserved.
          </p>
        </div>
      </footer>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin} 
      />
      
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />

      {currentUser && (
        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          user={currentUser}
          onLogout={handleLogout}
        />
      )}

      <AnimatePresence>
        {showMigrateConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-zinc-900 mb-2">Migrate Local Data?</h3>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                We found cards saved in your guest session. Would you like to move them to your <strong>{activeProfile?.name}</strong> cloud profile?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={migrateGuestCards}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/10 hover:bg-blue-700 transition-all"
                >
                  Yes, Sync Everything
                </button>
                <button
                  onClick={() => setShowMigrateConfirm(false)}
                  className="w-full bg-zinc-50 text-zinc-400 font-bold py-4 rounded-2xl hover:bg-zinc-100 transition-all"
                >
                  Keep Separate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

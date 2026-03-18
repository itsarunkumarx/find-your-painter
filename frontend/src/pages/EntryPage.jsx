import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import safeStorage from '../utils/safeStorage';
import { FaShieldAlt, FaHome, FaCity, FaUserFriends, FaPaintRoller, FaGlobe, FaChevronDown, FaCheck, FaAndroid, FaDownload, FaApple } from 'react-icons/fa';
import useDeviceDetect from '../hooks/useDeviceDetect';

const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
];

const StatCard = ({ icon: Icon, value, label }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="flex flex-col items-center justify-center p-6 glass-card text-center"
    >
        <div className="w-12 h-12 bg-royal-gold/5 rounded-full flex items-center justify-center mb-4 border border-royal-gold/10">
            <Icon className="text-royal-gold text-xl" />
        </div>
        <div className="text-3xl font-black text-[var(--text-main)] mb-1">{value}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold">{label}</div>
    </motion.div>
);

const EntryPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [langOpen, setLangOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt);
    const langRef = useRef(null);
    const { isAndroid, isIOS, isDesktop, isStandalone } = useDeviceDetect();


    useEffect(() => {
        // If it's already available globally, set it
        if (window.deferredPrompt) {
            setDeferredPrompt(window.deferredPrompt);
        }

        const handlePromptAvailable = () => {
            setDeferredPrompt(window.deferredPrompt);
        };

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            setDeferredPrompt(e);
        };

        window.addEventListener('pwa-prompt-available', handlePromptAvailable);
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Provide immediate feedback if the signal hasn't fired yet
            toast.error(t('manual_install_alert'));
            return;
        }

        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                window.deferredPrompt = null;
                setDeferredPrompt(null);
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error('Installation failed:', error);
        }
    };

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        safeStorage.setItem('language', lng);
        setLangOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-20 px-6">
            <div className="max-w-7xl w-full">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-center mb-12 sm:mb-24"
                >
                    <div className="subtitle-royal justify-center">
                        {t('professional_network')}
                    </div>
                    <h1 className="title-royal mb-6 sm:mb-8 text-4xl sm:text-6xl md:text-8xl">
                        {t('hero_title')}
                    </h1>
                    <p className="max-w-2xl mx-auto text-[var(--text-muted)] text-base sm:text-lg md:text-xl font-medium leading-relaxed mb-8 sm:mb-12 px-4 sm:px-0">
                        {t('tagline') || "Connect with verified artisans and transform your space with the platform of authority."}
                    </p>

                    {/* Language Dropdown (hidden until clicked) */}
                    <div className="flex justify-center mb-12">
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => setLangOpen(prev => !prev)}
                                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[var(--bg-highlight)]/60 border border-[var(--glass-border)] backdrop-blur-xl shadow-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all text-sm font-bold"
                                aria-label={t('select_language')}
                            >
                                <FaGlobe className="text-royal-gold text-base" />
                                <span>{currentLang.flag} {currentLang.label}</span>
                                <FaChevronDown className={`text-xs transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {langOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl shadow-2xl shadow-royal-gold/10 overflow-hidden z-50 backdrop-blur-xl"
                                    >
                                        {languages.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => changeLanguage(lang.code)}
                                                className={`w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold transition-all hover:bg-royal-gold/10 ${i18n.language === lang.code ? 'text-royal-gold' : 'text-[var(--text-main)]'}`}
                                            >
                                                <span>{lang.flag} {lang.label}</span>
                                                {i18n.language === lang.code && <FaCheck className="text-royal-gold text-xs" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Smart Install Section - Device Aware */}
                    {!isStandalone && (
                        <div className="mb-16 flex flex-col items-center">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                {/* Install App (PWA) Button — shown on Android, Desktop (when prompt ready), and iOS */}
                                {(deferredPrompt || isIOS) && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleInstallClick}
                                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:shadow-yellow-500/40 transition-all group"
                                    >
                                        <FaDownload className="group-hover:translate-y-0.5 transition-transform" />
                                        {deferredPrompt ? t('install_now') : t('install_now')}
                                    </motion.button>
                                )}

                                {/* Download APK Button — shown ONLY on Android devices */}
                                {isAndroid && (
                                    <motion.a
                                        href="/FindYourPainter.apk"
                                        download="FindYourPainter.apk"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--bg-highlight)] border border-royal-gold/30 text-royal-gold rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-royal-gold/10 transition-all"
                                    >
                                        <FaAndroid className="text-green-400 text-lg" />
                                        {t('download_apk')}
                                    </motion.a>
                                )}
                            </div>

                            {/* iOS specific tip */}
                            {isIOS && !deferredPrompt && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6 p-4 rounded-xl border border-dashed border-royal-gold/20 bg-royal-gold/5 max-w-md text-center"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-royal-gold mb-2 flex items-center justify-center gap-2">
                                        <FaApple /> {t('pwa_feature')}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                        {t('share_step')}
                                    </p>
                                </motion.div>
                            )}

                            {/* Desktop fallback tip when prompt hasn't fired */}
                            {isDesktop && !deferredPrompt && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6 p-4 rounded-xl border border-dashed border-royal-gold/20 bg-royal-gold/5 max-w-md text-center"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-royal-gold mb-2">
                                        {t('manual_install_mode')}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                        {t('menu_step')}
                                    </p>
                                </motion.div>
                            )}

                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-royal-gold animate-pulse">
                                {t('native_performance_tip')}
                            </p>
                        </div>
                    )}

                    {/* Action Hub */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                        <button
                            onClick={() => navigate('/roles')}
                            className="w-full sm:w-auto btn-primary px-8 py-4 sm:px-10 sm:py-5 min-w-[240px] sm:min-w-[280px]"
                        >
                            {t('customer_btn')}
                        </button>
                        <button
                            onClick={() => navigate('/roles')}
                            className="w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-5 min-w-[240px] sm:min-w-[280px] rounded-[2rem] border-2 border-royal-gold text-royal-gold font-black uppercase tracking-widest text-sm hover:bg-royal-gold hover:text-white transition-all duration-300 shadow-md hover:shadow-royal-gold/30"
                        >
                            {t('painter_btn')}
                        </button>
                    </div>
                </motion.section>

                {/* Trust Stats Bar */}
                <motion.section
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mb-16 sm:mb-24"
                >
                    <StatCard icon={FaPaintRoller} value="1.2k+" label={t('stat_painters')} />
                    <StatCard icon={FaHome} value="5k+" label={t('stat_homes')} />
                    <StatCard icon={FaCity} value="50+" label={t('stat_cities')} />
                    <StatCard icon={FaShieldAlt} value="100%" label={t('stat_id')} />
                </motion.section>

                {/* Feature Grid */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
                >
                    <div className="glass-card p-8 sm:p-10 group">
                        <FaUserFriends className="text-royal-gold text-2xl sm:text-3xl mb-4 sm:mb-6 transition-transform duration-500 group-hover:scale-110" />
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-4">{t('feature_matching_title')}</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t('feature_matching_desc')}</p>
                    </div>
                    <div className="glass-card p-8 sm:p-10 group">
                        <FaShieldAlt className="text-royal-gold text-2xl sm:text-3xl mb-4 sm:mb-6 transition-transform duration-500 group-hover:scale-110" />
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-4">{t('feature_security_title')}</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t('feature_security_desc')}</p>
                    </div>
                    <div className="glass-card p-8 sm:p-10 group">
                        <FaHome className="text-royal-gold text-2xl sm:text-3xl mb-4 sm:mb-6 transition-transform duration-500 group-hover:scale-110" />
                        <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] mb-3 sm:mb-4">{t('feature_artistry_title')}</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t('feature_artistry_desc')}</p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default EntryPage;

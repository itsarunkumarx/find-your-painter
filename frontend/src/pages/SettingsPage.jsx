import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    FaUser, FaBell, FaPalette, FaHistory, FaSignOutAlt, FaShieldAlt, FaLanguage, FaVolumeUp, FaVideo, FaGamepad, FaLink, FaMobileAlt,
    FaGlobe, FaChevronRight, FaCamera, FaCheckCircle, FaPhone, FaEnvelope, FaMapMarkerAlt, FaLock, FaRocket, FaDownload, FaSyncAlt, FaAndroid
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useRef, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { 
    checkAppUpdate, 
    CURRENT_APP_VERSION, 
    getUpdatePreferences, 
    saveUpdatePreferences, 
    fetchReleaseHistory 
} from '../utils/appVersion';
import UpdateModal from '../components/UpdateModal';
import { triggerTestOfflineNotification } from '../services/offlineNotificationService';

const SettingsPage = () => {
    const { user, updateUser, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateResult, setUpdateResult] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updatePrefs, setUpdatePrefs] = useState(getUpdatePreferences());
    const [releaseHistory, setReleaseHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const fileInputRef = useRef(null);

    // Profile State
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        profileImage: ''
    });

    // Security State
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Update local state when user context changes
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                profileImage: user.profileImage || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.put('/users/profile', profileData);
            updateUser(data);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSecurityUpdate = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.put('/users/profile', {
                password: securityData.newPassword
            });
            toast.success('Password updated successfully');
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Security update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prev => ({ ...prev, profileImage: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const { isPushSupported, isSubscribed, isPushInitializing, subscribeToPush, unsubscribeFromPush, sendTestNotification } = useSocket();

    const handlePreferenceToggle = async (itemId) => {
        if (!user) return;
        const currentVal = user.notificationPreferences?.[itemId] ?? (itemId === 'email');
        try {
            const { data } = await api.put('/users/profile', {
                notificationPreferences: {
                    ...user.notificationPreferences,
                    [itemId]: !currentVal
                }
            });
            updateUser(data);
        } catch (err) {
            if (import.meta.env.DEV) console.error('Failed to update preference:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/roles');
    };

    const handleUpdatePrefToggle = (key) => {
        const updated = saveUpdatePreferences({ [key]: !updatePrefs[key] });
        setUpdatePrefs(updated);
        toast.success(`Updated: ${key} is now ${updated[key] ? 'Enabled' : 'Disabled'}`);
    };

    const handleChannelChange = (channel) => {
        const updated = saveUpdatePreferences({ channel });
        setUpdatePrefs(updated);
        toast.success(`Switched to ${channel.toUpperCase()} release channel`);
    };

    useEffect(() => {
        if (activeTab === 'updates' && releaseHistory.length === 0) {
            setLoadingHistory(true);
            fetchReleaseHistory().then(history => {
                setReleaseHistory(history);
                setLoadingHistory(false);
            });
        }
    }, [activeTab, releaseHistory.length]);

    const handleManualUpdateCheck = async () => {
        setIsCheckingUpdate(true);
        const toastId = toast.loading('Checking for latest updates...');
        try {
            const result = await checkAppUpdate(true);
            setUpdateResult(result);
            if (result.hasUpdate && result.updateInfo) {
                toast.success(`New update available: v${result.updateInfo.latestVersion}!`, { id: toastId });
                setShowUpdateModal(true);
            } else {
                toast.success('Your app is up to date (v' + CURRENT_APP_VERSION + ')', { id: toastId });
            }
        } catch (e) {
            toast.error('Could not reach update server', { id: toastId });
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Identity', icon: FaUser },
        { id: 'security', label: 'Security', icon: FaShieldAlt },
        { id: 'language', label: 'Language', icon: FaGlobe },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
        { id: 'updates', label: 'App Updates', icon: FaRocket },
    ];

    return (
        <div className="space-y-10 pb-12">
            <div>
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                    Command <span className="text-royal-gold">Settings</span>
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Configure your platform presence and security protocols.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between px-6 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all group ${activeTab === tab.id
                                ? 'bg-[var(--text-main)] text-[var(--bg-base)] shadow-xl shadow-royal-gold/20'
                                : 'glass-card text-[var(--text-muted)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-main)] shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <tab.icon className={activeTab === tab.id ? 'text-royal-gold' : 'text-slate-300 group-hover:text-royal-gold'} />
                                {tab.label}
                            </div>
                            <FaChevronRight className={`text-[8px] transition-transform ${activeTab === tab.id ? 'translate-x-1' : 'opacity-0'}`} />
                        </button>
                    ))}

                    <div className="pt-6 border-t border-royal-gold/5 mt-4">
                        <div className="px-6 mb-2 text-[8px] font-black uppercase tracking-[0.3em] text-red-500/60">Danger Zone</div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50/50 hover:bg-red-50 border border-red-100 transition-all group shadow-sm"
                        >
                            <FaSignOutAlt className="group-hover:scale-110 transition-transform" />
                            Log Out Protocol
                        </button>
                    </div>
                </div>

                {/* Content Panel */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="glass-card p-10 shadow-2xl shadow-royal-gold/5 min-h-[500px]"
                        >
                            {activeTab === 'profile' && (
                                <form onSubmit={handleProfileUpdate} className="space-y-8">
                                    <div className="flex flex-col md:flex-row items-center gap-10 border-b border-royal-gold/5 pb-10">
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-royal-gold/10 rounded-[2.5rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <img
                                                src={profileData.profileImage || "/assets/premium-avatar.png"}
                                                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-[var(--bg-base)] shadow-xl relative"
                                                alt="Avatar"
                                            />
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current.click()}
                                                className="absolute -bottom-2 -right-2 bg-[var(--text-main)] text-royal-gold p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform"
                                            >
                                                <FaCamera size={14} />
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-navy-deep">{profileData.name || 'Your Name'}</h3>
                                            <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.3em] mt-1">{user?.role} Access Member</p>
                                            <div className="flex items-center gap-3 mt-4">
                                                <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
                                                    <FaCheckCircle /> Verified Cloud ID
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Display Name</label>
                                            <div className="relative">
                                                <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                    className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 pl-12 pr-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Phone Deployment</label>
                                            <div className="relative">
                                                <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                                                <input
                                                    type="text"
                                                    value={profileData.phoneNumber}
                                                    onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                                    className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 pl-12 pr-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Email Relay</label>
                                            <div className="relative">
                                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 pl-12 pr-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Service Sector</label>
                                            <div className="relative">
                                                <FaMapMarkerAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-royal-gold/40" />
                                                <input
                                                    type="text"
                                                    value={profileData.address}
                                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                                    className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 pl-12 pr-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-10 py-5 bg-[var(--text-main)] text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-royal-gold/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? 'Synchronizing...' : 'Synchronize Identity'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === 'security' && (
                                <form onSubmit={handleSecurityUpdate} className="space-y-8 max-w-xl">
                                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm shrink-0">
                                            <FaLock />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Security Advisory</h4>
                                            <p className="text-[11px] text-red-900/60 mt-1">Ensure your password is at least 8 characters long and includes encrypted variables.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Current Cipher</label>
                                            <input
                                                type="password"
                                                value={securityData.currentPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                                className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 px-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">New Cipher</label>
                                            <input
                                                type="password"
                                                value={securityData.newPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                                className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 px-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-2">Verify Cipher</label>
                                            <input
                                                type="password"
                                                value={securityData.confirmPassword}
                                                onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                className="w-full bg-[var(--bg-highlight)] border-none rounded-2xl py-4 px-6 text-[var(--text-main)] text-xs font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/30 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-5 bg-[var(--text-main)] text-[var(--bg-base)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl disabled:opacity-50"
                                    >
                                        {loading ? 'Encrypting...' : 'Update Security Protocol'}
                                    </button>
                                </form>
                            )}

                            {activeTab === 'language' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { id: 'en', label: 'English (US)', flag: '🇺🇸', desc: 'Global Standard Intelligence' },
                                            { id: 'ta', label: 'தமிழ் (Tamil)', flag: '🇮🇳', desc: 'Regional Bharat Interface' }
                                        ].map((lang) => (
                                            <button
                                                key={lang.id}
                                                onClick={() => changeLanguage(lang.id)}
                                                className={`p-8 rounded-[2.5rem] border text-left transition-all group ${i18n.language === lang.id
                                                    ? 'bg-[var(--text-main)] border-royal-gold shadow-2xl shadow-royal-gold/20'
                                                    : 'bg-[var(--bg-highlight)] border-royal-gold/5 hover:border-royal-gold/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-3xl">{lang.flag}</span>
                                                    {i18n.language === lang.id && <FaCheckCircle className="text-royal-gold" />}
                                                </div>
                                                <h4 className={`text-sm font-black uppercase tracking-widest ${i18n.language === lang.id ? 'text-[var(--bg-base)]' : 'text-[var(--text-main)]'}`}>{lang.label}</h4>
                                                <p className={`text-[9px] font-bold mt-2 ${i18n.language === lang.id ? 'text-royal-gold/60' : 'text-[var(--text-muted)]'}`}>{lang.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-8 max-w-2xl">
                                    <div className="space-y-4">
                                        {[
                                            { id: 'email', label: 'Email Alerts', desc: 'Mission critical updates via secure relay' },
                                            { id: 'sms', label: 'SMS Dispatch', desc: 'Real-time mobile field updates' },
                                            { id: 'push', label: 'Push Intelligence', desc: 'Browser-based active signals' }
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-6 bg-ivory-subtle rounded-3xl border border-royal-gold/5 group hover:border-royal-gold/20 transition-all">
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{item.label}</h4>
                                                    <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1">{item.desc}</p>
                                                </div>
                                                {item.id === 'push' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-4 bg-navy-deep/5 p-3 rounded-2xl">
                                                            <div className="p-2 bg-white/80 rounded-xl text-navy-deep/40 group-hover:text-royal-gold transition-colors">
                                                                <FaMobileAlt size={16} />
                                                            </div>
                                                            <div className="hidden sm:block">
                                                                <p className="text-[10px] font-black text-navy-deep uppercase tracking-tight">App Signal</p>
                                                            </div>
                                                        </div>
                                                        {isPushSupported ? (
                                                              <button
                                                                onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                                                                disabled={isPushInitializing}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSubscribed 
                                                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-sm border border-red-500/20' 
                                                                    : 'bg-navy-deep text-royal-gold hover:scale-105 shadow-lg'
                                                                    } ${isPushInitializing ? 'opacity-50 cursor-wait' : ''}`}
                                                            >
                                                                {isPushInitializing ? (isSubscribed ? 'Deactivating...' : 'Initializing...') : isSubscribed ? 'Disable' : 'Enable'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-widest">Not Supported</span>
                                                        )}
                                                        {isSubscribed && (
                                                            <button
                                                                onClick={sendTestNotification}
                                                                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-royal-gold text-navy-deep hover:scale-105 transition-all shadow-lg"
                                                            >
                                                                Test
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePreferenceToggle(item.id)}
                                                        className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${user?.notificationPreferences?.[item.id] ? 'bg-navy-deep' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center ${user?.notificationPreferences?.[item.id] ? 'left-8 bg-royal-gold' : 'left-1'}`}>
                                                            {user?.notificationPreferences?.[item.id] && <FaCheckCircle className="text-navy-deep text-[10px]" />}
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* Android Offline Notification Test Card */}
                                        <div className="flex items-center justify-between p-6 bg-ivory-subtle rounded-3xl border border-royal-gold/10 mt-6 shadow-sm">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
                                                        Android Offline Alert Engine
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">Active</span>
                                                </div>
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                                    Automatically pushes native system notifications whenever cellular/Wi-Fi connection drops.
                                                </p>
                                            </div>
                                            <button
                                                onClick={triggerTestOfflineNotification}
                                                className="px-4 py-2.5 rounded-xl bg-navy-deep text-royal-gold hover:bg-navy-light font-black text-[10px] uppercase tracking-wider shadow-md transition-all shrink-0 active:scale-95"
                                            >
                                                Test Alert
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'updates' && (
                                <div className="space-y-8 max-w-2xl">
                                    {/* 1. Installed Version Hero Card */}
                                    <div className="p-8 bg-ivory-subtle rounded-3xl border border-royal-gold/10 relative overflow-hidden shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/15 text-royal-gold text-[10px] font-black uppercase tracking-widest">
                                                    <span>Installed Engine Version</span>
                                                </div>
                                                <h3 className="text-3xl font-black text-[var(--text-main)]">
                                                    v{CURRENT_APP_VERSION}
                                                </h3>
                                                <p className="text-xs text-[var(--text-muted)] font-medium">
                                                    Find Your Painter Core • Channel: <span className="text-royal-gold font-bold uppercase">{updatePrefs.channel}</span>
                                                </p>
                                            </div>
                                            <div className="w-16 h-16 rounded-3xl bg-navy-deep text-royal-gold flex items-center justify-center shadow-xl border border-royal-gold/20">
                                                <FaRocket size={26} />
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-royal-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>OTA Update Server: </span>
                                                <span className="text-emerald-500 font-bold">Online & Synchronized</span>
                                            </div>
                                            <button
                                                onClick={handleManualUpdateCheck}
                                                disabled={isCheckingUpdate}
                                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-navy-deep text-royal-gold hover:bg-navy-light font-black text-xs uppercase tracking-widest shadow-lg shadow-navy-deep/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                <FaSyncAlt className={isCheckingUpdate ? 'animate-spin' : ''} />
                                                <span>{isCheckingUpdate ? 'Scanning...' : 'Check for Updates'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Auto-Update Preferences Toggles */}
                                    <div className="space-y-4">
                                        <div className="px-2">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
                                                Update Preferences & Automation
                                            </h4>
                                            <p className="text-[10px] text-[var(--text-muted)]">Configure how and when your app receives new features.</p>
                                        </div>

                                        {/* Toggle 1: Auto-Update Notifications */}
                                        <div className="flex items-center justify-between p-6 bg-ivory-subtle rounded-3xl border border-royal-gold/5 hover:border-royal-gold/20 transition-all">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                                    Automatic Update Notifications
                                                </h4>
                                                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1">
                                                    Prompt automatically on launch when a newer APK version is published
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUpdatePrefToggle('autoUpdateEnabled')}
                                                className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${
                                                    updatePrefs.autoUpdateEnabled ? 'bg-navy-deep' : 'bg-slate-200'
                                                }`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center ${
                                                    updatePrefs.autoUpdateEnabled ? 'left-8 bg-royal-gold' : 'left-1'
                                                }`}>
                                                    {updatePrefs.autoUpdateEnabled && <FaCheckCircle className="text-navy-deep text-[10px]" />}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Toggle 2: Download Over Wi-Fi Only */}
                                        <div className="flex items-center justify-between p-6 bg-ivory-subtle rounded-3xl border border-royal-gold/5 hover:border-royal-gold/20 transition-all">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                                    Download Over Wi-Fi Only
                                                </h4>
                                                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1">
                                                    Prevent large APK binary downloads over cellular data
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUpdatePrefToggle('wifiOnly')}
                                                className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${
                                                    updatePrefs.wifiOnly ? 'bg-navy-deep' : 'bg-slate-200'
                                                }`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center ${
                                                    updatePrefs.wifiOnly ? 'left-8 bg-royal-gold' : 'left-1'
                                                }`}>
                                                    {updatePrefs.wifiOnly && <FaCheckCircle className="text-navy-deep text-[10px]" />}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Channel Selector */}
                                        <div className="p-6 bg-ivory-subtle rounded-3xl border border-royal-gold/5">
                                            <div className="mb-3">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                                    Release Channel
                                                </h4>
                                                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-0.5">
                                                    Choose between verified stable builds or early-access beta features
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleChannelChange('stable')}
                                                    className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                        updatePrefs.channel === 'stable'
                                                            ? 'bg-navy-deep text-royal-gold shadow-md'
                                                            : 'bg-white/80 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                    }`}
                                                >
                                                    {updatePrefs.channel === 'stable' && <FaCheckCircle size={12} />}
                                                    <span>Stable (Production)</span>
                                                </button>
                                                <button
                                                    onClick={() => handleChannelChange('beta')}
                                                    className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                        updatePrefs.channel === 'beta'
                                                            ? 'bg-navy-deep text-royal-gold shadow-md'
                                                            : 'bg-white/80 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                                    }`}
                                                >
                                                    {updatePrefs.channel === 'beta' && <FaCheckCircle size={12} />}
                                                    <span>Beta (Early Access)</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Direct Android APK download card */}
                                    <div className="p-6 bg-gradient-to-br from-navy-deep to-[#111c35] text-white rounded-3xl border border-royal-gold/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                                <FaAndroid size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-wider text-white">Android Package Installer (APK)</h4>
                                                <p className="text-[10px] text-slate-300">Download the standalone debug/release APK directly</p>
                                            </div>
                                        </div>
                                        <a
                                            href="https://github.com/itsarunkumarx/find-your-painter/releases/latest"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-5 py-3 rounded-xl bg-royal-gold text-navy-deep font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shrink-0"
                                        >
                                            <FaDownload />
                                            <span>Download APK</span>
                                        </a>
                                    </div>

                                    {/* 4. Release History & Changelogs */}
                                    <div className="space-y-4 pt-4">
                                        <div className="px-2 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
                                                    Version Release History & Changelogs
                                                </h4>
                                                <p className="text-[10px] text-[var(--text-muted)]">Official changelogs and platform roadmap updates.</p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-royal-gold bg-royal-gold/10 px-3 py-1 rounded-full">
                                                {releaseHistory.length} Releases
                                            </span>
                                        </div>

                                        {loadingHistory ? (
                                            <div className="p-8 text-center bg-ivory-subtle rounded-3xl text-xs text-[var(--text-muted)]">
                                                <FaSyncAlt className="animate-spin inline mr-2" />
                                                Loading release logs...
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {releaseHistory.map((item) => (
                                                    <div
                                                        key={item.version}
                                                        className="p-6 bg-ivory-subtle rounded-3xl border border-royal-gold/10 hover:border-royal-gold/25 transition-all space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="px-3 py-1 rounded-xl bg-navy-deep text-royal-gold font-mono font-black text-xs">
                                                                    v{item.version}
                                                                </span>
                                                                <span className="text-xs font-black text-[var(--text-main)]">
                                                                    {item.title}
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                                {item.releaseDate}
                                                            </span>
                                                        </div>

                                                        {item.highlights && item.highlights.length > 0 && (
                                                            <div className="space-y-1.5 pl-1 pt-1 border-t border-royal-gold/5">
                                                                {item.highlights.map((note, nIdx) => (
                                                                    <div key={nIdx} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                                                                        <span className="text-royal-gold text-[10px] mt-0.5">•</span>
                                                                        <span className="text-[11px] font-medium leading-relaxed">{note}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* In-app update modal */}
            <UpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                updateInfo={updateResult?.updateInfo}
            />
        </div>
    );
};

export default SettingsPage;

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
    FaUser, FaBell, FaPalette, FaHistory, FaSignOutAlt, FaShieldAlt, FaLanguage, FaVolumeUp, FaVideo, FaGamepad, FaLink, FaMobileAlt,
    FaGlobe, FaChevronRight, FaCamera, FaCheckCircle, FaPhone, FaEnvelope, FaMapMarkerAlt, FaLock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const SettingsPage = () => {
    const { user, updateUser, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
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
            alert('Profile updated successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSecurityUpdate = async (e) => {
        e.preventDefault();
        if (securityData.newPassword !== securityData.confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api.put('/users/profile', {
                password: securityData.newPassword
            });
            alert('Password updated successfully');
            setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Security update failed');
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

    const { isPushSupported, isSubscribed, subscribeToPush } = useSocket();

    const handleLogout = () => {
        logout();
        navigate('/roles');
    };

    const tabs = [
        { id: 'profile', label: 'Identity', icon: FaUser },
        { id: 'security', label: 'Security', icon: FaShieldAlt },
        { id: 'language', label: 'Language', icon: FaGlobe },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
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
                                                    <div className="flex items-center justify-between p-4 bg-navy-deep/5 rounded-2xl hover:bg-navy-deep/10 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-white/80 rounded-xl text-navy-deep/40 group-hover:text-royal-gold transition-colors">
                                                                <FaMobileAlt size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-navy-deep">Offline Notifications</p>
                                                                <p className="text-[10px] text-navy-deep/50">Get alerts even when app is closed</p>
                                                            </div>
                                                        </div>
                                                        {isPushSupported ? (
                                                            <button
                                                                onClick={subscribeToPush}
                                                                disabled={isSubscribed}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSubscribed ? 'bg-green-500/10 text-green-500 cursor-default' : 'bg-navy-deep text-royal-gold hover:scale-105'
                                                                    }`}
                                                            >
                                                                {isSubscribed ? 'Enabled' : 'Enable'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">Not Supported</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-6 bg-[var(--bg-base)] rounded-full relative cursor-not-allowed opacity-50">
                                                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

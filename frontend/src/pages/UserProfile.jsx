import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    FaUser, FaPhone, FaLock, FaCheck, FaTimes, FaCamera,
    FaShieldAlt, FaMapMarkerAlt, FaEnvelope
} from 'react-icons/fa';

const UserProfile = () => {
    const { t } = useTranslation();
    const { user, login } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const updateProfile = async (e) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            alert(t('passwords_mismatch') || 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
                name,
                email,
                phoneNumber,
                address,
                profileImage,
                password: password || undefined
            }, config);

            login(data);
            alert(t('profile_success') || 'Profile updated successfully');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            alert(error.response?.data?.message || t('submission_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                    Profile <span className="text-yellow-500">Intelligence</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">Manage your identity and platform secure credentials.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Avatar Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col items-center">
                        <div className="relative group">
                            <img
                                src={profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-slate-50 shadow-xl transition-transform group-hover:scale-105"
                                alt="Avatar"
                            />
                            <button className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl shadow-xl hover:bg-yellow-500 hover:text-slate-900 transition-all active:scale-95">
                                <FaCamera className="text-sm" />
                            </button>
                        </div>
                        <div className="mt-6 text-center">
                            <h3 className="text-xl font-black text-slate-800">{name}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{user?.role} Account</p>
                        </div>
                        <div className="mt-8 w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-2">
                            <FaShieldAlt className="text-green-500 text-xs" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Identity</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Account Activity</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold opacity-60">Member Since</span>
                                <span className="text-[10px] font-black uppercase">Feb 2024</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold opacity-60">Status</span>
                                <span className="flex items-center gap-1.5 text-[8px] font-black uppercase bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" /> Live
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={updateProfile} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Full Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent focus:border-yellow-500/30 rounded-2xl py-4 pl-12 pr-6 text-slate-800 text-xs font-bold outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Phone Number</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent focus:border-yellow-500/30 rounded-2xl py-4 pl-12 pr-6 text-slate-800 text-xs font-bold outline-none transition-all"
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-transparent focus:border-yellow-500/30 rounded-2xl py-4 pl-12 pr-6 text-slate-800 text-xs font-bold outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Service Address</label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full bg-slate-50 border border-transparent focus:border-yellow-500/30 rounded-2xl py-4 pl-12 pr-6 text-slate-800 text-xs font-bold outline-none transition-all"
                                    placeholder="Enter your primary service location"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">New Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent focus:border-yellow-500/30 rounded-2xl py-4 pl-12 pr-6 text-slate-800 text-xs font-bold outline-none transition-all"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Confirm Identity</label>
                                <div className="relative">
                                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-transparent focus:border-yellow-500/30 rounded-2xl py-4 pl-12 pr-6 text-slate-800 text-xs font-bold outline-none transition-all"
                                        placeholder="Repeat new password"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Synchronizing Intelligence...' : 'Update Platform Intel'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

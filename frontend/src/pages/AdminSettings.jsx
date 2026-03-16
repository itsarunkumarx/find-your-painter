import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaCog, FaShieldAlt, FaMoneyBillWave, FaBell, FaGlobe, FaTools } from 'react-icons/fa';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [settings, setSettings] = useState({
        commissionRate: 10,
        maintenanceMode: false,
        platformName: 'Find Your Painter',
        contactEmail: 'support@findyourpainter.com',
        minimumBookingAmount: 500,
        enableGlobalNotifications: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/admin/settings');
                if (Object.keys(data).length > 0) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
            } catch (error) {
                console.error('Fetch settings failed', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/admin/settings', { settings });
            toast.success(t('settings_saved_success') || 'Platform settings updated successfully');
        } catch (error) {
            console.error('Save settings failed', error);
            toast.error(t('settings_save_error') || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">
                        Platform <span className="text-royal-gold">Settings</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Configure global parameters and platform protocols.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 px-8 py-4 bg-navy-deep text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-deep/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaSave className="text-royal-gold" />}
                    {saving ? 'SYNCING...' : 'SAVE CONFIGURATION'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Economic Protocol */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-royal-gold/10 shadow-xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-ivory-subtle flex items-center justify-center text-royal-gold text-xl">
                            <FaMoneyBillWave />
                        </div>
                        <h2 className="text-lg font-black text-navy-deep uppercase tracking-tight">Economic Protocols</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Platform Commission (%)</label>
                            <input
                                type="number"
                                value={settings.commissionRate}
                                onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-xl p-4 text-navy-deep font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Minimum Booking Amount (₹)</label>
                            <input
                                type="number"
                                value={settings.minimumBookingAmount}
                                onChange={(e) => setSettings({ ...settings, minimumBookingAmount: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-xl p-4 text-navy-deep font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/20 transition-all"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* System Guard */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-navy-deep p-8 rounded-[2.5rem] border border-royal-gold/20 shadow-xl"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-royal-gold text-xl">
                            <FaShieldAlt />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">System Guard</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div>
                                <h3 className="text-white text-xs font-black uppercase tracking-widest">Maintenance Mode</h3>
                                <p className="text-white/40 text-[9px] uppercase font-bold mt-1">Suspend all public access</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                className={`w-14 h-8 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-royal-gold' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.maintenanceMode ? 'left-7 shadow-lg' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                            <div>
                                <h3 className="text-white text-xs font-black uppercase tracking-widest">Global Broadcasts</h3>
                                <p className="text-white/40 text-[9px] uppercase font-bold mt-1">Enable system-wide alerts</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, enableGlobalNotifications: !settings.enableGlobalNotifications })}
                                className={`w-14 h-8 rounded-full transition-all relative ${settings.enableGlobalNotifications ? 'bg-royal-gold' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${settings.enableGlobalNotifications ? 'left-7 shadow-lg' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Communication Matrix */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-royal-gold/10 shadow-xl lg:col-span-2"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-ivory-subtle flex items-center justify-center text-royal-gold text-xl">
                            <FaGlobe />
                        </div>
                        <h2 className="text-lg font-black text-navy-deep uppercase tracking-tight">Enterprise Identity & Control</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Platform Legal Name</label>
                            <input
                                type="text"
                                value={settings.platformName}
                                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-xl p-4 text-navy-deep font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/20 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Support Gateway Email</label>
                            <input
                                type="email"
                                value={settings.contactEmail}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                className="w-full bg-ivory-subtle border-none rounded-xl p-4 text-navy-deep font-bold outline-none ring-1 ring-royal-gold/5 focus:ring-royal-gold/20 transition-all"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminSettings;

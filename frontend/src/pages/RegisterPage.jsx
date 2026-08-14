import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
    const { role } = useParams(); // user, worker
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (role === 'worker') {
            navigate('/login/worker');
        }
    }, [role, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError(t('passwords_mismatch'));
            return;
        }

        const res = await register({ ...formData, role });
        if (res.success) {
            navigate(role === 'worker' ? '/worker-dashboard' : '/user-dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-20 px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="glass-card p-8 sm:p-10 md:p-14 w-full max-w-lg relative overflow-hidden"
            >
                {/* Authority Badge */}
                <div className="absolute top-2 right-2 sm:top-0 sm:right-0 p-4 sm:p-8 opacity-10 sm:opacity-20 text-[8px] sm:text-[10px] font-black tracking-[0.4em] uppercase text-yellow-500 pointer-events-none z-0">
                    {t('fast_registry')}: {role?.toUpperCase()}
                </div>

                <div className="text-center mb-8 sm:mb-10 relative z-10 px-2">
                    <div className="subtitle-royal justify-center text-yellow-600">
                        {t('join_us')}
                    </div>
                    <h2 className="title-royal text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-transparent">
                        {t('create_account')}
                    </h2>
                    <p className="text-slate-600 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] opacity-60">{t('elite_registry')}</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-center text-xs font-bold uppercase tracking-wider"
                    >
                        Error: {error}
                    </motion.div>
                )}

                {role === 'worker' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl mb-8 text-center space-y-2"
                    >
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Security Induction Notice</p>
                        <p className="text-xs font-bold">Default System Password: <span className="bg-blue-500/20 px-2 py-0.5 rounded ml-1 text-white">worker@123</span></p>
                        <p className="text-[9px] opacity-60 uppercase tracking-widest">Access requires identity validation by system curators</p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">{t('full_name')}</label>
                        <input
                            name="name"
                            placeholder={t('name_placeholder')}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">{t('email_label')}</label>
                        <input
                            type="email"
                            name="email"
                            placeholder={t('email_placeholder')}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">{t('password_label')}</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="••••"
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">{t('confirm_password')}</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="••••"
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary !rounded-2xl shadow-xl mt-4">
                        {t('create_account_now')}
                    </button>
                </form>

                <p className="mt-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {t('already_member')} <span className="text-yellow-600 cursor-pointer hover:text-yellow-700 transition-colors" onClick={() => navigate(`/login/${role}`)}>{t('secure_login')}</span>
                </p>
            </motion.div>
        </div>
    );
};

export default RegisterPage;

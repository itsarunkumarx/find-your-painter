import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FaPaintRoller, FaArrowLeft, FaCloudUploadAlt } from 'react-icons/fa';

const BecomePainterPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        skills: '',
        experience: '',
        location: '',
        price: '',
        bio: '',
        idProof: '',
        workImages: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const skillsArray = formData.skills.split(',').map(s => s.trim());

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };

            await axios.post(`${import.meta.env.VITE_API_URL}/api/workers/apply`, {
                ...formData,
                skills: skillsArray,
                workImages: formData.workImages.split(',').map(img => img.trim()).filter(img => img !== '')
            }, config);

            // Redirect to a "Pending" view or dashboard with status
            navigate('/user-dashboard');
            // Show toast in real app
        } catch (err) {
            setError(err.response?.data?.message || t('app_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory-light p-6 lg:p-12">
            <motion.button
                whileHover={{ x: -5 }}
                onClick={() => navigate('/user-dashboard')}
                className="flex items-center gap-2 text-royal-gold/60 hover:text-royal-gold transition-colors mb-12 text-xs font-bold uppercase tracking-widest"
            >
                <FaArrowLeft /> {t('return_to_dashboard')}
            </motion.button>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Left: Info */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 text-royal-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4">
                                <span className="w-12 h-px bg-royal-gold/30"></span>
                                {t('career_advancement')}
                            </div>
                            <h1 className="text-5xl font-bold text-navy-deep tracking-tight leading-tight">
                                {t('join_expert_team').split(' Expert ')[0]} <span className="text-royal-gold">Elite Specialists</span>
                            </h1>
                            <p className="mt-6 text-navy-deep/40 leading-loose font-light">
                                {t('painter_joining_desc')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { title: t('premium_visibility_title'), desc: t('premium_visibility_desc') },
                                { title: t('secure_payments_title'), desc: t('secure_payments_desc') },
                                { title: t('direct_comm_title'), desc: t('direct_comm_desc') }
                            ].map((item, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={idx}
                                    className="flex gap-4 items-start"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-royal-gold mt-2"></div>
                                    <div>
                                        <h4 className="text-navy-deep font-bold text-sm tracking-wide">{item.title}</h4>
                                        <p className="text-navy-deep/30 text-xs mt-1">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-10 relative overflow-hidden"
                    >
                        {/* Decorative background icon */}
                        <FaPaintRoller className="absolute -bottom-10 -right-10 text-royal-gold/5 text-9xl -rotate-12" />

                        <div className="relative">
                            <h3 className="text-xl font-bold text-navy-deep mb-8">{t('painter_app_title')}</h3>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-widest uppercase p-4 rounded-xl mb-8">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">{t('expertise_comma')}</label>
                                    <input
                                        name="skills"
                                        placeholder={t('skills_placeholder')}
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">{t('xp_years')}</label>
                                    <input
                                        type="number"
                                        name="experience"
                                        placeholder="e.g. 5"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">{t('day_rate_rs')}</label>
                                    <input
                                        type="number"
                                        name="price"
                                        placeholder="e.g. 800"
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">{t('base_location')}</label>
                                    <input
                                        name="location"
                                        placeholder={t('location_placeholder')}
                                        onChange={handleChange}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">{t('about_me')}</label>
                                    <textarea
                                        name="bio"
                                        rows="3"
                                        placeholder={t('bio_placeholder')}
                                        onChange={handleChange}
                                        className="input-field py-4 min-h-[100px]"
                                        required
                                    />
                                </div>

                                <div className="space-y-4 col-span-2 p-6 bg-navy-deep/[0.02] rounded-2xl border border-navy-deep/5 border-dashed">
                                    <div className="flex items-center gap-3 text-royal-gold">
                                        <FaCloudUploadAlt />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-navy-deep/60">{t('professional_credentials')}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-navy-deep/30 ml-2">{t('id_proof_secret')}</label>
                                            <input
                                                name="idProof"
                                                placeholder={t('id_link_placeholder')}
                                                onChange={handleChange}
                                                className="input-field text-[10px]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-navy-deep/30 ml-2">{t('portfolio_links_comma')}</label>
                                            <input
                                                name="workImages"
                                                placeholder={t('portfolio_placeholder')}
                                                onChange={handleChange}
                                                className="input-field text-[10px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-primary font-bold uppercase tracking-[0.2em] py-5 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-royal-navy/20 border-t-royal-navy rounded-full animate-spin"></div>
                                        ) : (
                                            t('submit_app')
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default BecomePainterPage;

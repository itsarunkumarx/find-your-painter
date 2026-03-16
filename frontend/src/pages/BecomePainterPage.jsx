import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useTranslation } from 'react-i18next';
import { FaPaintRoller, FaArrowLeft, FaCloudUploadAlt } from 'react-icons/fa';

const BecomePainterPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        applicationEmail: '',
        applicationPhone: '',
        skills: '',
        experience: '',
        location: '',
        price: '',
        bio: '',
        idProof: null,
        workImages: ''
    });

    const handleChange = (e) => {
        if (e.target.name === 'idProof') {
            setFormData({ ...formData, idProof: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim());

            const submissionData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'skills') {
                    submissionData.append(key, JSON.stringify(skillsArray));
                } else if (key === 'workImages') {
                    submissionData.append(key, JSON.stringify(formData.workImages.split(',').map(img => img.trim()).filter(img => img !== '')));
                } else {
                    submissionData.append(key, formData[key]);
                }
            });

            await api.post('/workers/apply', submissionData);

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
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">Full Legal Name</label>
                                    <input
                                        name="fullName"
                                        placeholder="Enter your full name"
                                        onChange={handleChange}
                                        value={formData.fullName}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <label className="text-[10px] font-bold text-navy-deep/40 uppercase tracking-widest ml-2">Contact Email ID</label>
                                    <input
                                        type="email"
                                        name="applicationEmail"
                                        placeholder="your@email.com"
                                        onChange={handleChange}
                                        value={formData.applicationEmail}
                                        className="input-field"
                                        required
                                    />
                                </div>

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
                                            <label className="text-[8px] font-black uppercase tracking-[0.2em] text-navy-deep/30 ml-2">{t('id_proof')}</label>
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    name="idProof"
                                                    onChange={handleChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    required
                                                    accept="image/*,application/pdf"
                                                />
                                                <div className="input-field text-[10px] flex items-center justify-between group-hover:border-royal-gold transition-colors">
                                                    <span className="truncate">
                                                        {formData.idProof ? formData.idProof.name : t('id_link_placeholder')}
                                                    </span>
                                                    <FaCloudUploadAlt className="text-royal-gold/40 group-hover:text-royal-gold transition-colors" />
                                                </div>
                                            </div>
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

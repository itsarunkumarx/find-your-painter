import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaStar, FaTimes, FaUpload, FaImages, FaPaintBrush } from 'react-icons/fa';

import { useTranslation } from 'react-i18next';

const PortfolioPage = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const [preview, setPreview] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const fileRef = useRef();



    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const { data } = await api.get('/workers/profile');
                setImages(data.portfolioImages || []);
            } catch (e) { 
                if (import.meta.env.DEV) console.error(e); 
            } finally { setLoading(false); }
        };
        fetchPortfolio();
    }, []);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const uploadImage = async () => {
        if (!preview) return;
        setUploading(true);
        try {
            const { data } = await api.post(
                '/workers/portfolio',
                { url: preview, caption }
            );
            setImages(data);
            setPreview(null);
            setCaption('');
            fileRef.current.value = '';
        } catch (e) { 
            if (import.meta.env.DEV) console.error(e); 
        } finally { 
            setUploading(false); 
        }
    };
    const deleteImage = async (imgId) => {
        if (!window.confirm('Delete this portfolio item?')) return;
        try {
            await api.delete(`/workers/portfolio/${imgId}`);
            const { data } = await api.get('/workers/profile');
            setImages(data.portfolioImages || []);
        } catch (e) {
            if (import.meta.env.DEV) console.error(e);
        }
    };

    const toggleFeatured = async (imgId) => {
        try {
            const { data } = await api.put(
                `/workers/portfolio/${imgId}/featured`, {}
            );
            setImages(data);
        } catch (e) { 
            if (import.meta.env.DEV) console.error(e); 
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                        My <span className="text-royal-gold">Portfolio</span>
                    </h1>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-bold">
                        Showcase your finest painting work — {images.length} photos
                    </p>
                </div>
            </div>

            {/* Upload Card */}
            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-lg p-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep/40 mb-5">Add New Work Photo</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* File Input */}
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="w-full md:w-48 h-36 border-2 border-dashed border-royal-gold/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-royal-gold/50 hover:bg-royal-gold/3 transition-all group"
                    >
                        {preview ? (
                            <img src={preview} className="w-full h-full object-cover rounded-2xl" alt="Preview" />
                        ) : (
                            <>
                                <FaUpload className="text-2xl text-royal-gold/30 group-hover:text-royal-gold/60 mb-2 transition-colors" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Click to upload</span>
                            </>
                        )}
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} className="hidden" />

                    <div className="flex-1 space-y-4">
                        <input
                            type="text"
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            placeholder="Caption (e.g. Bedroom interior — Chennai)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-navy-deep focus:outline-none focus:border-royal-gold/40 focus:bg-white transition-all placeholder-slate-300"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={uploadImage}
                                disabled={!preview || uploading}
                                className="flex items-center gap-2 px-8 py-3.5 bg-navy-deep text-royal-gold font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-royal-gold hover:text-navy-deep transition-all disabled:opacity-30 shadow-lg"
                            >
                                <FaPlus size={10} /> {uploading ? 'Uploading…' : 'Add to Portfolio'}
                            </button>
                            {preview && (
                                <button onClick={() => { setPreview(null); fileRef.current.value = ''; }}
                                    className="px-5 py-3.5 border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-white rounded-[2rem] animate-pulse border border-slate-50" />)}
                </div>
            ) : images.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-royal-gold/20">
                    <FaImages className="text-4xl text-royal-gold/10 mx-auto mb-4" />
                    <p className="text-navy-deep/30 font-black uppercase tracking-widest text-xs">No portfolio photos yet</p>
                    <p className="text-slate-300 text-[10px] font-bold mt-2">Upload your best painting projects above</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence mode="popLayout">
                        {images.map((img, i) => (
                            <motion.div
                                key={img._id || i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: i * 0.04 }}
                                className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-lg hover:shadow-xl transition-all cursor-pointer"
                                onClick={() => setLightbox(img)}
                            >
                                <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    {img.caption && <p className="text-white text-[10px] font-bold truncate">{img.caption}</p>}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteImage(img._id); }}
                                    className="absolute top-3 right-3 p-2 bg-red-500/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                                    title="Delete Photo"
                                >
                                    <FaTrash size={10} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFeatured(img._id); }}
                                    className={`absolute top-3 right-12 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg ${img.featured ? 'bg-royal-gold text-navy-deep' : 'bg-white/90 text-slate-400 hover:text-royal-gold'}`}
                                    title={img.featured ? "Unfeature" : "Feature on Profile"}
                                >
                                    <FaStar size={10} />
                                </button>
                                {img.featured && (
                                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-royal-gold text-navy-deep text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">
                                        <FaStar size={8} /> Featured Work
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setLightbox(null)}>
                        <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
                            className="relative max-w-3xl w-full max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <img src={lightbox.url} alt={lightbox.caption} className="w-full h-full object-contain" />
                            {lightbox.caption && (
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-navy-deep/80 to-transparent p-6">
                                    <p className="text-white font-bold text-sm">{lightbox.caption}</p>
                                </div>
                            )}
                            <button onClick={() => setLightbox(null)}
                                className="absolute top-4 right-4 p-2.5 bg-white/10 backdrop-blur text-white rounded-xl hover:bg-white/20 transition-all">
                                <FaTimes size={14} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PortfolioPage;

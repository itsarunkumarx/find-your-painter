import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, type = 'danger' }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const accentColor = type === 'danger' ? 'bg-red-500 shadow-red-500/20' : 'bg-orange-500 shadow-orange-500/20';
    const textColor = type === 'danger' ? 'text-red-500' : 'text-orange-500';
    const bgColor = type === 'danger' ? 'bg-red-50' : 'bg-orange-50';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-navy-deep/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-2xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-8 border-b border-royal-gold/5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center ${textColor}`}>
                                <FaExclamationTriangle size={18} />
                            </div>
                            <h2 className="text-lg font-black text-navy-deep uppercase tracking-tighter">{title}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all">
                            <FaTimes size={16} />
                        </button>
                    </div>

                    <div className="p-8">
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    <div className="p-8 bg-ivory-subtle/30 border-t border-royal-gold/5 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-navy-deep transition-all"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-4 ${accentColor} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all`}
                        >
                            {confirmText || t('confirm')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;

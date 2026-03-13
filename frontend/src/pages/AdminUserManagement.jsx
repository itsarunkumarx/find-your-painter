import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaUserSlash, FaUserCheck, FaEnvelope, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const AdminUserManagement = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, blocked, active

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(data);
        } catch (error) {
            console.error('Fetch users failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleBlock = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/block`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (error) {
            console.error('Toggle block failed', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'blocked' && user.isBlocked) ||
            (filter === 'active' && !user.isBlocked);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight uppercase">User <span className="text-royal-gold">Management</span></h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Control and monitor platform access</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-royal-gold/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                {['all', 'active', 'blocked'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-navy-deep text-royal-gold shadow-lg' : 'bg-white text-slate-400 border border-royal-gold/10 hover:border-royal-gold/30'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ivory-subtle/30 border-b border-royal-gold/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">User</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40">Joined</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-navy-deep/40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-royal-gold/5">
                            <AnimatePresence mode="popLayout">
                                {filteredUsers.map((user, i) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-ivory-subtle/20 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                                    className="w-10 h-10 rounded-xl border border-royal-gold/10 grayscale group-hover:grayscale-0 transition-all"
                                                    alt=""
                                                />
                                                <div>
                                                    <p className="text-xs font-black text-navy-deep">{user.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 lowercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                                                }`}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => toggleBlock(user._id)}
                                                className={`p-3 rounded-xl transition-all ${user.isBlocked ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                                title={user.isBlocked ? 'Unblock User' : 'Block User'}
                                            >
                                                {user.isBlocked ? <FaUserCheck size={14} /> : <FaUserSlash size={14} />}
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && !loading && (
                        <div className="py-20 text-center">
                            <FaShieldAlt className="text-4xl text-royal-gold/10 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-navy-deep/20">No users matched your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagement;

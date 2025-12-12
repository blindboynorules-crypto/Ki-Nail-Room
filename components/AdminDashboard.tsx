
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, ShieldCheck, Database, MessageSquare, Plus, Edit2, Save, X, Image as ImageIcon, Loader2, Search, RefreshCw } from 'lucide-react';
import { uploadToCloudinary } from '../services/cloudinaryService';

interface AdminDashboardProps {
  onBack: () => void;
}

interface BotRule {
  id: string;
  keyword: string;
  answer: string;
  imageUrl?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [view, setView] = useState<'menu' | 'bot-manager'>('menu');
  
  // States cho Bot Manager
  const [rules, setRules] = useState<BotRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States cho Form (Thêm/Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BotRule | null>(null);
  const [formData, setFormData] = useState({ keyword: '', answer: '', imageUrl: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC HỆ THỐNG ---
  const handleCleanup = () => {
     window.location.href = '/api/cleanup-images';
  };

  // --- LOGIC BOT MANAGER ---
  const fetchRules = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/bot-manager');
        const data = await res.json();
        if (data.success) {
            setRules(data.records);
        } else {
            alert('Lỗi tải dữ liệu: ' + data.message);
        }
    } catch (error) {
        console.error(error);
        alert('Không kết nối được server');
    } finally {
        setLoading(false);
    }
  };

  // Mở Bot Manager
  useEffect(() => {
      if (view === 'bot-manager') {
          fetchRules();
      }
  }, [view]);

  // Handle Form
  const openCreateModal = () => {
      setEditingRule(null);
      setFormData({ keyword: '', answer: '', imageUrl: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (rule: BotRule) => {
      setEditingRule(rule);
      setFormData({ 
          keyword: rule.keyword, 
          answer: rule.answer, 
          imageUrl: rule.imageUrl || '' 
      });
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm('Bạn có chắc muốn xóa quy tắc này không?')) return;
      
      try {
          const res = await fetch(`/api/bot-manager?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
              setRules(prev => prev.filter(r => r.id !== id));
          } else {
              alert(data.message);
          }
      } catch (e) { alert('Lỗi xóa'); }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.keyword || !formData.answer) return alert('Vui lòng nhập từ khóa và câu trả lời');

      setUploading(true); // Tái sử dụng state loading cho lúc save
      
      try {
          const method = editingRule ? 'PATCH' : 'POST';
          const body: any = { ...formData };
          if (editingRule) body.id = editingRule.id;

          const res = await fetch('/api/bot-manager', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          });
          
          const data = await res.json();
          if (data.success) {
              setIsModalOpen(false);
              fetchRules(); // Reload list
          } else {
              alert(data.message);
          }
      } catch (e) {
          alert('Lỗi lưu dữ liệu');
      } finally {
          setUploading(false);
      }
  };

  // Handle Image Upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setUploading(true);
          try {
              // Đã đổi tên folder thành 'TrainingBot' theo yêu cầu
              const url = await uploadToCloudinary(e.target.files[0], 'TrainingBot');
              if (url) {
                  setFormData(prev => ({ ...prev, imageUrl: url }));
              } else {
                  alert('Upload ảnh thất bại');
              }
          } catch (error) {
              alert('Lỗi upload ảnh');
          } finally {
              setUploading(false);
              // Reset input để chọn lại cùng 1 file được
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const filteredRules = rules.filter(r => 
      r.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-vanilla-50 font-sans text-gray-700 pt-20 pb-10 px-4">
        
        {/* --- VIEW 1: MENU CHÍNH --- */}
        {view === 'menu' && (
             <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-chestnut-50 flex flex-col min-h-[50vh] animate-fade-in">
                {/* Header */}
                <div className="bg-chestnut-600 p-6 flex items-center justify-between shrink-0 z-10 shadow-md">
                    <div>
                        <h1 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8" /> QUẢN TRỊ KI NAIL
                        </h1>
                        <p className="text-chestnut-200 text-xs uppercase tracking-[0.2em] mt-1 font-semibold">
                        Admin Dashboard
                        </p>
                    </div>
                    <button onClick={onBack} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow p-8 bg-vanilla-50/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bot Manager Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setView('bot-manager')}>
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-8 h-8 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">Bot Studio</h2>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            Quản lý kịch bản Chatbot chuyên nghiệp. Thêm từ khóa, câu trả lời và hình ảnh trực tiếp.
                        </p>
                        <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2">
                            <Database className="w-4 h-4" /> Quản Lý Bot
                        </button>
                    </div>

                    {/* Cleanup Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Trash2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">Dọn Dẹp Hệ Thống</h2>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            Quét và xóa các ảnh rác "Báo Giá AI" cũ hơn 3 ngày trên Cloudinary để tiết kiệm dung lượng.
                        </p>
                        <button onClick={handleCleanup} className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                            <Trash2 className="w-4 h-4" /> Quét & Dọn Dẹp
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* --- VIEW 2: BOT STUDIO (INTERFACE) --- */}
        {view === 'bot-manager' && (
            <div className="max-w-5xl mx-auto h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-chestnut-100 overflow-hidden animate-fade-in">
                {/* Studio Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                             <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-purple-600" /> 
                                Bot Studio
                             </h2>
                             <p className="text-xs text-gray-400 font-menu">Quản lý "bộ não" của Ki Nail Room</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="relative hidden md:block">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Tìm từ khóa..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                         </div>
                         <button 
                            onClick={fetchRules} 
                            disabled={loading}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            title="Làm mới"
                         >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                         </button>
                         <button 
                            onClick={openCreateModal}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-purple-200 transition-all active:scale-95 flex items-center gap-2 text-sm"
                         >
                            <Plus className="w-4 h-4" /> <span className="hidden md:inline">Thêm Mới</span>
                         </button>
                    </div>
                </div>

                {/* Content - Rules Grid */}
                <div className="flex-grow overflow-y-auto p-6 bg-vanilla-50/50">
                    {loading && rules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-2" />
                            <p>Đang tải dữ liệu từ Airtable...</p>
                        </div>
                    ) : filteredRules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Database className="w-12 h-12 mb-3 opacity-50" />
                            <p>Chưa có dữ liệu nào. Hãy thêm mới!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRules.map((rule) => (
                                <div key={rule.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                            {rule.keyword}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(rule)} className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600" title="Sửa">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Xóa">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow font-menu">
                                        {rule.answer}
                                    </p>

                                    {rule.imageUrl && (
                                        <div className="mt-auto pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <ImageIcon className="w-3 h-3" />
                                                <span className="truncate max-w-[150px]">Có ảnh đính kèm</span>
                                                <a href={rule.imageUrl} target="_blank" rel="noreferrer" className="ml-auto text-purple-600 hover:underline">Xem</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- MODAL FORM (Create/Edit) --- */}
        {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-float">
                    <div className="bg-purple-600 p-5 flex justify-between items-center text-white">
                        <h3 className="text-lg font-bold font-serif flex items-center gap-2">
                            {editingRule ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            {editingRule ? 'Chỉnh Sửa Kịch Bản' : 'Thêm Kịch Bản Mới'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="hover:bg-purple-700 p-1 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <form onSubmit={handleSave} className="p-6 space-y-5">
                        {/* Keyword */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Từ Khóa (Keyword)</label>
                            <input 
                                type="text" 
                                value={formData.keyword}
                                onChange={e => setFormData({...formData, keyword: e.target.value})}
                                placeholder="VD: PRICE, WIFI, STK..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-gray-700 placeholder-gray-400"
                                autoFocus
                            />
                            <p className="text-[10px] text-gray-400 mt-1">*Khách nhắn tin chứa từ này, Bot sẽ trả lời câu bên dưới.</p>
                        </div>

                        {/* Answer */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Câu Trả Lời</label>
                            <textarea 
                                value={formData.answer}
                                onChange={e => setFormData({...formData, answer: e.target.value})}
                                placeholder="Nhập nội dung tin nhắn Bot sẽ trả lời..."
                                rows={4}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-menu text-gray-700 resize-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hình Ảnh Đính Kèm (Tùy chọn)</label>
                            <div className="flex gap-3 items-center">
                                {formData.imageUrl ? (
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, imageUrl: ''})}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors text-gray-400 hover:text-purple-600"
                                    >
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                                    </div>
                                )}
                                
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                        placeholder="Hoặc dán link ảnh vào đây..."
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs mb-2 focus:outline-none focus:border-purple-500"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-purple-600 font-bold hover:underline flex items-center"
                                        disabled={uploading}
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Tải ảnh lên từ máy
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 text-sm"
                            >
                                Hủy Bỏ
                            </button>
                            <button 
                                type="submit" 
                                disabled={uploading || !formData.keyword || !formData.answer}
                                className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
                                    uploading ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu Kịch Bản
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;

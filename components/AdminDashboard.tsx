
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, ShieldCheck, Database, MessageSquare, Plus, Edit2, Save, X, Image as ImageIcon, Loader2, Search, RefreshCw, Zap, AlertTriangle, AlertCircle } from 'lucide-react';
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
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
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
            console.error("Fetch Error:", data.message);
        }
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  // Nạp dữ liệu mẫu
  const handleSeedData = async () => {
      if (!window.confirm('Hệ thống sẽ nạp 3 kịch bản mẫu (Giá, Địa chỉ, Khuyến mãi) vào bảng BotConfig trên Airtable. Bạn có đồng ý không?')) return;
      
      setLoading(true);
      const defaults = [
          { keyword: 'PRICE', answer: 'Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!', imageUrl: 'https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg' },
          { keyword: 'ADDRESS', answer: 'Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A, Bình Tân ạ.', imageUrl: '' },
          { keyword: 'PROMOTION', answer: 'Dạ hiện tại Ki đang có ưu đãi giảm 10% cho khách đặt lịch trước nha.', imageUrl: '' }
      ];

      try {
          for (const item of defaults) {
              const res = await fetch('/api/bot-manager', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(item)
              });
              
              const data = await res.json();
              if (!res.ok || !data.success) {
                  throw new Error(data.message || `Lỗi khi tạo mục ${item.keyword}`);
              }
          }
          alert('✅ Đã nạp dữ liệu mẫu thành công!');
          fetchRules();
      } catch (e: any) {
          console.error(e);
          alert(`❌ Nạp dữ liệu thất bại: ${e.message}\n\nVui lòng kiểm tra lại cấu hình Airtable.`);
      } finally {
          setLoading(false);
      }
  };

  // Xóa toàn bộ dữ liệu (Dọn dẹp bảng)
  const handleDeleteAll = async () => {
      if (rules.length === 0) return;
      if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa TOÀN BỘ ${rules.length} kịch bản hiện tại không? Hành động này không thể hoàn tác!`)) return;

      setIsDeletingAll(true);
      try {
          // Xóa từng cái một (Airtable API đơn giản)
          for (const rule of rules) {
               await fetch(`/api/bot-manager?id=${rule.id}`, { method: 'DELETE' });
          }
          alert('Đã xóa sạch dữ liệu.');
          setRules([]);
      } catch (e) {
          alert('Có lỗi khi xóa dữ liệu.');
      } finally {
          setIsDeletingAll(false);
          fetchRules();
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

      setUploading(true);
      
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
              fetchRules();
          } else {
              alert(`Lỗi lưu: ${data.message}`);
          }
      } catch (e) {
          alert('Lỗi kết nối Server');
      } finally {
          setUploading(false);
      }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setUploading(true);
          try {
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

        {/* --- VIEW 2: BOT STUDIO --- */}
        {view === 'bot-manager' && (
            <div className="max-w-5xl mx-auto h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-chestnut-100 overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center shrink-0 gap-3">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                             <h2 className="text-xl font-bold text-gray-800 font-serif flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-purple-600" /> 
                                Bot Studio
                             </h2>
                             <p className="text-xs text-gray-400 font-menu">
                                 {rules.length} kịch bản đang hoạt động
                             </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                         {rules.length > 0 && (
                             <button 
                                onClick={handleDeleteAll}
                                disabled={isDeletingAll}
                                className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 border border-red-100 flex items-center gap-1 transition-colors"
                             >
                                 {isDeletingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                 Xóa Hết
                             </button>
                         )}

                         <button 
                            onClick={fetchRules} 
                            disabled={loading}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                         >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                         </button>
                         <button 
                            onClick={openCreateModal}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-purple-200 transition-all active:scale-95 flex items-center gap-2 text-sm whitespace-nowrap"
                         >
                            <Plus className="w-4 h-4" /> Thêm Mới
                         </button>
                    </div>
                </div>

                {/* Search Bar (Mobile only needs margin) */}
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 md:hidden">
                    <input 
                        type="text" 
                        placeholder="Tìm từ khóa..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-vanilla-50/50">
                    {loading && rules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-2" />
                            <p>Đang tải dữ liệu từ Airtable...</p>
                        </div>
                    ) : (
                        <>
                            {/* NÚT NẠP DỮ LIỆU LUÔN HIỂN THỊ NẾU DANH SÁCH < 3 HOẶC TRỐNG */}
                            {(rules.length === 0 || rules.length < 3) && (
                                <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-full">
                                            <Zap className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-purple-900 text-sm">Khởi động nhanh</h4>
                                            <p className="text-xs text-purple-600">Nạp dữ liệu mẫu (Giá, Địa chỉ...) để Bot chạy ngay.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleSeedData}
                                        disabled={loading}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-purple-200 w-full md:w-auto"
                                    >
                                        Nạp Dữ Liệu Mẫu
                                    </button>
                                </div>
                            )}

                            {filteredRules.length === 0 && rules.length > 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Không tìm thấy kết quả nào.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredRules.map((rule) => {
                                        // KIỂM TRA DỮ LIỆU LỖI (Rỗng)
                                        const isBroken = !rule.keyword || !rule.answer || rule.keyword === '' || rule.answer === '';

                                        return (
                                            <div key={rule.id} className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all group flex flex-col ${isBroken ? 'border-red-300 ring-1 ring-red-100 bg-red-50/30' : 'border-gray-100'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    {rule.keyword ? (
                                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                            {rule.keyword}
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> Lỗi: Trống
                                                        </span>
                                                    )}
                                                    
                                                    <div className="flex gap-1">
                                                        <button onClick={() => openEditModal(rule)} className="p-1.5 hover:bg-gray-100 rounded-lg text-blue-600" title="Sửa">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(rule.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Xóa">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {rule.answer ? (
                                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow font-menu">
                                                        {rule.answer}
                                                    </p>
                                                ) : (
                                                    <p className="text-red-400 text-sm italic mb-4 flex-grow flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" /> Dữ liệu câu trả lời bị trống.
                                                    </p>
                                                )}

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
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        )}

        {/* --- MODAL FORM --- */}
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

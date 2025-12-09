
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Bot, Save, Plus, X, Github, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

interface TrainingRule {
  keywords: string[];
  text: string;
  imageUrl?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'cleanup' | 'bot'>('cleanup');
  
  // States for Bot Training
  const [trainingData, setTrainingData] = useState<TrainingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial bot data
  useEffect(() => {
    if (activeTab === 'bot') {
      fetchBotData();
    }
  }, [activeTab]);

  const fetchBotData = async () => {
    setIsLoading(true);
    try {
      // Gọi API để lấy dữ liệu webhook.js hiện tại
      // Lưu ý: Ở đây ta sẽ mock data nếu không kết nối được GitHub API thật
      // trong môi trường local, nhưng sẽ cố gắng lấy từ API nếu có.
      const response = await fetch('/api/bot-config');
      if (response.ok) {
        const data = await response.json();
        if (data.trainingData) {
            setTrainingData(data.trainingData);
        }
      } else {
        // Fallback data nếu API chưa cấu hình
        setErrorMessage('Chưa kết nối được GitHub. Đang hiển thị dữ liệu mẫu.');
        // Set mẫu để không trống
        setTrainingData([
             { keywords: ['giá', 'bảng giá'], text: 'Dạ Ki gửi mình bảng giá ạ...' }
        ]);
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Lỗi tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = () => {
     // Chuyển hướng đến script dọn dẹp cũ
     window.location.href = '/api/cleanup-images';
  };

  const handleAddRule = () => {
    setTrainingData([...trainingData, { keywords: ['từ khóa mới'], text: 'Câu trả lời của Bot...' }]);
  };

  const handleRemoveRule = (index: number) => {
    const newData = [...trainingData];
    newData.splice(index, 1);
    setTrainingData(newData);
  };

  const handleUpdateRule = (index: number, field: keyof TrainingRule, value: any) => {
    const newData = [...trainingData];
    if (field === 'keywords') {
        // Tách chuỗi bằng dấu phẩy
        newData[index].keywords = value.split(',').map((k: string) => k.trim());
    } else {
        newData[index] = { ...newData[index], [field]: value };
    }
    setTrainingData(newData);
  };

  const handleSaveToGitHub = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
        const response = await fetch('/api/bot-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trainingData })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 5000);
        } else {
            setSaveStatus('error');
            setErrorMessage(result.message || 'Lỗi không xác định khi lưu vào GitHub.');
        }
    } catch (e: any) {
        setSaveStatus('error');
        setErrorMessage(e.message || 'Lỗi kết nối.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-vanilla-50 p-4 font-sans text-gray-700 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-chestnut-50">
          
          {/* Header */}
          <div className="bg-chestnut-600 p-6 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
                <Bot className="w-8 h-8" /> QUẢN TRỊ KI NAIL (V2)
                </h1>
                <p className="text-chestnut-200 text-xs uppercase tracking-[0.2em] mt-1 font-semibold">
                Admin Dashboard - Full Control
                </p>
            </div>
            <button 
                onClick={onBack} 
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('cleanup')}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'cleanup' ? 'bg-white text-chestnut-600 border-b-2 border-chestnut-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
                <Trash2 className="w-5 h-5" /> Dọn Dẹp Ảnh
            </button>
            <button 
                onClick={() => setActiveTab('bot')}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'bot' ? 'bg-white text-chestnut-600 border-b-2 border-chestnut-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
                <Bot className="w-5 h-5" /> Training Bot (MỚI)
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8">
            
            {/* TAB 1: CLEANUP */}
            {activeTab === 'cleanup' && (
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6">
                        <Trash2 className="w-10 h-10 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2 font-serif">
                        Dọn Dẹp Ảnh Thừa
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Hệ thống sẽ quét và xóa các ảnh "Báo Giá AI" cũ hơn 3 ngày trên Cloudinary để tiết kiệm dung lượng.
                    </p>
                    <button 
                        onClick={handleCleanup}
                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95"
                    >
                        Bắt Đầu Quét & Dọn Dẹp
                    </button>
                </div>
            )}

            {/* TAB 2: TRAINING BOT */}
            {activeTab === 'bot' && (
                <div>
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                           Danh sách câu trả lời ({trainingData.length})
                        </h2>
                        <button 
                            onClick={handleAddRule}
                            className="bg-chestnut-100 text-chestnut-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-chestnut-200 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Thêm mới
                        </button>
                    </div>

                    {/* Rules List */}
                    {isLoading ? (
                        <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-chestnut-400"/></div>
                    ) : (
                        <div className="space-y-6 mb-8">
                            {trainingData.map((rule, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-200 relative group hover:shadow-md transition-shadow">
                                    <button 
                                        onClick={() => handleRemoveRule(idx)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa mục này"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Từ khóa (Cách nhau bằng dấu phẩy)</label>
                                            <input 
                                                type="text" 
                                                value={rule.keywords.join(', ')}
                                                onChange={(e) => handleUpdateRule(idx, 'keywords', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-chestnut-500 focus:outline-none"
                                                placeholder="VD: giá, bảng giá, bao nhiêu tiền"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Link Ảnh (Không bắt buộc)</label>
                                            <input 
                                                type="text" 
                                                value={rule.imageUrl || ''}
                                                onChange={(e) => handleUpdateRule(idx, 'imageUrl', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-chestnut-500 focus:outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bot trả lời</label>
                                            <textarea 
                                                value={rule.text}
                                                onChange={(e) => handleUpdateRule(idx, 'text', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-chestnut-500 focus:outline-none min-h-[80px]"
                                                placeholder="Nội dung câu trả lời..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                        <div>
                            {saveStatus === 'error' && (
                                <p className="text-xs text-red-500 flex items-center font-bold">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> {errorMessage || 'Lưu thất bại'}
                                </p>
                            )}
                            {saveStatus === 'success' && (
                                <p className="text-xs text-green-600 flex items-center font-bold">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Đã lưu & Đang cập nhật Vercel!
                                </p>
                            )}
                        </div>
                        <button 
                            onClick={handleSaveToGitHub}
                            disabled={isSaving}
                            className={`flex items-center px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all active:scale-95 ${
                                isSaving ? 'bg-gray-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {isSaving ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang Lưu...</>
                            ) : (
                                <><Github className="w-5 h-5 mr-2" /> Save to GitHub</>
                            )}
                        </button>
                    </div>
                </div>
            )}

          </div>
        </div>
    </div>
  );
};

export default AdminDashboard;

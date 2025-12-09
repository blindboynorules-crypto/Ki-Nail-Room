
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Bot, Save, Plus, X, Github, AlertTriangle, CheckCircle, Loader2, Send, User } from 'lucide-react';

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

  // New Rule Input State
  const [newKeywords, setNewKeywords] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial bot data
  useEffect(() => {
    if (activeTab === 'bot') {
      fetchBotData();
    }
  }, [activeTab]);

  useEffect(() => {
    // Auto scroll to bottom when adding new rules
    if (activeTab === 'bot' && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [trainingData, activeTab]);

  const fetchBotData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bot-config');
      if (response.ok) {
        const data = await response.json();
        if (data.trainingData) {
            setTrainingData(data.trainingData);
        }
      } else {
        setErrorMessage('Chưa kết nối được GitHub. Đang hiển thị dữ liệu mẫu.');
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
     window.location.href = '/api/cleanup-images';
  };

  const handleAddRule = () => {
    if (!newKeywords.trim() || !newResponse.trim()) return;

    // Tách từ khóa bằng dấu phẩy
    const keywordsArray = newKeywords.split(',').map(k => k.trim()).filter(k => k);
    
    setTrainingData([...trainingData, { 
        keywords: keywordsArray, 
        text: newResponse 
    }]);

    setNewKeywords('');
    setNewResponse('');
  };

  const handleRemoveRule = (index: number) => {
    if(window.confirm('Bạn có chắc muốn xóa đoạn hội thoại này không?')) {
        const newData = [...trainingData];
        newData.splice(index, 1);
        setTrainingData(newData);
    }
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
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-chestnut-50 flex flex-col h-[85vh]">
          
          {/* Header */}
          <div className="bg-chestnut-600 p-4 md:p-6 flex items-center justify-between shrink-0 z-10 shadow-md">
            <div>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
                <Bot className="w-8 h-8" /> QUẢN TRỊ KI NAIL (V2)
                </h1>
                <p className="text-chestnut-200 text-xs uppercase tracking-[0.2em] mt-1 font-semibold">
                Admin Dashboard
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
          <div className="flex border-b border-gray-100 shrink-0 bg-white z-10">
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
                <Bot className="w-5 h-5" /> Dạy Bot (Chat)
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-grow overflow-hidden flex flex-col bg-vanilla-50/50 relative">
            
            {/* TAB 1: CLEANUP */}
            {activeTab === 'cleanup' && (
                <div className="flex-grow flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6">
                            <Trash2 className="w-12 h-12 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif">
                            Dọn Dẹp Ảnh Thừa
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Hệ thống sẽ quét và xóa các ảnh "Báo Giá AI" cũ hơn 3 ngày để tiết kiệm dung lượng Cloudinary.
                        </p>
                        <button 
                            onClick={handleCleanup}
                            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center mx-auto"
                        >
                            <Trash2 className="w-5 h-5 mr-2" /> Bắt Đầu Quét & Dọn Dẹp
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 2: TRAINING BOT (CHAT STYLE UI) */}
            {activeTab === 'bot' && (
                <div className="flex flex-col h-full">
                    {/* Chat History Area */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <Loader2 className="w-10 h-10 animate-spin text-chestnut-400 mb-2"/>
                                <span className="text-chestnut-400 font-medium">Đang tải dữ liệu...</span>
                            </div>
                        ) : trainingData.length === 0 ? (
                            <div className="text-center text-gray-400 py-20 italic">Chưa có dữ liệu. Hãy dạy Bot câu đầu tiên!</div>
                        ) : (
                            trainingData.map((rule, idx) => (
                                <div key={idx} className="group relative">
                                    {/* Delete Button (On Hover) */}
                                    <button 
                                        onClick={() => handleRemoveRule(idx)}
                                        className="absolute -right-2 top-0 p-1.5 bg-white text-red-400 rounded-full shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-gray-100 hover:bg-red-50"
                                        title="Xóa hội thoại này"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    {/* User Message (Left) */}
                                    <div className="flex items-end justify-start mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mr-2">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl rounded-bl-none shadow-sm max-w-[85%]">
                                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Khách hỏi (Từ khóa)</p>
                                            <p className="text-gray-800 font-medium text-sm leading-relaxed">
                                                {rule.keywords.join(', ')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bot Message (Right) */}
                                    <div className="flex items-end justify-end">
                                        <div className="bg-chestnut-600 text-white px-4 py-2.5 rounded-2xl rounded-br-none shadow-md max-w-[85%]">
                                            <p className="text-xs text-chestnut-200 uppercase font-bold mb-1 text-right">Bot đáp</p>
                                            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                                                {rule.text}
                                            </p>
                                            {rule.imageUrl && (
                                                <div className="mt-2 text-xs bg-black/20 p-1 rounded px-2 truncate">
                                                    📷 Có ảnh đính kèm
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-chestnut-500 flex items-center justify-center shrink-0 ml-2 shadow-sm border border-white">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {/* Space for bottom fixed area */}
                        <div className="h-32"></div>
                    </div>

                    {/* Input Area (Sticky Bottom) */}
                    <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <input 
                                    type="text" 
                                    value={newKeywords}
                                    onChange={(e) => setNewKeywords(e.target.value)}
                                    placeholder="Khách hỏi gì? (VD: giá, menu, ở đâu)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chestnut-500 focus:bg-white transition-colors"
                                />
                            </div>
                            <div>
                                <input 
                                    type="text" 
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                                    placeholder="Bot trả lời sao?"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chestnut-500 focus:bg-white transition-colors"
                                />
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs">
                                {saveStatus === 'error' && <span className="text-red-500 font-bold flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> {errorMessage}</span>}
                                {saveStatus === 'success' && <span className="text-green-600 font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Đã lưu thành công!</span>}
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleAddRule}
                                    disabled={!newKeywords.trim() || !newResponse.trim()}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-bold text-sm transition-colors flex items-center disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4 mr-2" /> Thêm Vào List
                                </button>
                                
                                <button 
                                    onClick={handleSaveToGitHub}
                                    disabled={isSaving}
                                    className={`px-6 py-2 rounded-full font-bold text-white shadow-lg transition-all active:scale-95 flex items-center ${
                                        isSaving ? 'bg-gray-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
                                    Lưu Lên Mạng
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
            )}

          </div>
        </div>
    </div>
  );
};

export default AdminDashboard;

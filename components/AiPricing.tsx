
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, X, Receipt, Bot, Loader2, AlertCircle, AlertTriangle, MessageCircle, Check, Copy, Hand, ArrowRight, ClipboardPaste } from 'lucide-react';
import { analyzeNailImage, isAiAvailable } from '../services/geminiService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { PricingResult } from '../types';

const AiPricing: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAiAvailable()) {
      setApiKeyMissing(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setUploadedImageUrl(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setUploadedImageUrl(null);

    try {
      const [pricingData, cloudUrl] = await Promise.all([
        analyzeNailImage(selectedImage),
        uploadToCloudinary(selectedImage, 'AIPhanTich', ['ai_temp', 'delete_after_3_days'])
      ]);

      setResult(pricingData);
      setUploadedImageUrl(cloudUrl);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Có lỗi khi phân tích ảnh. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setUploadedImageUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSmartSend = async () => {
    if (!result || !uploadedImageUrl) return;
    
    setIsSaving(true);

    try {
      // CẬP NHẬT: Cho phép cả domain vercel.app và domain .com hoạt động chính thức
      const hostname = window.location.hostname;
      const isProduction = hostname.includes('kinailroom.vercel.app') || hostname.includes('kinailroom.com');

      if (!isProduction) {
          alert("Bạn đang ở chế độ Preview (Local). Hệ thống sẽ giả lập thành công mà không lưu vào Airtable.");
          window.open("https://m.me/kinailroom", "_blank");
          setIsSaving(false);
          return;
      }

      const response = await fetch('/api/save-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          totalEstimate: result.totalEstimate,
          items: result.items,
          note: result.note
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Lỗi khi lưu đơn hàng');
      }

      const orderRef = data.recordId;
      console.log("Redirecting to Messenger with Ref:", orderRef);
      window.location.href = `https://m.me/kinailroom?ref=${orderRef}`;

    } catch (err: any) {
      console.error("Smart Send Error:", err);
      alert(`⚠️ Lỗi hệ thống: ${err.message}\n\nĐang mở Messenger thủ công.`);
      window.open("https://m.me/kinailroom", "_blank");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <section id="ai-pricing" className="pt-28 pb-16 md:pt-40 md:pb-24 bg-vanilla-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-chestnut-100 to-vanilla-100 rounded-2xl mb-4 shadow-inner relative">
            <Bot className="h-8 w-8 text-chestnut-600 animate-float" />
            <span className="absolute -top-2 -right-12 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] px-3 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm animate-wiggle">BETA</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-chestnut-700 mb-4 drop-shadow-sm">
            AI Báo Giá Nhanh
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-menu text-lg">
            Tải ảnh mẫu nail bạn thích, AI sẽ phân tích và ước tính chi phí thực hiện tại Ki Nail Room.
          </p>
        </div>

        {/* API Key Warning */}
        {apiKeyMissing && (
            <div className="max-w-3xl mx-auto mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start text-yellow-800 animate-pulse">
                <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 shrink-0" />
                <div>
                    <h4 className="font-bold">Chưa cấu hình API Key</h4>
                    <p className="text-sm mt-1">
                        Tính năng này cần Google Gemini API Key để hoạt động. 
                        Nếu bạn là chủ sở hữu, vui lòng vào Vercel &gt; Settings &gt; Environment Variables và thêm biến <code>API_KEY</code>.
                    </p>
                </div>
            </div>
        )}

        <div className={`transition-all duration-500 ease-in-out ${result ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-start' : 'max-w-xl mx-auto'}`}>
          
          {/* Upload Section */}
          <div className="space-y-6">
            <div 
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all h-[400px] flex flex-col items-center justify-center overflow-hidden bg-white group ${
                previewUrl ? 'border-chestnut-300' : 'border-gray-300 hover:border-chestnut-400 hover:bg-vanilla-50'
              }`}
            >
              {previewUrl ? (
                <>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-contain p-4 z-10" 
                  />
                  <div className="absolute inset-0 bg-chestnut-900/5 z-0"></div>
                  
                  {/* GLASS CLEAR BUTTON */}
                  <button 
                    onClick={handleClear}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all
                               bg-white/60 backdrop-blur-md border border-white/50 shadow-md ring-1 ring-white/50
                               text-gray-500 hover:text-red-500 hover:bg-red-50 hover:scale-110 active:scale-90"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <div 
                  className="cursor-pointer w-full h-full flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:group-hover:-translate-y-2 transition-transform duration-300">
                    <Upload className="h-8 w-8 text-chestnut-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2 font-vn">Tải ảnh mẫu nail lên</h3>
                  <p className="text-gray-500 text-sm font-menu px-8">
                    Chọn ảnh rõ nét để AI nhận diện chính xác nhất các chi tiết charm, vẽ, màu sơn...
                  </p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* GLASS PRIMARY BUTTON */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading || apiKeyMissing}
              className={`w-full py-4 rounded-full font-bold text-lg font-vn transition-all shadow-lg flex items-center justify-center border border-white/20 ring-1 ring-white/20 ring-inset backdrop-blur-md ${
                !selectedImage || apiKeyMissing
                  ? 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                  : isLoading 
                    ? 'bg-chestnut-400/90 text-white cursor-wait'
                    : 'bg-chestnut-600/90 text-white hover:bg-chestnut-700/90 hover:scale-[1.02] active:scale-95 shadow-chestnut-500/40'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-pulse" /> Phân Tích & Báo Giá
                </>
              )}
            </button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start font-menu text-sm border border-red-100 animate-fade-in shadow-sm animate-wiggle">
                <AlertCircle className="h-5 w-5 mr-3 shrink-0 mt-0.5" /> 
                <span className="font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* Result Section */}
          {result && (
            <div className="relative animate-fade-in">
               <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden min-h-[400px] flex flex-col hover:shadow-chestnut-200/50 transition-shadow duration-500">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-chestnut-300 via-vanilla-300 to-chestnut-300"></div>
                  
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-dashed border-gray-200">
                     <div className="flex items-center">
                        <div className="p-2 bg-chestnut-50 rounded-lg mr-3">
                           <Receipt className="h-6 w-6 text-chestnut-600" />
                        </div>
                        <div>
                           <h3 className="font-serif font-bold text-xl text-gray-800">Hóa Đơn Tạm Tính</h3>
                           <p className="text-xs text-gray-400 font-sans tracking-wider uppercase">KI NAIL ROOM ESTIMATE</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('vi-VN')}</p>
                     </div>
                  </div>

                  <div className="flex-grow flex flex-col">
                      <div className="space-y-4 mb-6 flex-grow">
                         {result.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start font-menu text-gray-700 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                               <div className="pr-4">
                                  <p className="font-semibold text-gray-800">{item.item}</p>
                                  <p className="text-xs text-gray-500 italic mt-0.5">{item.reason}</p>
                                </div>
                               <span className="font-bold whitespace-nowrap">{formatCurrency(item.cost)}</span>
                            </div>
                         ))}
                      </div>

                      <div className="border-t-2 border-gray-800 pt-4 mb-6">
                         <div className="flex justify-between items-center text-xl md:text-2xl font-bold text-chestnut-700 font-serif">
                            <span>Tổng Cộng:</span>
                            <span>{formatCurrency(result.totalEstimate)}</span>
                         </div>
                      </div>

                      <div className="bg-vanilla-50 p-4 rounded-xl border border-vanilla-200 mb-4">
                         <p className="text-sm text-chestnut-800 italic font-menu">
                            <span className="font-bold not-italic">AI nhận xét: </span>
                            "{result.note}"
                         </p>
                      </div>

                      {result.totalEstimate > 0 && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center">
                           <p className="text-[11px] md:text-xs text-gray-500 text-center font-sans leading-relaxed mb-3">
                              <span className="font-bold text-red-400 block mb-1 uppercase tracking-wide">Lưu ý quan trọng</span>
                              Đây là báo giá ước tính của AI dựa trên hình ảnh. Giá thực tế có thể thay đổi tùy tình trạng móng. Quý khách vui lòng liên hệ trực tiếp KINAILROOM để được tư vấn và báo giá chính xác hơn.
                           </p>
                           
                           {/* SMART BUTTON SEND TO MESSENGER - GLASSMORPHISM */}
                           <button 
                              onClick={handleSmartSend}
                              disabled={isSaving}
                              className={`w-full flex items-center justify-center px-5 py-3 text-white text-sm font-bold font-vn rounded-full transition-all shadow-md active:scale-95 hover:scale-105 border border-white/20 ring-1 ring-white/20 ring-inset backdrop-blur-md ${
                                  isSaving 
                                  ? 'bg-chestnut-400 cursor-wait'
                                  : 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600 hover:to-blue-700 shadow-blue-200/50'
                              }`}
                           >
                              {isSaving ? (
                                  <>
                                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                      Đang kết nối Facebook...
                                  </>
                              ) : (
                                  <>
                                      <MessageCircle className="w-5 h-5 mr-2" />
                                      <span>Gửi Qua Messenger</span>
                                      <ArrowRight className="w-4 h-4 ml-1" />
                                  </>
                              )}
                           </button>
                           
                           <p className="text-[10px] text-gray-400 mt-2 italic">
                              *Hệ thống sẽ tự động gửi ảnh và báo giá vào hộp thoại chat của bạn.
                           </p>
                        </div>
                      )}
                   </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};

export default AiPricing;

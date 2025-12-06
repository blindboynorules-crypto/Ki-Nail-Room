
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
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  // Change isCopied to a step state: 'initial' | 'copied'
  const [contactStep, setContactStep] = useState<'initial' | 'copied'>('initial');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if API key is loaded on mount
    if (!isAiAvailable()) {
      setApiKeyMissing(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Reset result when new file selected
      setUploadedImageUrl(null);
      setError(null);
      setContactStep('initial');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setUploadedImageUrl(null);
    setContactStep('initial');

    try {
      // Chạy song song: Vừa phân tích AI, vừa upload ảnh lên Cloudinary
      // Điều này giúp tiết kiệm thời gian chờ đợi của khách
      // [UPDATE]: Đưa ảnh vào folder 'AIPhanTich' và gắn thẻ 'temp'
      const [pricingData, cloudUrl] = await Promise.all([
        analyzeNailImage(selectedImage),
        uploadToCloudinary(selectedImage, 'AIPhanTich', ['ai_temp', 'delete_after_3_days'])
      ]);

      setResult(pricingData);
      setUploadedImageUrl(cloudUrl);
      
    } catch (err: any) {
      console.error(err);
      // Display the actual error message from the service
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
    setContactStep('initial');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyAndPrepare = () => {
    if (!result) return;

    const imageUrlText = uploadedImageUrl ? `\n\nMẪU DESIGN CỦA BẠN ĐÃ CHỌN: ${uploadedImageUrl}` : '\n(Khách chưa gửi ảnh)';
    const itemsText = result.items.map(i => `- ${i.item}: ${formatCurrency(i.cost)}`).join('\n');
    
    // Soạn nội dung tin nhắn chi tiết
    const message = `Chào Ki Nail Room, mình muốn làm mẫu này:${imageUrlText}\n\n💰 BÁO GIÁ AI ƯỚC TÍNH: ${formatCurrency(result.totalEstimate)}\n\nChi tiết dịch vụ do AI của KiNail gợi ý:\n${itemsText}\n\nShop kiểm tra và báo giá chính xác giúp mình nhé!`;

    // Copy vào clipboard
    navigator.clipboard.writeText(message).then(() => {
      setContactStep('copied');
    }).catch(() => {
       // Fallback nếu trình duyệt chặn copy
       setContactStep('copied');
    });
  };

  const handleOpenMessenger = () => {
     window.open("https://m.me/kinailroom", "_blank");
     // Reset sau khi mở xong để khách có thể copy lại nếu muốn
     setTimeout(() => setContactStep('initial'), 5000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <section id="ai-pricing" className="pt-28 pb-16 md:pt-40 md:pb-24 bg-vanilla-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-chestnut-100 to-vanilla-100 rounded-2xl mb-4 shadow-inner relative animate-float">
            <Bot className="h-8 w-8 text-chestnut-600" />
            <span className="absolute -top-2 -right-12 bg-orange-600 text-white text-[10px] px-3 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm animate-pulse">v3.8</span>
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
                  <button 
                    onClick={handleClear}
                    className="absolute top-4 right-4 z-20 p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors hover:scale-110 active:scale-90"
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

            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading || apiKeyMissing}
              className={`w-full py-4 rounded-xl font-bold text-lg font-vn transition-all shadow-lg flex items-center justify-center ${
                !selectedImage || apiKeyMissing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isLoading 
                    ? 'bg-chestnut-400 text-white cursor-wait'
                    : 'bg-chestnut-600 text-white hover:bg-chestnut-700 hover:scale-[1.02] active:scale-95'
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

          {/* Result Section - Only visible when result is available */}
          {result && (
            <div className="relative animate-fade-in">
               {/* Receipt UI */}
               <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden min-h-[400px] flex flex-col hover:shadow-chestnut-200/50 transition-shadow duration-500">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-chestnut-300 via-vanilla-300 to-chestnut-300"></div>
                  <div className="absolute -right-16 -top-16 w-32 h-32 bg-vanilla-100 rounded-full blur-3xl opacity-50 animate-pulse-slow"></div>

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

                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center">
                         <p className="text-[11px] md:text-xs text-gray-500 text-center font-sans leading-relaxed mb-3">
                            <span className="font-bold text-red-400 block mb-1 uppercase tracking-wide">Lưu ý quan trọng</span>
                            Đây là báo giá ước tính của AI dựa trên hình ảnh. Giá thực tế có thể thay đổi tùy tình trạng móng. Quý khách vui lòng liên hệ trực tiếp KINAILROOM để được tư vấn và báo giá chính xác hơn.
                         </p>
                         
                         {contactStep === 'initial' ? (
                            <button 
                                onClick={handleCopyAndPrepare}
                                className="w-full flex items-center justify-center px-5 py-3 text-white text-sm font-bold font-vn rounded-full transition-all shadow-md active:scale-95 bg-chestnut-600 hover:bg-chestnut-700 shadow-chestnut-200 hover:scale-105"
                            >
                                <Copy className="w-5 h-5 mr-2" />
                                <span className="mr-1">Gửi Báo Giá cho KiNailRoom</span>
                            </button>
                         ) : (
                            <button 
                                onClick={handleOpenMessenger}
                                className="w-full flex items-center justify-center px-5 py-3 text-white text-sm font-bold font-vn rounded-full transition-all shadow-md active:scale-95 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 animate-pulse"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                <span>Mở Messenger ngay (Đã Copy)</span>
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </button>
                         )}
                         
                         {/* Friendly Paste Instruction */}
                         <div className="mt-3 flex items-start gap-2 bg-vanilla-100 p-3 rounded-xl border border-vanilla-200 w-full animate-pulse-slow">
                            <div className="bg-white p-1 rounded-full shadow-sm shrink-0">
                                <ClipboardPaste className="w-4 h-4 text-chestnut-600" />
                            </div>
                            <p className="text-xs text-chestnut-800 font-menu text-left leading-relaxed">
                               Sau khi bấm nút trên, bạn sẽ được chuyển thẳng qua ứng dụng Messenger. Việc còn lại bạn chỉ cần bấm <span className="font-bold text-chestnut-600 bg-white px-1.5 py-0.5 rounded border border-chestnut-100 shadow-sm mx-0.5">Dán (Paste)</span> nội dung vào ô chat gửi cho Ki Nail là được nha! 🥰
                            </p>
                         </div>
                      </div>
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

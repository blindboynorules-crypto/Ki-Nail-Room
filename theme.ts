
// Đây là nơi quản lý toàn bộ màu sắc của website
// Màu sắc được lưu dưới dạng mã RGB (Red Green Blue) để Tailwind có thể chỉnh độ đậm nhạt (Opacity)

export type ThemeType = 'default' | 'noel' | 'tet';

// 1. Bảng màu mặc định (Hiện tại của Ki Nail Room)
// Tông: Nâu hạt dẻ (Chestnut) + Kem Vanilla
const DEFAULT_THEME = {
  // Chestnut (Màu chủ đạo - Nâu)
  '--c-50': '252 246 245',   // #fcf6f5
  '--c-100': '247 235 233',  // #f7ebe9
  '--c-200': '237 207 202',  // #edcfca
  '--c-300': '224 168 159',  // #e0a89f
  '--c-400': '207 118 102',  // #cf7666
  '--c-500': '150 75 52',    // #964B34 (Màu chính)
  '--c-600': '133 62 42',    // #853e2a
  '--c-700': '111 50 35',    // #6f3223
  '--c-800': '92 42 31',     // #5c2a1f
  '--c-900': '77 35 30',     // #4d231e

  // Vanilla (Màu nền - Kem/Vàng nhạt)
  '--v-50': '251 250 244',   // #fbfaf4
  '--v-100': '247 244 227',  // #f7f4e3
  '--v-200': '241 232 192',  // #f1e8c0
  '--v-300': '233 223 158',  // #E9DF9E
  '--v-400': '224 210 120',  // #e0d278
  '--v-500': '200 178 77',   // #c8b24d
  '--v-900': '117 99 30',    // #75631e
};

// 2. Bảng màu Noel (Rosewood & Misty Rose)
// Style: Luxury, Warm, Romantic
const NOEL_THEME = {
  // --- ROSEWOOD PALETTE (Thay thế cho Chestnut) ---
  // Dùng cho Text chính, Button, Icon
  '--c-50': '255 240 242',   // Hồng phấn rất nhạt
  '--c-100': '255 222 226',  // Misty Rose (Làm nền nhẹ cho các element phụ)
  '--c-200': '253 164 175',  // Hồng đậm hơn xíu
  '--c-300': '251 113 133',  
  '--c-400': '225 29 72',    // Đỏ hồng
  '--c-500': '190 18 60',    // Đỏ Ruby (Dùng cho nút bấm)
  '--c-600': '159 18 57',    // Đỏ sẫm (Hover nút bấm)
  '--c-700': '112 2 15',     // **ROSEWOOD BASE** (#70020F) - Dùng cho Tiêu đề
  '--c-800': '88 4 15',      // Rosewood đậm
  '--c-900': '70 2 10',      // Rosewood đen (Text body)

  // --- MISTY ROSE PALETTE (Thay thế cho Vanilla) ---
  // Dùng cho Background toàn trang, Card
  '--v-50': '255 245 247',   // Misty Rose pha trắng (Nền chính của web) - Tạo cảm giác mềm mại
  '--v-100': '255 222 226',  // **MISTY ROSE BASE** (#FFDEE2) - Nền Card / Menu
  '--v-200': '254 205 211',  // Viền nhẹ
  '--v-300': '253 164 175',  
  '--v-400': '251 113 133',
  '--v-500': '219 39 119',   // Điểm nhấn phụ (Hồng đậm)
  '--v-900': '112 2 15',     // Màu chữ trên nền Misty Rose (Dùng lại Rosewood)
};

// Cấu hình Theme hiện tại đang sử dụng
// Đổi giá trị này thành: 'default' | 'noel' | 'tet'
export const CURRENT_THEME: ThemeType = 'noel';

export const applyTheme = (theme: ThemeType = CURRENT_THEME) => {
  const root = document.documentElement;
  let palette = DEFAULT_THEME;

  if (theme === 'noel') {
    palette = NOEL_THEME;
  }
  // Sau này có thể thêm 'tet', 'halloween'...

  // Gán biến CSS vào thẻ <html>
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

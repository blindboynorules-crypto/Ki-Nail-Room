
// Đây là nơi quản lý toàn bộ màu sắc của website
// Màu sắc được lưu dưới dạng mã RGB (Red Green Blue) để Tailwind có thể chỉnh độ đậm nhạt (Opacity)

export type ThemeType = 'default' | 'noel' | 'tet';

// 1. Bảng màu mặc định (Hiện tại của Ki Nail Room)
const DEFAULT_THEME = {
  // Chestnut (Màu chủ đạo - Nâu)
  '--c-50': '252 246 245',
  '--c-100': '247 235 233',
  '--c-200': '237 207 202',
  '--c-300': '224 168 159',
  '--c-400': '207 118 102',
  '--c-500': '150 75 52',    // #964B34
  '--c-600': '133 62 42',
  '--c-700': '111 50 35',
  '--c-800': '92 42 31',
  '--c-900': '77 35 30',

  // Vanilla (Màu nền - Kem/Vàng nhạt)
  '--v-50': '251 250 244',
  '--v-100': '247 244 227',
  '--v-200': '241 232 192',
  '--v-300': '233 223 158',
  '--v-400': '224 210 120',
  '--v-500': '200 178 77',
  '--v-900': '117 99 30',
};

// 2. Bảng màu Noel
const NOEL_THEME = {
  '--c-50': '255 240 242',
  '--c-100': '255 222 226',
  '--c-200': '253 164 175',
  '--c-300': '251 113 133',
  '--c-400': '225 29 72',
  '--c-500': '190 18 60',
  '--c-600': '159 18 57',
  '--c-700': '112 2 15',
  '--c-800': '88 4 15',
  '--c-900': '70 2 10',

  '--v-50': '255 245 247',
  '--v-100': '255 222 226',
  '--v-200': '254 205 211',
  '--v-300': '253 164 175',
  '--v-400': '251 113 133',
  '--v-500': '219 39 119',
  '--v-900': '112 2 15',
};

// 3. Bảng màu TẾT 2026 (Red & Cream Gold)
// Style: May mắn, Sang trọng, Ấm cúng
const TET_THEME = {
  // --- TET RED PALETTE (Thay thế cho Chestnut) ---
  // Dùng cho Text chính, Button, Icon
  '--c-50': '254 242 242',   // Đỏ pha trắng cực nhạt
  '--c-100': '254 226 226',  // Nền đỏ nhạt
  '--c-200': '254 202 202',
  '--c-300': '252 165 165',
  '--c-400': '248 113 113',
  '--c-500': '185 28 28',    // **TET RED** (Đỏ Đô/Đỏ Máu) - Màu chủ đạo (#B91C1C)
  '--c-600': '153 27 27',    // Đỏ đậm hơn (Hover)
  '--c-700': '127 29 29',    // Đỏ thẫm
  '--c-800': '153 27 27',
  '--c-900': '69 10 10',     // Đỏ đen (Text body)

  // --- TET CREAM/GOLD PALETTE (Thay thế cho Vanilla) ---
  // Dùng cho Background toàn trang, Card - Tạo cảm giác giấy điệp, vàng son
  '--v-50': '255 251 235',   // Kem vàng ấm (Nền chính)
  '--v-100': '254 243 199',  // Vàng nhạt (Nền Card)
  '--v-200': '253 230 138',  // Vàng thư
  '--v-300': '252 211 77',   // Vàng mai
  '--v-400': '250 204 21',   // Vàng đồng
  '--v-500': '234 179 8',    // Vàng đậm
  '--v-900': '113 63 18',    // Nâu đất (Text phụ)
};

// Cấu hình Theme hiện tại đang sử dụng
// Đổi giá trị này thành: 'default' | 'noel' | 'tet'
export const CURRENT_THEME: ThemeType = 'tet';

export const applyTheme = (theme: ThemeType = CURRENT_THEME) => {
  const root = document.documentElement;
  let palette = DEFAULT_THEME;

  if (theme === 'noel') {
    palette = NOEL_THEME;
  } else if (theme === 'tet') {
    palette = TET_THEME;
  }

  // Gán biến CSS vào thẻ <html>
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

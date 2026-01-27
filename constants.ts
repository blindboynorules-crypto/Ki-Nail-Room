
import { ServiceCategory, Testimonial } from './types';

export const SERVICE_MENU: ServiceCategory[] = [
  {
    id: 'care_removal',
    title: 'Cắt Sơn & Chăm Sóc',
    items: [
      { id: 'c1', name: 'Sửa móng, cắt da', price: '40.000₫', duration: '' },
      { id: 'c2', name: 'Phá sơn gel', price: '30.000₫', duration: '' },
      { id: 'c3', name: 'Tháo móng giả', price: '40.000₫', duration: '' },
      { id: 'c4', name: 'Sơn gel', price: '100.000₫', duration: '' },
      { id: 'c5', name: 'Sơn mắt mèo', price: '160.000₫', duration: '' },
      { id: 'c6', name: 'Sơn hiệu ứng (mắt mèo/tráng gương nền thạch)', price: '180.000₫', duration: '' },
    ]
  },
  {
    id: 'polish_extension',
    title: 'Nối Móng & Gel',
    items: [
      { id: 'p1', name: 'Gắn móng up keo', price: '95.000₫', duration: '' },
      { id: 'p2', name: 'Gắn móng up base', price: '150.000₫', duration: '' },
      { id: 'p3', name: 'Sơn cứng móng', price: '30 - 45.000₫', duration: '' },
      { id: 'p4', name: 'Phủ gel móng thật', price: '60.000₫', duration: '' },
      { id: 'p5', name: 'Fill móng up', price: '80.000₫', duration: '' },
      { id: 'p6', name: 'Fill gel', price: '130.000₫', duration: '' },
      { id: 'p7', name: 'Đắp gel', price: '240.000₫', duration: '' },
    ]
  },
  {
    id: 'design',
    title: 'Trang Trí & Design',
    items: [
      { id: 'd1', name: 'Vẽ gel', price: '10 - 35.000₫/ngón', duration: '' },
      { id: 'd2', name: 'Vẽ nổi', price: '15 - 40.000₫/ngón', duration: '' },
      { id: 'd3', name: 'Mắt mèo, sticker', price: '10.000₫/ngón', duration: '' },
      { id: 'd4', name: 'Ombre, french, tráng gương', price: '10.000₫/ngón', duration: '' },
      { id: 'd5', name: 'Loang, hoa khô, xà cừ', price: '15 - 30.000₫/ngón', duration: '' },
      { id: 'd6', name: 'Đá nhỏ, phụ kiện nhỏ', price: '5 - 20.000₫/ngón', duration: '' },
      { id: 'd7', name: 'Đá lớn, phụ kiện lớn', price: '25 - 40.000₫/ngón', duration: '' },
    ]
  },
  {
    id: 'spa_care',
    title: 'Dịch Vụ Khác',
    items: [
      { id: 's1', name: 'Chà gót chân', price: 'Liện hệ', duration: '' }
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Lan Phương", comment: "Dịch vụ tuyệt vời, nhân viên rất nhẹ nhàng và kỹ tính. Màu sơn gel giữ được rất lâu!", rating: 5 },
  { id: 2, name: "Minh Anh", comment: "Không gian tiệm xinh xắn, sạch sẽ. Mình rất thích cách tư vấn mẫu nail ở đây.", rating: 5 },
  { id: 3, name: "Thảo Vy", comment: "Giá cả hợp lý so với chất lượng. Sẽ quay lại ủng hộ tiệm dài dài.", rating: 4 },
];

// Danh sách ảnh cho mục Thư Viện (3D Carousel)
export const GALLERY_IMAGES = [
  "https://drive.google.com/file/d/1xuBeF9qvjU0GOyqUFLbHoovHiSrWpIES/view?usp=drive_link",
  "https://drive.google.com/file/d/1MA-Jt2lvvXO5gkV43SpHxWpK7YpEmNYs/view?usp=drive_link",
  "https://drive.google.com/file/d/1o3f6AnOTuBYwpSVyct3W0jx0EaH1SWsr/view?usp=drive_link",
  "https://drive.google.com/file/d/1NqbQ62rM_h44zX30R7KdqyQ-5SxxrhCm/view?usp=drive_link",
  "https://drive.google.com/file/d/1zB7ATU7gDq3qxFXAoA7iQC0xyVNvqHEY/view?usp=drive_link",
  "https://drive.google.com/file/d/1wOU6c69eJEz9s6op9EbKcM8xzDZtyAKY/view?usp=drive_link",
  "https://drive.google.com/file/d/1b7-7sDCh-rlW8luSR0N8DlRon0_mvMtR/view?usp=drive_link",
  "https://drive.google.com/file/d/1KI6jBUxvWa5QBv4_wg8M9vuu_cNSTldi/view?usp=drive_link",
  "https://drive.google.com/file/d/10Gm6a6u-ac0Jt_yWY_2Re6fHVIk520We/view?usp=drive_link",
  "https://drive.google.com/file/d/1KURH1odyouvU2Jh-dVJ7YhAIJMUJLxIe/view?usp=drive_link",
  "https://drive.google.com/file/d/1gS5wuHzMyPz4392AlkgaNdnSvA2yc-9U/view?usp=sharing",
];

// Danh sách ảnh cho Carousel lướt ngang ở phần Dịch Vụ
export const SERVICE_SHOWCASE_IMAGES = [
  "https://drive.google.com/file/d/1OZStHoRM7VX57CJd6D78YdEIp1x8J4ds/view?usp=drive_link",
"https://drive.google.com/file/d/1pJlXBjnLOh_dXLy1tH7B0-eLuFUrUeKG/view?usp=drive_link",
"https://drive.google.com/file/d/1x0CmoxhPeqS_pHcgwjRD1jqV86-QzDP2/view?usp=drive_link",
"https://drive.google.com/file/d/1wRxt6sgceT5jdzcGsfgv0mTVfOM3DKTo/view?usp=drive_link",
"https://drive.google.com/file/d/15sCJXfCyRmslIoF8rMSMWS1kQjkOqcfM/view?usp=drive_link",
"https://drive.google.com/file/d/1lggbigwRD45bl-Er2gal1iFeGTR-bTaz/view?usp=drive_link",
"https://drive.google.com/file/d/1luCdEoZLJm0au2b9o5Cyesjs-NjiV1YO/view?usp=drive_link",
"https://drive.google.com/file/d/1k96jj3Gav_URRIWykLlk5ojAurJ6F9DQ/view?usp=drive_link",
"https://drive.google.com/file/d/13VCuoTnWwXTS-c-rvnbP2IjbqmYGt2uF/view?usp=drive_link",
"https://drive.google.com/file/d/19UiaYYRRKpzv7x2qLYv6rAgNkDIAjcZh/view?usp=drive_link",
];

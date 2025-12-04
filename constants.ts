import { ServiceCategory, Testimonial } from './types';

export const SERVICE_MENU: ServiceCategory[] = [
  {
    id: 'care_removal',
    title: 'Chăm Sóc & Phá Móng',
    items: [
      { id: 'c1', name: 'Cắt da, sửa móng tay', price: '30.000₫', duration: '' },
      { id: 'c2', name: 'Cắt da, lấy khóe chân', price: '40.000₫', duration: '' },
      { id: 'c4', name: 'Dán nailbox', price: '30.000₫', duration: '' },
      { id: 'c5', name: 'Phá sơn gel', price: '20.000₫', duration: '' },
      { id: 'c6', name: 'Phá móng up, gel cứng', price: '30 - 50.000₫', duration: '' },
    ]
  },
  {
    id: 'polish_extension',
    title: 'Sơn & Nối Móng',
    items: [
      { id: 'p1', name: 'Sơn gel / Sơn thạch', price: '80.000₫', duration: '' },
      { id: 'p2', name: 'Sơn cứng móng', price: '25 - 30.000₫', duration: '' },
      { id: 'p3', name: 'Phủ gel / bột dày móng', price: '50.000₫', duration: '' },
      { id: 'p4', name: 'Up móng keo', price: '80.000₫', duration: '' },
      { id: 'p5', name: 'Up móng base', price: '120.000₫', duration: '' },
      { id: 'p6', name: 'Nối móng đắp gel', price: '200.000₫', duration: '' },
      { id: 'p7', name: 'Nối móng phủ bột', price: '200.000₫', duration: '' },
      { id: 'p8', name: 'Fill móng up', price: '50.000₫', duration: '' },
      { id: 'p9', name: 'Fill gel/ bột', price: '100.000₫', duration: '' },
    ]
  },
  {
    id: 'design',
    title: 'Design & Phụ Kiện',
    items: [
      { id: 'd1', name: 'Vẽ gel', price: '5 - 30.000₫', duration: '' },
      { id: 'd2', name: 'Vẽ gel nổi', price: '10 - 30.000₫', duration: '' },
      { id: 'd3', name: 'Mắt mèo, sticker', price: '5 - 10.000₫', duration: '' },
      { id: 'd4', name: 'Ombre, french, tráng gương', price: '5 - 15.000₫', duration: '' },
      { id: 'd5', name: 'Marble, hoa khô, xà cừ', price: '10 - 30.000₫', duration: '' },
      { id: 'd6', name: 'Đá nhỏ, phụ kiện nhỏ', price: '2 - 15.000₫', duration: '' },
      { id: 'd7', name: 'Đá lớn, phụ kiện lớn', price: '15 - 35.000₫', duration: '' },
    ]
  },
  {
    id: 'spa_care',
    title: 'Chăm Sóc Khác',
    items: [
      { id: 's1', name: 'Ngâm Chân Chà Gót', price: '80.000₫', duration: '' }
    ]
  }
];

export const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Lan Phương", comment: "Dịch vụ tuyệt vời, nhân viên rất nhẹ nhàng và kỹ tính. Màu sơn gel giữ được rất lâu!", rating: 5 },
  { id: 2, name: "Minh Anh", comment: "Không gian tiệm xinh xắn, sạch sẽ. Mình rất thích cách tư vấn mẫu nail ở đây.", rating: 5 },
  { id: 3, name: "Thảo Vy", comment: "Giá cả hợp lý so với chất lượng. Sẽ quay lại ủng hộ tiệm dài dài.", rating: 4 },
];

// Dán danh sách link ảnh Google Drive của bạn vào đây
export const GALLERY_IMAGES = [
  "https://drive.google.com/file/d/1xuBeF9qvjU0GOyqUFLbHoovHiSrWpIES/view?usp=drive_link", // Ảnh mẫu 1
  "https://drive.google.com/file/d/1MA-Jt2lvvXO5gkV43SpHxWpK7YpEmNYs/view?usp=drive_link",    // Ảnh mẫu 2
  // Thêm link ảnh của bạn vào dưới dòng này, nhớ đặt trong dấu ngoặc kép "" và có dấu phẩy , ở cuối
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
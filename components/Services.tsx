import React from 'react';
import { SERVICE_MENU } from '../constants';
import { Sparkles } from 'lucide-react';

const Services: React.FC = () => {
  return (
    <section id="services" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl font-script text-chestnut-700 mb-4 drop-shadow-sm">Bảng Giá Dịch Vụ</h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-menu">
            Ki Nail Room cam kết sử dụng các sản phẩm chất lượng cao để bảo vệ móng của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICE_MENU.map((category) => (
            <div key={category.id} className="bg-vanilla-50 rounded-2xl p-6 border border-vanilla-200 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
              <h3 className="text-2xl md:text-3xl font-script font-bold text-chestnut-600 mb-6 border-b-2 border-chestnut-200 pb-3 inline-block text-center">
                {category.title}
              </h3>
              <ul className="space-y-4 flex-grow">
                {category.items.map((item) => (
                  <li key={item.id} className="flex justify-between items-baseline group border-b border-dashed border-gray-200 pb-2 last:border-0 last:pb-0 font-menu">
                    <div className="pr-2 flex items-center">
                      <Sparkles className="h-3 w-3 text-chestnut-300 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      <span className="font-semibold text-gray-700 group-hover:text-chestnut-600 transition-colors text-sm md:text-base">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-chestnut-600 text-sm md:text-base whitespace-nowrap ml-2">
                      {item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
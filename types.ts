export interface ServiceItem {
  id: string;
  name: string;
  price: string;
  duration: string;
  description?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  items: ServiceItem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Testimonial {
  id: number;
  name: string;
  comment: string;
  rating: number;
}

// Pricing AI Types
export interface PriceLineItem {
  item: string;
  cost: number;
  reason: string; // Giải thích ngắn gọn (VD: 2 ngón x 10k)
}

export interface PricingResult {
  items: PriceLineItem[];
  totalEstimate: number;
  note: string;
}
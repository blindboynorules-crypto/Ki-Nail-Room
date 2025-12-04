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
import { Review } from './review.interface';

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  sizes: string[];
  price: number;
  discount: number;
  final_price: number;
  images: string[];
  is_active: boolean;
  is_new: boolean;
  created_at?: string;
  reviews?: Review[];
}

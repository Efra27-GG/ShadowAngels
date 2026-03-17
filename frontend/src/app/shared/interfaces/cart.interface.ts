export interface CartItem {
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  final_price: number;
  quantity: number;
}

export interface Cart {
  _id?: string;
  user_id?: string;
  status?: 'draft' | 'pending' | 'confirmed' | 'rejected';
  items: CartItem[];
  request_id?: string | null;
  request_channel?: 'whatsapp' | 'instagram' | null;
  requested_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

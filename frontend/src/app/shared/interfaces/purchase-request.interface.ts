export interface PurchaseRequest {
  _id: string;
  user_id?: string | null;
  user_name: string;
  user_email?: string;
  is_guest?: boolean;
  guest_contact?: string;
  request_type?: 'single' | 'cart';
  product_id?: string;
  product_name?: string;
  selected_size?: string;
  items?: Array<{
    product_id: string;
    product_name: string;
    selected_size?: string;
    product_image?: string;
    price?: number;
    final_price?: number;
    quantity: number;
  }>;
  channel: 'whatsapp' | 'instagram';
  status: 'pending' | 'confirmed' | 'rejected';
  admin_note?: string;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
}

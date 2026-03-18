export interface Review {
  _id: string;
  product_id?: string;
  product_name?: string;
  product_image?: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  _id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
}

export interface NotificationRelatedItem {
  product_id?: string | null;
  product_name: string;
  selected_size?: string;
  quantity: number;
}

export interface NotificationItem {
  _id: string;
  title: string;
  summary: string;
  content: string;
  image?: string;
  target_type?: 'product' | 'cart' | null;
  target_id?: string | null;
  related_items?: NotificationRelatedItem[];
  status: 'draft' | 'scheduled' | 'published';
  scheduled_for?: string | null;
  published_at?: string | null;
  created_at: string;
}

export interface UserNotification {
  _id: string;
  is_deleted?: boolean;
  is_read?: boolean;
  assigned_at?: string;
  notification: NotificationItem;
}

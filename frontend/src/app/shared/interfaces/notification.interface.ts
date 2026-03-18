export interface NotificationItem {
  _id: string;
  title: string;
  summary: string;
  content: string;
  image?: string;
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

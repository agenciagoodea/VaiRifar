export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'organizer' | 'customer';
  avatar_url?: string;
  phone?: string;
}

export interface Campaign {
  id: number;
  organizer_id: string;
  title: string;
  description: string;
  slug: string;
  image_url: string;
  ticket_price: number;
  total_tickets: number;
  draw_date: string;
  status: 'active' | 'paused' | 'finished' | 'pending';
  draw_type: 'internal' | 'federal';
  created_at: string;
  sold_count: number;
  display_mode: 'random' | 'exposed' | 'both';
  min_tickets: number;
  max_tickets: number | null;
  reservation_expiry: string;
  regulation: string | null;
}

export interface Order {
  id: number;
  campaign_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  payment_method: 'pix' | 'credit_card';
  created_at: string;
}

export interface Ticket {
  id: number;
  campaign_id: number;
  order_id?: number;
  number: number;
  status: 'available' | 'reserved' | 'paid';
  reserved_at?: string;
}

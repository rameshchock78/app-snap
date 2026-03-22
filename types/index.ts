export type Role = 'coach' | 'manager' | 'player' | 'parent';
export type EventType = 'game' | 'practice' | 'meeting' | 'other';
export type RsvpStatus = 'yes' | 'no' | 'maybe';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  sport: string;
  season?: string;
  age_group?: string;
  invite_code: string;
  logo_url?: string;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: Role;
  jersey_number?: string;
  position?: string;
  joined_at: string;
  profile?: Profile;
}

export interface Event {
  id: string;
  team_id: string;
  title: string;
  type: EventType;
  start_time: string;
  end_time?: string;
  location?: string;
  notes?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_by: string;
  created_at: string;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  note?: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface MessageThread {
  id: string;
  team_id: string;
  type: 'team' | 'direct' | 'announcement';
  name?: string;
  participants?: string[];
  created_at: string;
}

export interface Invoice {
  id: string;
  team_id: string;
  user_id: string;
  amount: number;
  description: string;
  due_date: string;
  status: PaymentStatus;
  stripe_payment_intent_id?: string;
  created_at: string;
}

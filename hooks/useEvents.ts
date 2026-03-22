import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { Event, EventAttendance, EventType, RsvpStatus } from '../types';

export interface EventAttendanceWithProfile extends EventAttendance {
  profile?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

export interface CreateEventInput {
  team_id: string;
  title: string;
  type: EventType;
  start_time: string;
  end_time?: string;
  location?: string;
  notes?: string;
  is_recurring?: boolean;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
}

export function useTeamEvents(teamId?: string) {
  return useQuery({
    queryKey: ['events', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('team_id', teamId!)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Event[];
    },
  });
}

export function useEventAttendances(eventId?: string) {
  return useQuery({
    queryKey: ['event_attendances', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendances')
        .select('*, profile:profiles(id, full_name, avatar_url, email)')
        .eq('event_id', eventId!);
      if (error) throw error;
      return (data ?? []) as EventAttendanceWithProfile[];
    },
  });
}

export function useCreateEvent() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data, error } = await supabase
        .from('events')
        .insert({ ...input, created_by: user!.id, is_recurring: input.is_recurring ?? false })
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: ['events', event.team_id] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateEventInput) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Event;
    },
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: ['events', event.team_id] });
      qc.invalidateQueries({ queryKey: ['event', event.id] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      return { id, teamId };
    },
    onSuccess: ({ teamId }) => {
      qc.invalidateQueries({ queryKey: ['events', teamId] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

export function useUpsertRsvp() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, status, note }: { eventId: string; status: RsvpStatus; note?: string }) => {
      const { data, error } = await supabase
        .from('event_attendances')
        .upsert(
          { event_id: eventId, user_id: user!.id, status, note, updated_at: new Date().toISOString() },
          { onConflict: 'event_id,user_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data as EventAttendance;
    },
    onSuccess: (attendance) => {
      qc.invalidateQueries({ queryKey: ['event_attendances', attendance.event_id] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

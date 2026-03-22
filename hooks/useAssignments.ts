import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Event, Profile } from '../types';

export interface Assignment {
  id: string;
  team_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_by: string | null;
  created_at: string;
  assignee?: Profile;
  event?: Event;
}

export function useTeamAssignments(teamId?: string) {
  return useQuery({
    queryKey: ['assignments', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, assignee:profiles!assigned_to(*), event:events(*)')
        .eq('team_id', teamId!)
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      team_id: string;
      title: string;
      description?: string;
      assigned_to?: string;
      event_id?: string;
      due_date?: string;
      created_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert(input)
        .select('*, assignee:profiles!assigned_to(*), event:events(*)')
        .single();
      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

export function useToggleAssignment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('assignments')
        .update({ is_completed })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Event } from '../types';

export interface GameStat {
  id: string;
  event_id: string;
  team_id: string;
  home_score: number;
  away_score: number;
  opponent: string | null;
  is_live: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  event?: Event;
}

export function useGameStats(teamId?: string) {
  return useQuery({
    queryKey: ['game_stats', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*, event:events(*)')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GameStat[];
    },
  });
}

export function useGameStat(gameId?: string) {
  return useQuery({
    queryKey: ['game_stat', gameId],
    enabled: !!gameId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*, event:events(*)')
        .eq('id', gameId!)
        .single();
      if (error) throw error;
      return data as GameStat;
    },
  });
}

export function useCreateGameStat() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      event_id: string;
      team_id: string;
      home_score?: number;
      away_score?: number;
      opponent?: string;
      is_live?: boolean;
      notes?: string;
      created_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('game_stats')
        .insert(input)
        .select('*, event:events(*)')
        .single();
      if (error) throw error;
      return data as GameStat;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['game_stats'] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

export function useUpdateScore() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      home_score?: number;
      away_score?: number;
      is_live?: boolean;
      opponent?: string;
      notes?: string;
    }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('game_stats')
        .update(updates)
        .eq('id', id)
        .select('*, event:events(*)')
        .single();
      if (error) throw error;
      return data as GameStat;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['game_stats'] });
      qc.invalidateQueries({ queryKey: ['game_stat', data.id] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

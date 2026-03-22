import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { useTeamStore } from '../store/team';
import { Team, TeamMember } from '../types';

export function useMyTeams() {
  const { user } = useAuthStore();
  const { setTeams, setActiveTeam, activeTeam } = useTeamStore();

  return useQuery({
    queryKey: ['teams', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('team:teams(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      const teams = (data ?? []).map((row: any) => row.team as Team).filter(Boolean);
      setTeams(teams);
      if (!activeTeam && teams.length > 0) setActiveTeam(teams[0]);
      return teams;
    },
  });
}

export function useTeamMembers(teamId?: string) {
  const { setMembers } = useTeamStore();

  return useQuery({
    queryKey: ['team_members', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, profile:profiles(*)')
        .eq('team_id', teamId!);
      if (error) throw error;
      const members = (data ?? []) as TeamMember[];
      setMembers(members);
      return members;
    },
  });
}

export function useCreateTeam() {
  const { user } = useAuthStore();
  const { setActiveTeam } = useTeamStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; sport: string; season?: string; age_group?: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ ...input, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('team_members').insert({
        team_id: data.id,
        user_id: user!.id,
        role: 'coach',
      });

      return data as Team;
    },
    onSuccess: (team) => {
      setActiveTeam(team);
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });
}

export function useJoinTeam() {
  const { user } = useAuthStore();
  const { setActiveTeam } = useTeamStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .select()
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();
      if (teamErr || !team) throw new Error('Invalid invite code. Please check and try again.');

      const { error: memberErr } = await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user!.id,
        role: 'player',
      });
      if (memberErr && memberErr.code !== '23505') throw memberErr;

      return team as Team;
    },
    onSuccess: (team) => {
      setActiveTeam(team);
      qc.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: TeamMember['role'] }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: (_, { memberId }) => {
      qc.invalidateQueries({ queryKey: ['team_members'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });
}

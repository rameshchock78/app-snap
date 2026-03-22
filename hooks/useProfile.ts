import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { Profile } from '../types';

export function useProfile() {
  const { user, setProfile } = useAuthStore();

  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const { user, setProfile } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (profile) => {
      setProfile(profile);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });
}

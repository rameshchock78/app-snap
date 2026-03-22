import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Invoice, PaymentStatus } from '../types';

interface InvoiceWithProfile extends Invoice {
  profile?: { full_name: string; email: string };
}

export function useTeamInvoices(teamId?: string) {
  return useQuery({
    queryKey: ['invoices', 'team', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, profile:profiles(full_name, email)')
        .eq('team_id', teamId!)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as InvoiceWithProfile[];
    },
  });
}

export function useMyInvoices(teamId?: string, userId?: string) {
  return useQuery({
    queryKey: ['invoices', 'my', teamId, userId],
    enabled: !!teamId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('team_id', teamId!)
        .eq('user_id', userId!)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      team_id: string;
      user_id: string;
      amount: number;
      description: string;
      due_date: string;
      status?: PaymentStatus;
    }) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert({ ...input, status: input.status ?? 'pending' })
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });
}

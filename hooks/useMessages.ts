import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { Message, MessageThread } from '../types';

export type ThreadWithPreview = MessageThread & { lastMessage?: Message };

export function useThreads(teamId?: string) {
  return useQuery<ThreadWithPreview[]>({
    queryKey: ['threads', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data: threads, error: tErr } = await supabase
        .from('message_threads')
        .select('*')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: true });
      if (tErr) throw tErr;
      if (!threads?.length) return [];

      const { data: messages, error: mErr } = await supabase
        .from('messages')
        .select('*, sender:profiles(full_name)')
        .in('thread_id', threads.map((t) => t.id))
        .order('created_at', { ascending: false })
        .limit(50);
      if (mErr) throw mErr;

      const lastMsgMap = new Map<string, Message>();
      (messages ?? []).forEach((msg) => {
        if (!lastMsgMap.has(msg.thread_id)) {
          lastMsgMap.set(msg.thread_id, msg as Message);
        }
      });

      return threads.map((t) => ({
        ...t,
        lastMessage: lastMsgMap.get(t.id),
      })) as ThreadWithPreview[];
    },
  });
}

export function useMessages(threadId?: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('thread_id', threadId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

export function useEnsureTeamThread(teamId?: string) {
  return useQuery<string>({
    queryKey: ['thread_team', teamId],
    enabled: !!teamId,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('message_threads')
        .select('id')
        .eq('team_id', teamId!)
        .eq('type', 'team')
        .maybeSingle();

      if (existing) return existing.id as string;

      const { data: created, error } = await supabase
        .from('message_threads')
        .insert({ team_id: teamId!, type: 'team', name: 'Team Chat' })
        .select('id')
        .single();
      if (error) throw error;
      return created.id as string;
    },
  });
}

export function useSendMessage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const { error } = await supabase.from('messages').insert({
        thread_id: threadId,
        sender_id: user!.id,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: (_, { threadId }) => {
      qc.invalidateQueries({ queryKey: ['messages', threadId] });
      // Invalidate all threads queries to refresh last-message previews
      qc.invalidateQueries({ queryKey: ['threads'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });
}

export function useRealtimeMessages(
  threadId: string | null,
  onNewMessage: (msg: Message) => void,
) {
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel('messages:' + threadId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'thread_id=eq.' + threadId,
        },
        (payload) => {
          callbackRef.current(payload.new as Message);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);
}

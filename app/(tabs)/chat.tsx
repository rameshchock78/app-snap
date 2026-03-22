import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useEnsureTeamThread, useThreads, ThreadWithPreview } from '../../hooks/useMessages';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';

const THREAD_ICONS: Record<string, string> = {
  team: '💬',
  announcement: '📣',
  direct: '👤',
};

function formatTimestamp(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ThreadRow({ thread }: { thread: ThreadWithPreview }) {
  const router = useRouter();
  const displayName = thread.name ?? (thread.type === 'team' ? 'Team Chat' : 'Chat');
  const icon = THREAD_ICONS[thread.type] ?? '💬';
  const preview = thread.lastMessage?.content;
  const senderName = (thread.lastMessage?.sender as any)?.full_name;
  const timestamp = thread.lastMessage?.created_at;

  const handlePress = () => {
    router.push({
      pathname: '/chat/[threadId]',
      params: { threadId: thread.id, name: displayName },
    });
  };

  return (
    <Pressable style={styles.threadRow} onPress={handlePress}>
      <View style={styles.iconContainer}>
        <Text style={styles.threadIcon}>{icon}</Text>
      </View>
      <View style={styles.threadInfo}>
        <View style={styles.threadHeader}>
          <Text style={styles.threadName} numberOfLines={1}>{displayName}</Text>
          {timestamp && (
            <Text style={styles.threadTime}>{formatTimestamp(timestamp)}</Text>
          )}
        </View>
        {preview ? (
          <Text style={styles.threadPreview} numberOfLines={1}>
            {senderName ? `${senderName}: ` : ''}{preview}
          </Text>
        ) : (
          <Text style={styles.threadPreviewEmpty}>No messages yet</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function ChatScreen() {
  const { activeTeam } = useTeamStore();
  const { user } = useAuthStore();

  const { data: threads = [], isLoading } = useThreads(activeTeam?.id);
  const { isLoading: isEnsuring } = useEnsureTeamThread(activeTeam?.id);

  if (!activeTeam || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>No Team Selected</Text>
        <Text style={styles.emptySubtitle}>Join or create a team to start chatting.</Text>
      </View>
    );
  }

  if (isLoading || isEnsuring) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const sorted = [...threads].sort((a, b) => {
    if (a.type === 'team') return -1;
    if (b.type === 'team') return 1;
    if (a.type === 'announcement') return -1;
    if (b.type === 'announcement') return 1;
    const aTime = a.lastMessage?.created_at ?? a.created_at;
    const bTime = b.lastMessage?.created_at ?? b.created_at;
    return bTime.localeCompare(aTime);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activeTeam.name}</Text>
        <Text style={styles.headerSubtitle}>Team Messages</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={sorted.length === 0 ? styles.emptyList : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <ThreadRow thread={item} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No Channels Yet</Text>
            <Text style={styles.emptySubtitle}>Team Chat will appear here once set up.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    paddingVertical: 4,
  },
  emptyList: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 76,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  threadIcon: {
    fontSize: 22,
  },
  threadInfo: {
    flex: 1,
    gap: 3,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  threadTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  threadPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  threadPreviewEmpty: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

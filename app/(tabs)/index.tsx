import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useMyTeams } from '../../hooks/useTeams';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { activeTeam, setActiveTeam, teams } = useTeamStore();
  const { isLoading } = useMyTeams();
  useProfile();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hey, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
        </Text>
        {activeTeam && (
          <Text style={styles.teamName}>{activeTeam.name}</Text>
        )}
      </View>

      {teams.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Teams</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {teams.map((t) => (
              <Pressable
                key={t.id}
                style={[styles.teamChip, activeTeam?.id === t.id && styles.teamChipActive]}
                onPress={() => setActiveTeam(t)}
              >
                <Text style={[styles.teamChipText, activeTeam?.id === t.id && styles.teamChipTextActive]}>
                  {t.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {teams.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>No teams yet</Text>
          <Text style={styles.emptyBody}>
            Create a new team or join one with an invite code to get started.
          </Text>
          <View style={styles.emptyActions}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push('/team/create')}
            >
              <Text style={styles.primaryBtnText}>Create Team</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push('/team/join')}
            >
              <Text style={styles.secondaryBtnText}>Join with Code</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {[
                { label: 'Schedule', emoji: '📅', route: '/(tabs)/schedule' },
                { label: 'Roster', emoji: '👥', route: '/(tabs)/roster' },
                { label: 'Chat', emoji: '💬', route: '/(tabs)/chat' },
                { label: 'Add Team', emoji: '➕', route: '/team/create' },
              ].map((a) => (
                <Pressable
                  key={a.label}
                  style={styles.actionCard}
                  onPress={() => router.push(a.route as any)}
                >
                  <Text style={styles.actionEmoji}>{a.emoji}</Text>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {activeTeam && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Sport</Text>
              <Text style={styles.infoValue}>{activeTeam.sport}</Text>
              {activeTeam.season && (
                <>
                  <Text style={styles.infoLabel}>Season</Text>
                  <Text style={styles.infoValue}>{activeTeam.season}</Text>
                </>
              )}
              <Text style={styles.infoLabel}>Invite Code</Text>
              <Text style={styles.inviteCode}>{activeTeam.invite_code}</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  teamName: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  teamChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    marginRight: 8,
  },
  teamChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  teamChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  teamChipTextActive: { color: '#fff' },
  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 30,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyActions: { width: '100%', gap: 10 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  quickActions: { marginBottom: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: Colors.border,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  inviteCode: {
    fontSize: 22, fontWeight: '800', color: Colors.primary,
    letterSpacing: 4, marginTop: 4,
  },
});

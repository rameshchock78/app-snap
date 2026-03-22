import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';

interface MenuItem {
  emoji: string;
  label: string;
  description: string;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { emoji: '💳', label: 'Payments', description: 'Invoices & dues', path: '/payments' },
  { emoji: '📊', label: 'Stats', description: 'Scores & game results', path: '/stats' },
  { emoji: '✅', label: 'Assignments', description: 'Tasks & to-dos', path: '/assignments' },
  { emoji: '👤', label: 'My Profile', description: 'Edit your info', path: '/profile' },
];

const TEAM_ITEMS: MenuItem[] = [
  { emoji: '🔗', label: 'Join Team', description: 'Enter an invite code', path: '/team/join' },
  { emoji: '➕', label: 'Create Team', description: 'Start a new team', path: '/team/create' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { activeTeam } = useTeamStore();

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name ?? 'My Account'}</Text>
          <Text style={styles.profileEmail}>{profile?.email ?? ''}</Text>
          {activeTeam && (
            <Text style={styles.teamBadge}>📍 {activeTeam.name}</Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Features</Text>
      {MENU_ITEMS.map((item) => (
        <Pressable
          key={item.label}
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => router.push(item.path as never)}
        >
          <Text style={styles.menuEmoji}>{item.emoji}</Text>
          <View style={styles.menuText}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDesc}>{item.description}</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionLabel}>Team</Text>
      {TEAM_ITEMS.map((item) => (
        <Pressable
          key={item.label}
          style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
          onPress={() => router.push(item.path as never)}
        >
          <Text style={styles.menuEmoji}>{item.emoji}</Text>
          <View style={styles.menuText}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDesc}>{item.description}</Text>
          </View>
          <Text style={styles.menuChevron}>›</Text>
        </Pressable>
      ))}

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitials: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  teamBadge: { fontSize: 12, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuRowPressed: { opacity: 0.7 },
  menuEmoji: { fontSize: 22, marginRight: 14, width: 32, textAlign: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  menuChevron: { fontSize: 22, color: Colors.textMuted, marginLeft: 8 },
  signOutBtn: {
    marginTop: 20,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

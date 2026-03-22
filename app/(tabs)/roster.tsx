import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { ROLES } from '../../constants';
import { useTeamMembers, useUpdateMemberRole } from '../../hooks/useTeams';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';
import { TeamMember } from '../../types';

const ROLE_COLORS: Record<string, string> = {
  coach: Colors.secondary,
  manager: Colors.primary,
  player: Colors.success,
  parent: Colors.textSecondary,
};

function MemberCard({ member, isAdmin, currentUserId }: { member: TeamMember; isAdmin: boolean; currentUserId: string }) {
  const { mutate: updateRole } = useUpdateMemberRole();
  const isMe = member.user_id === currentUserId;

  const handleRoleChange = () => {
    if (!isAdmin || isMe) return;
    Alert.alert('Change Role', `Set role for ${member.profile?.full_name}`, [
      ...Object.values(ROLES).map((role) => ({
        text: role.charAt(0).toUpperCase() + role.slice(1),
        onPress: () => updateRole({ memberId: member.id, role }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable style={styles.memberCard} onPress={handleRoleChange}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(member.profile?.full_name ?? '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.profile?.full_name ?? 'Unknown'} {isMe ? '(you)' : ''}
        </Text>
        <Text style={styles.memberEmail}>{member.profile?.email}</Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[member.role] + '20' }]}>
        <Text style={[styles.roleText, { color: ROLE_COLORS[member.role] }]}>
          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function RosterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTeam, members } = useTeamStore();
  const { isLoading } = useTeamMembers(activeTeam?.id);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  const handleShareInvite = async () => {
    if (!activeTeam) return;
    await Share.share({
      message: `Join ${activeTeam.name} on AppSnap! Use invite code: ${activeTeam.invite_code}`,
    });
  };

  if (!activeTeam) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No team selected.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/team/create')}>
          <Text style={styles.primaryBtnText}>Create a Team</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.teamName}>{activeTeam.name}</Text>
          <Text style={styles.memberCount}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable style={styles.inviteBtn} onPress={handleShareInvite}>
          <Text style={styles.inviteBtnText}>+ Invite</Text>
        </Pressable>
      </View>

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MemberCard member={item} isAdmin={isAdmin} currentUserId={user?.id ?? ''} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No members yet. Invite your team!</Text>
        }
      />

      {isAdmin && (
        <View style={styles.footer}>
          <Text style={styles.inviteHint}>
            Invite Code: <Text style={styles.inviteCode}>{activeTeam.invite_code}</Text>
          </Text>
          <Pressable onPress={handleShareInvite}>
            <Text style={styles.shareLink}>Share Invite</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  teamName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  memberCount: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  inviteBtn: {
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 10 },
  memberCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  memberEmail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { fontSize: 12, fontWeight: '700' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  inviteHint: { fontSize: 13, color: Colors.textSecondary },
  inviteCode: { fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
  shareLink: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

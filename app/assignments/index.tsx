import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Assignment, useCreateAssignment, useTeamAssignments, useToggleAssignment } from '../../hooks/useAssignments';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AssignmentsScreen() {
  const { activeTeam, members } = useTeamStore();
  const { user } = useAuthStore();

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  const { data: assignments, isLoading } = useTeamAssignments(activeTeam?.id);
  const createAssignment = useCreateAssignment();
  const toggleAssignment = useToggleAssignment();

  const pending = (assignments ?? []).filter((a) => !a.is_completed);
  const completed = (assignments ?? []).filter((a) => a.is_completed);
  const sortedAssignments = [...pending, ...completed];

  const handleAdd = () => {
    if (!activeTeam || !user) return;
    Alert.prompt(
      'New Assignment',
      'Assignment title:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (title: string | undefined) => {
            if (!title?.trim()) return;
            createAssignment.mutate({
              team_id: activeTeam.id,
              title: title.trim(),
              created_by: user.id,
            });
          },
        },
      ],
      'plain-text'
    );
  };

  const handleToggle = (assignment: Assignment) => {
    toggleAssignment.mutate({
      id: assignment.id,
      is_completed: !assignment.is_completed,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Assignments</Text>
          {activeTeam && <Text style={styles.subtitle}>{activeTeam.name}</Text>}
        </View>
        {isAdmin && (
          <Pressable style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={sortedAssignments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No assignments yet</Text>
              {isAdmin && (
                <Text style={styles.emptyHint}>Tap "+ Add" to create an assignment</Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, item.is_completed && styles.rowCompleted]}>
              <Pressable
                style={[styles.checkbox, item.is_completed && styles.checkboxDone]}
                onPress={() => handleToggle(item)}
              >
                {item.is_completed && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, item.is_completed && styles.rowTitleDone]}>
                  {item.title}
                </Text>
                {item.event && (
                  <Text style={styles.eventTag}>{item.event.title}</Text>
                )}
                <View style={styles.rowMeta}>
                  {item.assignee && (
                    <View style={styles.assigneeRow}>
                      <AvatarCircle name={item.assignee.full_name} />
                      <Text style={styles.assigneeName}>{item.assignee.full_name}</Text>
                    </View>
                  )}
                  {item.due_date && (
                    <Text style={styles.dueDate}>Due {formatDate(item.due_date)}</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowCompleted: { opacity: 0.55 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  eventTag: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 9, fontWeight: '700', color: Colors.primary },
  assigneeName: { fontSize: 12, color: Colors.textSecondary },
  dueDate: { fontSize: 12, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textMuted },
  emptyHint: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
});

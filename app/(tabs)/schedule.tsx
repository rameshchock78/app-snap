import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useTeamEvents } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';
import { Event, EventType, RsvpStatus } from '../../types';

const EVENT_EMOJI: Record<EventType, string> = {
  game: '⚽',
  practice: '🏃',
  meeting: '📋',
  other: '📌',
};

const RSVP_COLORS: Record<RsvpStatus, string> = {
  yes: Colors.success,
  no: Colors.danger,
  maybe: Colors.warning,
};

const RSVP_LABELS: Record<RsvpStatus, string> = {
  yes: 'Going',
  no: 'Not Going',
  maybe: 'Maybe',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDateGroup(iso: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const eventDate = new Date(iso);
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  if (eventDay.getTime() === today.getTime()) return 'Today';
  if (eventDay.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (eventDay <= weekEnd) return 'This Week';
  return 'Later';
}

const GROUP_ORDER = ['Today', 'Tomorrow', 'This Week', 'Later'];

interface EventCardProps {
  event: Event;
  myRsvp?: RsvpStatus;
  onPress: () => void;
}

function EventCard({ event, myRsvp, onPress }: EventCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>{EVENT_EMOJI[event.type]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.cardTime}>{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</Text>
        {!!event.location && (
          <Text style={styles.cardLocation} numberOfLines={1}>📍 {event.location}</Text>
        )}
      </View>
      {myRsvp && (
        <View style={[styles.rsvpChip, { backgroundColor: RSVP_COLORS[myRsvp] + '20' }]}>
          <Text style={[styles.rsvpChipText, { color: RSVP_COLORS[myRsvp] }]}>
            {RSVP_LABELS[myRsvp]}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function EmptyState({ isAdmin, onAdd }: { isAdmin: boolean; onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📅</Text>
      <Text style={styles.emptyTitle}>No upcoming events</Text>
      <Text style={styles.emptySubtitle}>
        {isAdmin ? 'Schedule your first event to get started.' : 'No events have been scheduled yet.'}
      </Text>
      {isAdmin && (
        <Pressable style={styles.emptyBtn} onPress={onAdd}>
          <Text style={styles.emptyBtnText}>+ Schedule Event</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTeam, members } = useTeamStore();
  const { data: events = [], isLoading } = useTeamEvents(activeTeam?.id);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  const handleAddEvent = () => router.push('/event/create');

  if (!activeTeam) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No team selected.</Text>
        <Pressable style={styles.emptyBtn} onPress={() => router.push('/team/create')}>
          <Text style={styles.emptyBtnText}>Create a Team</Text>
        </Pressable>
      </View>
    );
  }

  const upcoming = events.filter((e) => new Date(e.start_time) >= new Date(new Date().setHours(0, 0, 0, 0)));

  const grouped = upcoming.reduce<Record<string, Event[]>>((acc, event) => {
    const group = getDateGroup(event.start_time);
    if (!acc[group]) acc[group] = [];
    acc[group].push(event);
    return acc;
  }, {});

  const sections = GROUP_ORDER
    .filter((g) => grouped[g])
    .map((g) => ({ title: g, data: grouped[g] }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{activeTeam.name}</Text>
          <Text style={styles.headerSubtitle}>Schedule</Text>
        </View>
        {isAdmin && (
          <Pressable style={styles.addBtn} onPress={handleAddEvent}>
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState isAdmin={isAdmin} onAdd={handleAddEvent} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => router.push(`/event/${item.id}`)}
            />
          )}
          stickySectionHeadersEnabled={false}
        />
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '300', lineHeight: 28 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  sectionHeader: { paddingTop: 20, paddingBottom: 8 },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
    gap: 12,
  },
  cardLeft: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  cardEmoji: { fontSize: 22 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardTime: { fontSize: 12, color: Colors.textSecondary },
  cardLocation: { fontSize: 12, color: Colors.textMuted },
  rsvpChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'center' },
  rsvpChipText: { fontSize: 11, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

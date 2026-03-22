import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useEventAttendances, useTeamEvents, useDeleteEvent, useUpsertRsvp } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';
import { Event, EventType, RsvpStatus } from '../../types';
import { EventAttendanceWithProfile } from '../../hooks/useEvents';

const EVENT_EMOJI: Record<EventType, string> = {
  game: '⚽',
  practice: '🏃',
  meeting: '📋',
  other: '📌',
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  game: Colors.secondary,
  practice: Colors.success,
  meeting: Colors.primary,
  other: Colors.textSecondary,
};

const RSVP_OPTIONS: { status: RsvpStatus; label: string; icon: string; color: string }[] = [
  { status: 'yes', label: 'Going', icon: '✓', color: Colors.success },
  { status: 'no', label: 'Not Going', icon: '✗', color: Colors.danger },
  { status: 'maybe', label: 'Maybe', icon: '?', color: Colors.warning },
];

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AttendanceAvatar({ attendance }: { attendance: EventAttendanceWithProfile }) {
  const name = attendance.profile?.full_name ?? '?';
  const initial = name.charAt(0).toUpperCase();
  const statusColors: Record<RsvpStatus, string> = {
    yes: Colors.success,
    no: Colors.danger,
    maybe: Colors.warning,
  };
  const statusIcons: Record<RsvpStatus, string> = { yes: '✓', no: '✗', maybe: '?' };

  return (
    <View style={avatarStyles.container}>
      <View style={[avatarStyles.circle, { borderColor: statusColors[attendance.status] }]}>
        <Text style={avatarStyles.initial}>{initial}</Text>
      </View>
      <View style={[avatarStyles.badge, { backgroundColor: statusColors[attendance.status] }]}>
        <Text style={avatarStyles.badgeIcon}>{statusIcons[attendance.status]}</Text>
      </View>
      <Text style={avatarStyles.name} numberOfLines={1}>{name.split(' ')[0]}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  container: { alignItems: 'center', width: 54 },
  circle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2,
  },
  initial: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  badge: {
    position: 'absolute', bottom: 18, right: 0,
    width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.surface,
  },
  badgeIcon: { color: '#fff', fontSize: 9, fontWeight: '800' },
  name: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: 'center', width: 52 },
});

interface AttendanceSummaryProps {
  attendances: EventAttendanceWithProfile[];
}

function AttendanceSummary({ attendances }: AttendanceSummaryProps) {
  const yes = attendances.filter((a) => a.status === 'yes').length;
  const no = attendances.filter((a) => a.status === 'no').length;
  const maybe = attendances.filter((a) => a.status === 'maybe').length;

  return (
    <View style={summaryStyles.row}>
      <View style={summaryStyles.item}>
        <Text style={[summaryStyles.count, { color: Colors.success }]}>{yes}</Text>
        <Text style={summaryStyles.label}>😊 Going</Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.item}>
        <Text style={[summaryStyles.count, { color: Colors.danger }]}>{no}</Text>
        <Text style={summaryStyles.label}>😞 Not Going</Text>
      </View>
      <View style={summaryStyles.divider} />
      <View style={summaryStyles.item}>
        <Text style={[summaryStyles.count, { color: Colors.warning }]}>{maybe}</Text>
        <Text style={summaryStyles.label}>🤔 Maybe</Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  item: { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 4 },
  count: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  divider: { width: 1, backgroundColor: Colors.border, marginVertical: 10 },
});

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeTeam, members } = useTeamStore();
  const { data: events = [], isLoading: eventsLoading } = useTeamEvents(activeTeam?.id);
  const { data: attendances = [], isLoading: attendancesLoading } = useEventAttendances(id);
  const { mutate: upsertRsvp, isPending: rsvpPending } = useUpsertRsvp();
  const { mutate: deleteEvent, isPending: deletePending } = useDeleteEvent();

  const event = events.find((e) => e.id === id) as Event | undefined;
  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';
  const myAttendance = attendances.find((a) => a.user_id === user?.id);

  const handleRsvp = (status: RsvpStatus) => {
    if (!id) return;
    upsertRsvp({ eventId: id, status });
  };

  const handleDelete = () => {
    if (!event || !activeTeam) return;
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(
              { id: event.id, teamId: activeTeam.id },
              { onSuccess: () => router.back() },
            );
          },
        },
      ],
    );
  };

  if (eventsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>Event not found.</Text>
      </View>
    );
  }

  const typeColor = EVENT_TYPE_COLORS[event.type];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Event Header */}
      <View style={styles.eventHeader}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
          <Text style={styles.typeEmoji}>{EVENT_EMOJI[event.type]}</Text>
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.eventTitle}>{event.title}</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoMain}>{formatFullDate(event.start_time)}</Text>
            <Text style={styles.infoSub}>
              {formatTime(event.start_time)}
              {event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
            </Text>
          </View>
        </View>

        {!!event.location && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoMain}>{event.location}</Text>
            </View>
          </>
        )}

        {!!event.notes && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📝</Text>
              <Text style={[styles.infoMain, styles.notesText]}>{event.notes}</Text>
            </View>
          </>
        )}
      </View>

      {/* RSVP Section */}
      <Text style={styles.sectionTitle}>Your RSVP</Text>
      <View style={styles.rsvpRow}>
        {RSVP_OPTIONS.map((opt) => {
          const isActive = myAttendance?.status === opt.status;
          return (
            <Pressable
              key={opt.status}
              style={[
                styles.rsvpBtn,
                { borderColor: isActive ? opt.color : Colors.border },
                isActive && { backgroundColor: opt.color + '18' },
              ]}
              onPress={() => handleRsvp(opt.status)}
              disabled={rsvpPending}
            >
              <Text style={[styles.rsvpIcon, { color: isActive ? opt.color : Colors.textMuted }]}>
                {opt.icon}
              </Text>
              <Text style={[styles.rsvpLabel, { color: isActive ? opt.color : Colors.textSecondary }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Attendance Summary */}
      {attendances.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Attendance</Text>
          <AttendanceSummary attendances={attendances} />
        </>
      )}

      {/* Attendance List */}
      {attendances.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Responses</Text>
          {attendancesLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <View style={styles.avatarGrid}>
              {attendances.map((a) => (
                <AttendanceAvatar key={a.id} attendance={a} />
              ))}
            </View>
          )}
        </>
      )}

      {/* Admin Delete */}
      {isAdmin && (
        <Pressable
          style={[styles.deleteBtn, deletePending && styles.deleteBtnDisabled]}
          onPress={handleDelete}
          disabled={deletePending}
        >
          <Text style={styles.deleteBtnText}>{deletePending ? 'Deleting…' : '🗑 Delete Event'}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFoundText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center' },

  eventHeader: { gap: 10, marginBottom: 4 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  typeEmoji: { fontSize: 15 },
  typeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, lineHeight: 30 },

  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 0,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center', marginTop: 1 },
  infoTextBlock: { flex: 1, gap: 2 },
  infoMain: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  infoSub: { fontSize: 13, color: Colors.textSecondary },
  infoDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10, marginLeft: 36 },
  notesText: { fontWeight: '400', color: Colors.textSecondary, lineHeight: 20 },

  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8,
  },

  rsvpRow: { flexDirection: 'row', gap: 10 },
  rsvpBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface, gap: 4,
  },
  rsvpIcon: { fontSize: 22, fontWeight: '800' },
  rsvpLabel: { fontSize: 11, fontWeight: '700' },

  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },

  deleteBtn: {
    backgroundColor: Colors.danger + '12', borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.danger + '40', paddingVertical: 15, alignItems: 'center', marginTop: 12,
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 15 },
});

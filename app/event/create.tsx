import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useCreateEvent } from '../../hooks/useEvents';
import { useTeamStore } from '../../store/team';
import { useAuthStore } from '../../store/auth';
import { EventType } from '../../types';

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'game', label: 'Game', emoji: '⚽' },
  { value: 'practice', label: 'Practice', emoji: '🏃' },
  { value: 'meeting', label: 'Meeting', emoji: '📋' },
  { value: 'other', label: 'Other', emoji: '📌' },
];

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDisplayTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type PickerMode = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

export default function CreateEventScreen() {
  const router = useRouter();
  const { activeTeam, members } = useTeamStore();
  const { user } = useAuthStore();
  const { mutate: createEvent, isPending } = useCreateEvent();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('practice');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  if (!activeTeam || !isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>You don't have permission to create events.</Text>
      </View>
    );
  }

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      setPickerMode(null);
      return;
    }

    if (pickerMode === 'startDate') {
      const next = new Date(startDate);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartDate(next);
      if (Platform.OS === 'android') setPickerMode('startTime');
    } else if (pickerMode === 'startTime') {
      const next = new Date(startDate);
      next.setHours(selected.getHours(), selected.getMinutes());
      setStartDate(next);
      setPickerMode(null);
    } else if (pickerMode === 'endDate') {
      const base = endDate ?? new Date(startDate);
      base.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEndDate(new Date(base));
      if (Platform.OS === 'android') setPickerMode('endTime');
    } else if (pickerMode === 'endTime') {
      const base = endDate ?? new Date(startDate);
      base.setHours(selected.getHours(), selected.getMinutes());
      setEndDate(new Date(base));
      setPickerMode(null);
    }

    if (Platform.OS === 'ios') setPickerMode(null);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a title for the event.');
      return;
    }
    if (endDate && endDate <= startDate) {
      Alert.alert('Validation', 'End time must be after start time.');
      return;
    }

    createEvent(
      {
        team_id: activeTeam.id,
        title: title.trim(),
        type,
        start_time: startDate.toISOString(),
        end_time: endDate?.toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  const pickerValue =
    pickerMode === 'startDate' || pickerMode === 'startTime'
      ? startDate
      : endDate ?? startDate;

  const pickerDateMode =
    pickerMode === 'startDate' || pickerMode === 'endDate' ? 'date' : 'time';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Home Game vs Eagles"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {EVENT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.typeChip, type === t.value && styles.typeChipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={styles.typeEmoji}>{t.emoji}</Text>
              <Text style={[styles.typeLabel, type === t.value && styles.typeLabelActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Start</Text>
        <View style={styles.dateRow}>
          <Pressable style={styles.dateBtn} onPress={() => setPickerMode('startDate')}>
            <Text style={styles.dateBtnText}>📅 {formatDisplayDate(startDate)}</Text>
          </Pressable>
          <Pressable style={styles.timeBtn} onPress={() => setPickerMode('startTime')}>
            <Text style={styles.dateBtnText}>🕐 {formatDisplayTime(startDate)}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>End Time <Text style={styles.optional}>(optional)</Text></Text>
        <View style={styles.dateRow}>
          <Pressable
            style={styles.dateBtn}
            onPress={() => {
              if (!endDate) {
                const next = new Date(startDate);
                next.setHours(startDate.getHours() + 1);
                setEndDate(next);
              }
              setPickerMode('endDate');
            }}
          >
            <Text style={[styles.dateBtnText, !endDate && styles.dateBtnPlaceholder]}>
              📅 {endDate ? formatDisplayDate(endDate) : 'Select date'}
            </Text>
          </Pressable>
          {endDate && (
            <Pressable style={styles.timeBtn} onPress={() => setPickerMode('endTime')}>
              <Text style={styles.dateBtnText}>🕐 {formatDisplayTime(endDate)}</Text>
            </Pressable>
          )}
          {endDate && (
            <Pressable style={styles.clearBtn} onPress={() => setEndDate(null)}>
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>Location <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Riverside Park Field 3"
          placeholderTextColor={Colors.textMuted}
          value={location}
          onChangeText={setLocation}
          returnKeyType="done"
        />

        <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Additional details for the team..."
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.submitBtnText}>{isPending ? 'Creating…' : 'Create Event'}</Text>
        </Pressable>
      </ScrollView>

      {pickerMode !== null && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerDateMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={pickerMode === 'startDate' ? undefined : startDate}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 6, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 15, color: Colors.danger, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  optional: { fontWeight: '400', color: Colors.textMuted, textTransform: 'none', letterSpacing: 0 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, marginTop: 6,
  },
  notesInput: { height: 100, paddingTop: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeLabelActive: { color: Colors.primary },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
  dateBtn: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  },
  timeBtn: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  },
  dateBtnText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  dateBtnPlaceholder: { color: Colors.textMuted },
  clearBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.danger + '15', justifyContent: 'center', alignItems: 'center',
  },
  clearBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 13 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useCreateTeam } from '../../hooks/useTeams';

const SPORTS = ['Soccer', 'Basketball', 'Baseball', 'Softball', 'Volleyball', 'Football', 'Hockey', 'Tennis', 'Swimming', 'Other'];

export default function CreateTeamScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [season, setSeason] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const { mutate: createTeam, isPending } = useCreateTeam();

  const handleCreate = () => {
    if (!name.trim() || !sport) return;
    createTeam(
      { name: name.trim(), sport, season: season.trim() || undefined, age_group: ageGroup.trim() || undefined },
      { onSuccess: () => router.replace('/(tabs)') }
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create a Team</Text>

        <Text style={styles.label}>Team Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Thunder FC"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Sport *</Text>
        <View style={styles.sportsGrid}>
          {SPORTS.map((s) => (
            <Pressable
              key={s}
              style={[styles.sportChip, sport === s && styles.sportChipActive]}
              onPress={() => setSport(s)}
            >
              <Text style={[styles.sportChipText, sport === s && styles.sportChipTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Season (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Spring 2026"
          placeholderTextColor={Colors.textMuted}
          value={season}
          onChangeText={setSeason}
        />

        <Text style={styles.label}>Age Group (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. U12, Adult, High School"
          placeholderTextColor={Colors.textMuted}
          value={ageGroup}
          onChangeText={setAgeGroup}
        />

        <Pressable
          style={[styles.button, (!name.trim() || !sport) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isPending || !name.trim() || !sport}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Team</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, marginBottom: 20,
  },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  sportChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  sportChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sportChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  sportChipTextActive: { color: '#fff' },
  button: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 10, marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: Colors.textSecondary, fontSize: 15 },
});

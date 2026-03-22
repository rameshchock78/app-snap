import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../../constants/colors';
import { useGameStat, useUpdateScore } from '../../hooks/useStats';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';

function ScoreControl({
  label,
  value,
  onChange,
  editable,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  editable: boolean;
}) {
  return (
    <View style={styles.scoreControl}>
      <Text style={styles.scoreLabel}>{label}</Text>
      {editable ? (
        <View style={styles.scoreButtons}>
          <Pressable
            style={styles.scoreBtn}
            onPress={() => onChange(Math.max(0, value - 1))}
          >
            <Text style={styles.scoreBtnText}>−</Text>
          </Pressable>
          <Text style={styles.scoreValue}>{value}</Text>
          <Pressable
            style={[styles.scoreBtn, styles.scoreBtnPlus]}
            onPress={() => onChange(value + 1)}
          >
            <Text style={[styles.scoreBtnText, styles.scoreBtnPlusText]}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.scoreValueReadOnly}>{value}</Text>
      )}
    </View>
  );
}

export default function GameStatScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const { members } = useTeamStore();
  const { user } = useAuthStore();

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  const { data: game, isLoading } = useGameStat(gameId);
  const updateScore = useUpdateScore();

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [opponent, setOpponent] = useState('');

  useEffect(() => {
    if (game) {
      setHomeScore(game.home_score);
      setAwayScore(game.away_score);
      setIsLive(game.is_live);
      setOpponent(game.opponent ?? '');
    }
  }, [game]);

  const handleSave = () => {
    if (!gameId) return;
    updateScore.mutate(
      { id: gameId, home_score: homeScore, away_score: awayScore, is_live: isLive, opponent },
      { onSuccess: () => router.back() }
    );
  };

  if (isLoading || !game) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const isDirty =
    homeScore !== game.home_score ||
    awayScore !== game.away_score ||
    isLive !== game.is_live ||
    opponent !== (game.opponent ?? '');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eventTitle}>{game.event?.title ?? 'Game'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Opponent</Text>
        {isAdmin ? (
          <TextInput
            style={styles.input}
            value={opponent}
            onChangeText={setOpponent}
            placeholder="Opponent team name"
            placeholderTextColor={Colors.textMuted}
          />
        ) : (
          <Text style={styles.opponentText}>{game.opponent ?? '—'}</Text>
        )}
      </View>

      <View style={styles.scoreRow}>
        <ScoreControl
          label="Home"
          value={homeScore}
          onChange={setHomeScore}
          editable={isAdmin}
        />
        <View style={styles.scoreSeparator}>
          <Text style={styles.scoreSeparatorText}>–</Text>
        </View>
        <ScoreControl
          label="Away"
          value={awayScore}
          onChange={setAwayScore}
          editable={isAdmin}
        />
      </View>

      {isAdmin && (
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Mark as Live</Text>
            <Text style={styles.toggleHint}>Show pulsing live indicator to all members</Text>
          </View>
          <Switch
            value={isLive}
            onValueChange={setIsLive}
            trackColor={{ false: Colors.border, true: Colors.danger }}
            thumbColor="#fff"
          />
        </View>
      )}

      {!isAdmin && isLive && (
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>🔴 This game is LIVE</Text>
        </View>
      )}

      {isAdmin && (
        <Pressable
          style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isDirty || updateScore.isPending}
        >
          {updateScore.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  opponentText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreControl: { flex: 1, alignItems: 'center' },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreButtons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreBtnPlus: { backgroundColor: Colors.primary },
  scoreBtnText: { fontSize: 24, fontWeight: '300', color: Colors.textPrimary },
  scoreBtnPlusText: { color: '#fff', fontWeight: '700' },
  scoreValue: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary, minWidth: 48, textAlign: 'center' },
  scoreValueReadOnly: { fontSize: 40, fontWeight: '800', color: Colors.textPrimary },
  scoreSeparator: { paddingHorizontal: 8 },
  scoreSeparatorText: { fontSize: 32, color: Colors.textMuted, fontWeight: '300' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  toggleHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  liveIndicator: {
    backgroundColor: Colors.danger + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.danger + '44',
  },
  liveText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

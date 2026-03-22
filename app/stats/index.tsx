import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { GameStat, useGameStats } from '../../hooks/useStats';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.Text style={[styles.liveDot, { opacity }]}>🔴</Animated.Text>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function StatsScreen() {
  const router = useRouter();
  const { activeTeam, members } = useTeamStore();
  const { user } = useAuthStore();

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  const { data: games, isLoading } = useGameStats(activeTeam?.id);

  const liveGames = (games ?? []).filter((g) => g.is_live);
  const finishedGames = (games ?? []).filter((g) => !g.is_live);
  const sortedGames = [...liveGames, ...finishedGames];

  const wins = finishedGames.filter((g) => g.home_score > g.away_score).length;
  const losses = finishedGames.filter((g) => g.home_score < g.away_score).length;
  const draws = finishedGames.filter((g) => g.home_score === g.away_score).length;
  const totalGoals = finishedGames.reduce((sum, g) => sum + g.home_score, 0);

  const handleGamePress = (game: GameStat) => {
    if (isAdmin) {
      router.push(`/stats/${game.id}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats & Scores</Text>
        {activeTeam && <Text style={styles.subtitle}>{activeTeam.name}</Text>}
      </View>

      {(games ?? []).length > 0 && (
        <View style={styles.seasonCard}>
          <Text style={styles.seasonTitle}>Season Summary</Text>
          <View style={styles.seasonRow}>
            <View style={styles.seasonStat}>
              <Text style={styles.seasonValue}>{wins}</Text>
              <Text style={styles.seasonLabel}>Wins</Text>
            </View>
            <View style={styles.seasonDivider} />
            <View style={styles.seasonStat}>
              <Text style={styles.seasonValue}>{losses}</Text>
              <Text style={styles.seasonLabel}>Losses</Text>
            </View>
            {draws > 0 && (
              <>
                <View style={styles.seasonDivider} />
                <View style={styles.seasonStat}>
                  <Text style={styles.seasonValue}>{draws}</Text>
                  <Text style={styles.seasonLabel}>Draws</Text>
                </View>
              </>
            )}
            <View style={styles.seasonDivider} />
            <View style={styles.seasonStat}>
              <Text style={styles.seasonValue}>{totalGoals}</Text>
              <Text style={styles.seasonLabel}>Goals</Text>
            </View>
          </View>
          <Text style={styles.record}>
            Record: {wins}-{losses}{draws > 0 ? `-${draws}` : ''}
          </Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={sortedGames}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No games played yet</Text>
              {isAdmin && (
                <Text style={styles.emptyHint}>
                  Tap a game event and create a score entry
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isWin = item.home_score > item.away_score;
            const isLoss = item.home_score < item.away_score;
            const resultColor = item.is_live
              ? Colors.warning
              : isWin
              ? Colors.success
              : isLoss
              ? Colors.danger
              : Colors.textSecondary;

            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && isAdmin && styles.rowPressed]}
                onPress={() => handleGamePress(item)}
              >
                <View style={styles.rowTop}>
                  {item.is_live && (
                    <View style={styles.liveRow}>
                      <LiveDot />
                      <Text style={styles.liveText}> LIVE</Text>
                    </View>
                  )}
                  <Text style={styles.opponentName}>
                    vs. {item.opponent ?? 'Unknown Opponent'}
                  </Text>
                  {item.event && (
                    <Text style={styles.eventName}>{item.event.title}</Text>
                  )}
                </View>
                <View style={styles.rowBottom}>
                  <Text style={styles.score}>
                    {item.home_score} – {item.away_score}
                  </Text>
                  <View style={styles.rowMeta}>
                    {!item.is_live && (
                      <View style={[styles.resultBadge, { backgroundColor: resultColor + '22' }]}>
                        <Text style={[styles.resultText, { color: resultColor }]}>
                          {isWin ? 'W' : isLoss ? 'L' : 'D'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
                {isAdmin && (
                  <Text style={styles.editHint}>Tap to edit →</Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  seasonCard: {
    margin: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  seasonTitle: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.85 },
  seasonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  seasonStat: { flex: 1, alignItems: 'center' },
  seasonValue: { color: '#fff', fontSize: 28, fontWeight: '800' },
  seasonLabel: { color: '#fff', fontSize: 12, opacity: 0.8, marginTop: 2 },
  seasonDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  record: { color: '#fff', fontSize: 13, marginTop: 12, opacity: 0.9, fontWeight: '600' },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 40 },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowTop: { marginBottom: 8 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  liveDot: { fontSize: 12 },
  liveText: { fontSize: 11, fontWeight: '800', color: Colors.danger, letterSpacing: 1 },
  opponentName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  eventName: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  score: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  resultText: { fontSize: 14, fontWeight: '800' },
  dateText: { fontSize: 12, color: Colors.textMuted },
  editHint: { fontSize: 11, color: Colors.primary, marginTop: 6, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textMuted },
  emptyHint: { fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
});

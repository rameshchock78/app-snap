import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import { APP_NAME } from '../../constants';

export default function HomeScreen() {
  const { profile } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hey, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
        </Text>
        <Text style={styles.appName}>{APP_NAME}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>No team yet</Text>
        <Text style={styles.cardBody}>
          Create a new team or join one with an invite code to get started.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  appName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  cardBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});

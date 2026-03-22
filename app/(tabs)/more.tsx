import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { supabase } from '../../lib/supabase';

export default function MoreScreen() {
  const handleSignOut = async () => {
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
      {[
        { label: 'Payments', emoji: '💳', phase: 4 },
        { label: 'Statistics', emoji: '📊', phase: 5 },
        { label: 'Lineup Builder', emoji: '📋', phase: 6 },
        { label: 'Assignments', emoji: '✅', phase: 6 },
        { label: 'Photo Albums', emoji: '📷', phase: 5 },
      ].map((item) => (
        <View key={item.label} style={styles.row}>
          <Text style={styles.rowEmoji}>{item.emoji}</Text>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowMeta}>Phase {item.phase}</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowEmoji: { fontSize: 22, marginRight: 14 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  rowMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  signOutBtn: {
    marginTop: 20,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

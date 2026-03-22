import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useJoinTeam } from '../../hooks/useTeams';

export default function JoinTeamScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const { mutate: joinTeam, isPending } = useJoinTeam();

  const handleJoin = () => {
    if (!code.trim()) return;
    joinTeam(code, { onSuccess: () => router.replace('/(tabs)') });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>Join a Team</Text>
        <Text style={styles.subtitle}>
          Enter the 8-character invite code shared by your coach or manager.
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder="XXXXXXXX"
          placeholderTextColor={Colors.textMuted}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
          autoCorrect={false}
        />

        <Pressable
          style={[styles.button, !code.trim() && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={isPending || !code.trim()}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join Team</Text>
          )}
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 32 },
  codeInput: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 2, borderColor: Colors.primary,
    paddingHorizontal: 20, paddingVertical: 20, fontSize: 32, fontWeight: '800',
    color: Colors.textPrimary, textAlign: 'center', letterSpacing: 8, marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: Colors.textSecondary, fontSize: 15 },
});

import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function RosterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Roster — coming in Phase 1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  placeholder: { color: Colors.textMuted, fontSize: 16 },
});

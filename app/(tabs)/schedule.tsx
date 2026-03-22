import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Schedule — coming in Phase 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  placeholder: { color: Colors.textMuted, fontSize: 16 },
});

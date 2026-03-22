import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Messaging — coming in Phase 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  placeholder: { color: Colors.textMuted, fontSize: 16 },
});

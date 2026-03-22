import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
        headerBackTitle: 'Chat',
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}

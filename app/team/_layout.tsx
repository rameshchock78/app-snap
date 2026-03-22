import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function TeamLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="create" options={{ title: 'Create Team', presentation: 'modal' }} />
      <Stack.Screen name="join" options={{ title: 'Join Team', presentation: 'modal' }} />
    </Stack>
  );
}

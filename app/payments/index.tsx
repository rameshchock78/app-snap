import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useCreateInvoice, useMyInvoices, useTeamInvoices } from '../../hooks/usePayments';
import { useAuthStore } from '../../store/auth';
import { useTeamStore } from '../../store/team';
import { Invoice, PaymentStatus } from '../../types';

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: Colors.warning,
  paid: Colors.success,
  overdue: Colors.danger,
  partial: Colors.primary,
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] + '22' }]}>
      <Text style={[styles.badgeText, { color: STATUS_COLORS[status] }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { activeTeam, members } = useTeamStore();
  const { user } = useAuthStore();

  const myMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMember?.role === 'coach' || myMember?.role === 'manager';

  const { data: allInvoices, isLoading: loadingAll } = useTeamInvoices(
    isAdmin ? activeTeam?.id : undefined
  );
  const { data: myInvoices, isLoading: loadingMy } = useMyInvoices(
    activeTeam?.id,
    user?.id
  );

  const createInvoice = useCreateInvoice();

  const isLoading = isAdmin ? loadingAll : loadingMy;
  const invoices: Invoice[] = isAdmin ? (allInvoices ?? []) : (myInvoices ?? []);

  const handleCreateInvoice = () => {
    if (!activeTeam || !user) return;
    Alert.prompt(
      'Create Invoice',
      'Enter amount in dollars (e.g. 50.00):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (amountStr: string | undefined) => {
            const dollars = parseFloat(amountStr ?? '0');
            if (isNaN(dollars) || dollars <= 0) {
              Alert.alert('Invalid amount');
              return;
            }
            Alert.prompt(
              'Description',
              'Enter description:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Create',
                  onPress: (desc: string | undefined) => {
                    if (!desc?.trim()) return;
                    createInvoice.mutate({
                      team_id: activeTeam.id,
                      user_id: user.id,
                      amount: Math.round(dollars * 100),
                      description: desc.trim(),
                      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                    });
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ],
      'plain-text'
    );
  };

  const mySummary = myInvoices ?? [];
  const totalOwed = mySummary
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const hasOverdue = mySummary.some((i) => i.status === 'overdue');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Payments</Text>
          {activeTeam && <Text style={styles.subtitle}>{activeTeam.name}</Text>}
        </View>
        {isAdmin && (
          <Pressable style={styles.createBtn} onPress={handleCreateInvoice}>
            <Text style={styles.createBtnText}>+ Create Invoice</Text>
          </Pressable>
        )}
      </View>

      {!isAdmin && mySummary.length > 0 && (
        <View style={[styles.summaryCard, hasOverdue && styles.summaryCardDanger]}>
          <Text style={styles.summaryLabel}>Your Balance Due</Text>
          <Text style={[styles.summaryAmount, hasOverdue && { color: Colors.danger }]}>
            {formatAmount(totalOwed)}
          </Text>
          {hasOverdue && (
            <Text style={styles.summaryWarning}>You have overdue invoices</Text>
          )}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No invoices yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const inv = item as Invoice & { profile?: { full_name: string } };
            return (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  {isAdmin && inv.profile && (
                    <Text style={styles.memberName}>{inv.profile.full_name}</Text>
                  )}
                  <Text style={styles.description}>{inv.description}</Text>
                  <Text style={styles.dueDate}>Due {formatDate(inv.due_date)}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.amount}>{formatAmount(inv.amount)}</Text>
                  <StatusBadge status={inv.status} />
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <Text style={styles.stripeNote}>
              Stripe integration required for live payments
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  createBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  summaryCard: {
    margin: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  summaryCardDanger: {
    backgroundColor: Colors.danger + '15',
    borderColor: Colors.danger + '44',
  },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryAmount: { fontSize: 28, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  summaryWarning: { fontSize: 12, color: Colors.danger, marginTop: 4 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowRight: { alignItems: 'flex-end' },
  memberName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  description: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dueDate: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  amount: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textMuted },
  stripeNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

/**
 * Payment and invoice logic tests.
 */

type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

function formatAmount(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function isOverdue(dueDate: string, status: PaymentStatus) {
  return status !== 'paid' && new Date(dueDate) < new Date();
}

function statusColor(status: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    pending: '#FFC107',
    paid:    '#28A745',
    overdue: '#DC3545',
    partial: '#1D72B8',
  };
  return map[status];
}

function totalDue(invoices: Array<{ amount: number; status: PaymentStatus }>) {
  return invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
}

function validateInvoiceInput(amountCents: number, description: string) {
  const errors: string[] = [];
  if (amountCents <= 0)        errors.push('Amount must be greater than 0');
  if (!description.trim())     errors.push('Description is required');
  if (amountCents > 10_000_00) errors.push('Amount cannot exceed $10,000');
  return errors;
}

describe('formatAmount', () => {
  test('$50.00 from 5000 cents',      () => expect(formatAmount(5000)).toBe('$50.00'));
  test('$0.99 from 99 cents',         () => expect(formatAmount(99)).toBe('$0.99'));
  test('$0.00 from 0 cents',          () => expect(formatAmount(0)).toBe('$0.00'));
  test('$1500.00 from 150000 cents',  () => expect(formatAmount(150000)).toBe('$1500.00'));
});

describe('isOverdue', () => {
  const pastDate   = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  test('past due pending invoice is overdue',   () => expect(isOverdue(pastDate,   'pending')).toBe(true));
  test('past due paid invoice is NOT overdue',  () => expect(isOverdue(pastDate,   'paid')).toBe(false));
  test('future due pending is NOT overdue',     () => expect(isOverdue(futureDate, 'pending')).toBe(false));
  test('partial past due is overdue',           () => expect(isOverdue(pastDate,   'partial')).toBe(true));
});

describe('statusColor', () => {
  test('pending is warning yellow', () => expect(statusColor('pending')).toBe('#FFC107'));
  test('paid is success green',     () => expect(statusColor('paid')).toBe('#28A745'));
  test('overdue is danger red',     () => expect(statusColor('overdue')).toBe('#DC3545'));
  test('partial is primary blue',   () => expect(statusColor('partial')).toBe('#1D72B8'));
});

describe('totalDue', () => {
  const invoices = [
    { amount: 5000, status: 'paid'    as PaymentStatus },
    { amount: 5000, status: 'pending' as PaymentStatus },
    { amount: 3000, status: 'overdue' as PaymentStatus },
    { amount: 2000, status: 'partial' as PaymentStatus },
  ];

  test('excludes paid invoices',       () => expect(totalDue(invoices)).toBe(10000));
  test('zero when all paid',           () => expect(totalDue([{ amount: 5000, status: 'paid' }])).toBe(0));
  test('zero for empty list',          () => expect(totalDue([])).toBe(0));
});

describe('validateInvoiceInput', () => {
  test('valid input passes',             () => expect(validateInvoiceInput(5000, 'Season fees')).toHaveLength(0));
  test('zero amount fails',              () => expect(validateInvoiceInput(0,    'Fee')).toContain('Amount must be greater than 0'));
  test('negative amount fails',          () => expect(validateInvoiceInput(-1,   'Fee')).toContain('Amount must be greater than 0'));
  test('empty description fails',        () => expect(validateInvoiceInput(5000, '')).toContain('Description is required'));
  test('amount > $10k fails',            () => expect(validateInvoiceInput(1_000_001, 'Fee')).toContain('Amount cannot exceed $10,000'));
});

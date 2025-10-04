import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { toast } from './use-toast';

export interface FinancialTransaction {
  id: string;
  patient_id: string;
  amount: number;
  type: 'payment' | 'charge' | 'adjustment';
  description: string;
  reference_number?: string;
  payment_method?: string;
  status: 'completed' | 'pending' | 'cancelled';
  transaction_date: string;
  notes?: string;
  created_at: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalPaid: number;
  totalCharges: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  pendingAmount: number;
}

interface UseSharedFinancialDataProps {
  patientId: string;
}

export const useSharedFinancialData = ({ patientId }: UseSharedFinancialDataProps) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    totalPaid: 0,
    totalCharges: 0,
    pendingAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useCurrentUser();

  // Calculate financial summary from transactions
  const calculateSummary = useCallback((transactions: FinancialTransaction[]): FinancialSummary => {
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    
    const totalPaid = completedTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCharges = completedTransactions
      .filter(t => t.type === 'charge')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const adjustments = completedTransactions
      .filter(t => t.type === 'adjustment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalCharges - totalPaid + adjustments;
    
    // Find last payment
    const payments = completedTransactions
      .filter(t => t.type === 'payment')
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    
    const lastPayment = payments[0];
    
    return {
      totalBalance,
      totalPaid,
      totalCharges: totalCharges + adjustments,
      lastPaymentDate: lastPayment?.transaction_date,
      lastPaymentAmount: lastPayment?.amount,
      pendingAmount,
    };
  }, []);

  // Fetch financial data
  const fetchFinancialData = useCallback(async () => {
    if (!patientId || !profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching financial data for patient:', patientId);
      
      // Check if patient belongs to current clinic
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, clinic_id')
        .eq('id', patientId)
        .eq('clinic_id', profile.id)
        .single();
      
      if (patientError || !patient) {
        throw new Error('Patient not found or access denied');
      }
      
      // For now, simulate financial data since tables don't exist yet
      // TODO: Replace with actual database queries when tables are created
      const mockTransactions: FinancialTransaction[] = [
        {
          id: '1',
          patient_id: patientId,
          amount: 500,
          type: 'charge',
          description: 'Dental Cleaning',
          status: 'completed',
          transaction_date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          patient_id: patientId,
          amount: 200,
          type: 'payment',
          description: 'Partial Payment',
          payment_method: 'cash',
          status: 'completed',
          transaction_date: '2024-01-20',
          created_at: '2024-01-20T14:30:00Z',
        },
        {
          id: '3',
          patient_id: patientId,
          amount: 300,
          type: 'charge',
          description: 'Tooth Filling',
          status: 'pending',
          transaction_date: '2024-02-01',
          created_at: '2024-02-01T09:15:00Z',
        },
      ];
      
      setTransactions(mockTransactions);
      setSummary(calculateSummary(mockTransactions));
      
      console.log('Financial data loaded successfully:', {
        transactionCount: mockTransactions.length,
        summary: calculateSummary(mockTransactions),
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load financial data';
      console.error('Error loading financial data:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientId, profile?.id, calculateSummary]);

  // Add new transaction
  const addTransaction = useCallback(async (transaction: Omit<FinancialTransaction, 'id' | 'created_at'>) => {
    if (!profile?.id) return false;
    
    try {
      console.log('Adding new transaction:', transaction);
      
      // TODO: Replace with actual database insert when tables are created
      const newTransaction: FinancialTransaction = {
        ...transaction,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
      };
      
      const updatedTransactions = [...transactions, newTransaction];
      setTransactions(updatedTransactions);
      setSummary(calculateSummary(updatedTransactions));
      
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction';
      console.error('Error adding transaction:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [profile?.id, transactions, calculateSummary]);

  // Update transaction
  const updateTransaction = useCallback(async (id: string, updates: Partial<FinancialTransaction>) => {
    if (!profile?.id) return false;
    
    try {
      console.log('Updating transaction:', id, updates);
      
      // TODO: Replace with actual database update when tables are created
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      
      setTransactions(updatedTransactions);
      setSummary(calculateSummary(updatedTransactions));
      
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      console.error('Error updating transaction:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [profile?.id, transactions, calculateSummary]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string) => {
    if (!profile?.id) return false;
    
    try {
      console.log('Deleting transaction:', id);
      
      // TODO: Replace with actual database delete when tables are created
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      setSummary(calculateSummary(updatedTransactions));
      
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
      console.error('Error deleting transaction:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [profile?.id, transactions, calculateSummary]);

  // Refresh data
  const refreshData = useCallback(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Load data on mount and when patient changes
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    transactions,
    summary,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData,
  };
};
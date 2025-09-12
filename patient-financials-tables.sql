-- Create tables for financial management
CREATE TABLE IF NOT EXISTS patient_financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'charge', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    reference_number VARCHAR(100),
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    transaction_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_treatment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_patient_id ON patient_financial_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON patient_financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON patient_financial_transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON patient_treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON patient_treatment_plans(status);

-- Enable RLS
ALTER TABLE patient_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_treatment_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage financial transactions for their clinic patients" ON patient_financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM patients p 
            INNER JOIN profiles pr ON pr.id = p.clinic_id 
            WHERE p.id = patient_id AND pr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage treatment plans for their clinic patients" ON patient_treatment_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM patients p 
            INNER JOIN profiles pr ON pr.id = p.clinic_id 
            WHERE p.id = patient_id AND pr.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON patient_financial_transactions TO authenticated;
GRANT ALL ON patient_treatment_plans TO authenticated;
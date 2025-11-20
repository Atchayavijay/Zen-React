-- Migration: Create placement_installments table
-- Date: 2025-11-03
-- Description: Separate table to track placement fee payment history

-- Create placement_installments table
CREATE TABLE IF NOT EXISTS placement_installments (
    placement_installment_id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(32), -- Cash, UPI, Bank Transfer, Card
    remarks TEXT,
    installment_count INTEGER NOT NULL, -- 1st, 2nd, 3rd placement payment
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_placement_installments_lead ON placement_installments(lead_id);
CREATE INDEX idx_placement_installments_date ON placement_installments(payment_date);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_placement_installments_timestamp
    BEFORE UPDATE ON placement_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Comments for documentation
COMMENT ON TABLE placement_installments IS 'Tracks individual placement fee payment records';
COMMENT ON COLUMN placement_installments.installment_count IS 'Sequential number of placement payment (1st, 2nd, 3rd, etc.)';
COMMENT ON COLUMN placement_installments.payment_mode IS 'Payment method: Cash, UPI, Bank Transfer, Card';



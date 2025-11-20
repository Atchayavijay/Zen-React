-- Add missing payment fields to lead_sub_courses table
-- Run this SQL script to add the new payment tracking fields

-- Add amount_paid_trainer column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_sub_courses' 
        AND column_name = 'amount_paid_trainer'
    ) THEN
        ALTER TABLE lead_sub_courses 
        ADD COLUMN amount_paid_trainer DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add pending_amount column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_sub_courses' 
        AND column_name = 'pending_amount'
    ) THEN
        ALTER TABLE lead_sub_courses 
        ADD COLUMN pending_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Make sure trainer_share_amount column exists (should already exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lead_sub_courses' 
        AND column_name = 'trainer_share_amount'
    ) THEN
        ALTER TABLE lead_sub_courses 
        ADD COLUMN trainer_share_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Update pending_amount based on trainer_share_amount and amount_paid_trainer
-- This can be run as a one-time update or as part of application logic
UPDATE lead_sub_courses 
SET pending_amount = COALESCE(trainer_share_amount, 0) - COALESCE(amount_paid_trainer, 0)
WHERE pending_amount IS NULL OR pending_amount = 0;

COMMIT;

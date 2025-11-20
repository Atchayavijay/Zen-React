-- Migration: Add trainer/payment fields to leads table for single course support
ALTER TABLE leads
  ADD COLUMN trainer_share INTEGER DEFAULT 0,
  ADD COLUMN trainer_share_amount NUMERIC DEFAULT 0,
  ADD COLUMN amount_paid_trainer NUMERIC DEFAULT 0,
  ADD COLUMN pending_amount NUMERIC DEFAULT 0,
  ADD COLUMN training_status VARCHAR(50) DEFAULT 'nottaken',
  ADD COLUMN training_start_date DATE,
  ADD COLUMN training_end_date DATE,
  ADD COLUMN trainer_paid BOOLEAN DEFAULT FALSE;

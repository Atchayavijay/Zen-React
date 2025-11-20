
-- Add placement_paid_status column to leads table
ALTER TABLE leads
  ADD COLUMN placement_paid_status VARCHAR(32) DEFAULT 'not paid';

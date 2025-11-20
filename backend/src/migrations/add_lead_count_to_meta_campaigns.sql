-- Migration: Add lead_count column to meta_campaigns table
ALTER TABLE meta_campaigns ADD COLUMN lead_count INTEGER DEFAULT 0;

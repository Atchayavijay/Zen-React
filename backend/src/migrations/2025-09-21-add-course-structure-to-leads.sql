-- Migration: Add course_structure field to leads table for single/multi course support
ALTER TABLE leads
  ADD COLUMN course_structure VARCHAR(16) DEFAULT 'single';
-- Possible values: 'single', 'multi'

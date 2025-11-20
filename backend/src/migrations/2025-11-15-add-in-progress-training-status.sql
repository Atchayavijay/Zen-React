DO $$
BEGIN
  -- Ensure the enum type exists before attempting to modify it
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'training_status_enum_clean'
  ) THEN
    -- Add the new value only if it is missing
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'training_status_enum_clean'
        AND e.enumlabel = 'in_progress'
    ) THEN
      ALTER TYPE training_status_enum_clean ADD VALUE IF NOT EXISTS 'in_progress';
    END IF;
  END IF;
END
$$;


-- V6: Add date-based scratchpad storage
-- Each day gets its own scratchpad entry

-- Add date column
ALTER TABLE "Scratchpad" ADD COLUMN IF NOT EXISTS date VARCHAR(10);

-- Set existing row's date based on updatedAt (convert millis to date)
UPDATE "Scratchpad"
SET date = TO_CHAR(TO_TIMESTAMP("updatedAt" / 1000), 'YYYY-MM-DD')
WHERE date IS NULL;

-- Make date NOT NULL and UNIQUE
ALTER TABLE "Scratchpad" ALTER COLUMN date SET NOT NULL;
ALTER TABLE "Scratchpad" ADD CONSTRAINT "uq_Scratchpad_date" UNIQUE (date);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS "idx_Scratchpad_date" ON "Scratchpad"(date);

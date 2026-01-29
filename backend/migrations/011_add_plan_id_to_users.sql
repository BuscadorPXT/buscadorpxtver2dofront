-- Migration: Add planId to users table
-- Links users to their subscribed plan

ALTER TABLE users ADD COLUMN "planId" UUID;

-- Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_plan 
  FOREIGN KEY ("planId") REFERENCES plans(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_users_plan_id ON users("planId");

-- Comment for documentation
COMMENT ON COLUMN users."planId" IS 'Reference to the plan the user is subscribed to (determines concurrent IP limit)';

-- MIGRATION: 20260411_notifications_system.sql
-- Description: Table for Formal Manager Notifications (Positive, Negative, Medical)

CREATE TABLE IF NOT EXISTS hr_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collab_id UUID REFERENCES employees(id),
    type VARCHAR(50) NOT NULL, -- 'MEDICAL', 'POSITIVE', 'NEGATIVE', 'OPERATIONAL'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Operational Context
    vehicle_id VARCHAR(100),
    plate VARCHAR(20),
    route VARCHAR(255),
    
    metadata JSONB, -- For additional logs
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sender_id UUID REFERENCES auth.users(id) -- RH/Admin who registered
);

-- Index for fast lookup by manager
CREATE INDEX idx_hr_notif_collab ON hr_notifications(collab_id);
CREATE INDEX idx_hr_notif_created ON hr_notifications(created_at DESC);

COMMENT ON TABLE hr_notifications IS 'Formal record of notifications sent to managers based on HR occurrences.';

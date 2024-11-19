-- // backend/database/schema.sql

-- Users table

CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY,
                                                    clerk_user_id VARCHAR(255) NOT NULL,
                                                                               name VARCHAR(255),
                                                                                    email VARCHAR(255),
                                                                                          username VARCHAR(255),
                                                                                                   first_name VARCHAR(255),
                                                                                                              last_name VARCHAR(255),
                                                                                                                        phone VARCHAR(20),
                                                                                                                              role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('employee',
                                                                                                                                                                                  'manager',
                                                                                                                                                                                  'admin')), profile_image BYTEA,
                                                                                                                                                                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                          is_whitelisted BOOLEAN DEFAULT FALSE);

-- User constraints

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_key;


ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_clerk_user_id_key;


ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);


ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);

-- Drop existing tables for clean rebuild

DROP TABLE IF EXISTS schedules CASCADE;


DROP TABLE IF EXISTS availability CASCADE;


DROP TABLE IF EXISTS time_logs CASCADE;


DROP TABLE IF EXISTS notifications CASCADE;

-- Schedules table

CREATE TABLE schedules
    (id SERIAL PRIMARY KEY,
                       manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                                                         employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE, date DATE NOT NULL,
                                                                                                                                               shift_type VARCHAR(10) CHECK (shift_type IN ('morning',
                                                                                                                                                                                            'afternoon')), status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled',
                                                                                                                                                                                                                                                                    'confirmed',
                                                                                                                                                                                                                                                                    'dropped',
                                                                                                                                                                                                                                                                    'extra')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                                                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                                                                                                         CONSTRAINT valid_schedule_date CHECK (date >= '2024-01-01'
                                                                                                                                                                                                                                                                                                                                                                               AND date <= '2030-12-31'));

-- Time logs table

CREATE TABLE time_logs
    (id SERIAL PRIMARY KEY,
                       user_id INT REFERENCES users(id) ON DELETE CASCADE,
                                                                  clock_in TIMESTAMP NOT NULL,
                                                                                     clock_out TIMESTAMP,
                                                                                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                         CONSTRAINT valid_clock_times CHECK (clock_out IS NULL
                                                                                                                                                                                             OR clock_out > clock_in));

-- Availability table

CREATE TABLE availability
    (id SERIAL PRIMARY KEY,
                       user_id INT REFERENCES users(id) ON DELETE CASCADE,
                                                                  week_start DATE NOT NULL,
                                                                                  monday_morning BOOLEAN DEFAULT false,
                                                                                                                 monday_afternoon BOOLEAN DEFAULT false,
                                                                                                                                                  tuesday_morning BOOLEAN DEFAULT false,
                                                                                                                                                                                  tuesday_afternoon BOOLEAN DEFAULT false,
                                                                                                                                                                                                                    wednesday_morning BOOLEAN DEFAULT false,
                                                                                                                                                                                                                                                      wednesday_afternoon BOOLEAN DEFAULT false,
                                                                                                                                                                                                                                                                                          thursday_morning BOOLEAN DEFAULT false,
                                                                                                                                                                                                                                                                                                                           thursday_afternoon BOOLEAN DEFAULT false,
                                                                                                                                                                                                                                                                                                                                                              friday_morning BOOLEAN DEFAULT false,
                                                                                                                                                                                                                                                                                                                                                                                             friday_afternoon BOOLEAN DEFAULT false,
                                                                                                                                                                                                                                                                                                                                                                                                                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                                                                                                                                                                                                                           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        UNIQUE(user_id, week_start),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        CONSTRAINT week_start_monday CHECK (EXTRACT(DOW
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    FROM week_start) = 1));

-- Notifications table

CREATE TABLE notifications
    (id SERIAL PRIMARY KEY,
                       user_id INT REFERENCES users(id) ON DELETE CASCADE,
                                                                  message TEXT NOT NULL,
                                                                               type VARCHAR(50) NOT NULL,
                                                                                                read BOOLEAN DEFAULT FALSE,
                                                                                                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                                                                                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

-- Create indexes for better performance

CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);


CREATE INDEX idx_schedules_employee_date ON schedules(employee_id, date);


CREATE INDEX idx_schedules_manager_date ON schedules(manager_id, date);


CREATE INDEX idx_schedules_status ON schedules(status);


CREATE INDEX idx_availability_user_week ON availability(user_id, week_start);


CREATE INDEX idx_notifications_user ON notifications(user_id, read);


CREATE INDEX idx_time_logs_user ON time_logs(user_id);

-- Create view for availability with user information

CREATE OR REPLACE VIEW availability_with_user AS
SELECT a.*,
       u.first_name,
       u.last_name,
       u.email,
       u.role
FROM availability a
JOIN users u ON a.user_id = u.id;

-- Create view for schedule summaries

CREATE OR REPLACE VIEW schedule_summary AS
SELECT s.employee_id,
       u.first_name,
       u.last_name,
       COUNT(*) as total_shifts,
       COUNT(*) FILTER (
                        WHERE s.status = 'confirmed') as confirmed_shifts,
       COUNT(*) FILTER (
                        WHERE s.status = 'dropped') as dropped_shifts,
       COUNT(*) FILTER (
                        WHERE s.shift_type = 'morning') as morning_shifts,
       COUNT(*) FILTER (
                        WHERE s.shift_type = 'afternoon') as afternoon_shifts
FROM schedules s
JOIN users u ON s.employee_id = u.id
GROUP BY s.employee_id,
         u.first_name,
         u.last_name;

-- Update timestamp function

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Foreign key constraints

ALTER TABLE schedules
DROP CONSTRAINT IF EXISTS schedules_employee_id_fkey,
                          ADD CONSTRAINT schedules_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES users(id) ON
DELETE CASCADE;


ALTER TABLE schedules
DROP CONSTRAINT IF EXISTS schedules_manager_id_fkey,
                          ADD CONSTRAINT schedules_manager_id_fkey
FOREIGN KEY (manager_id) REFERENCES users(id) ON
DELETE CASCADE;


ALTER TABLE availability
DROP CONSTRAINT IF EXISTS availability_user_id_fkey,
                          ADD CONSTRAINT availability_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON
DELETE CASCADE;


ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
                          ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON
DELETE CASCADE;

-- Create triggers for updated_at columns

CREATE TRIGGER update_schedules_timestamp
BEFORE
UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_availability_timestamp
BEFORE
UPDATE ON availability
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_time_logs_timestamp
BEFORE
UPDATE ON time_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_notifications_timestamp
BEFORE
UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_schedules_week ON schedules(date);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at);

-- List all indices for verification
SELECT 
    schemaname as schema,
    tablename as table,
    indexname as index,
    indexdef as definition
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename,
    indexname;
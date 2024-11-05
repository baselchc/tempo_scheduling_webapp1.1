-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
    profile_image BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_whitelisted BOOLEAN DEFAULT FALSE
);

-- Drop existing constraints and add new ones for email and clerk_user_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_clerk_user_id_key;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);

-- Add new columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image') THEN
        ALTER TABLE users ADD COLUMN profile_image BYTEA;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

UPDATE users SET role = 'employee' WHERE role IS NULL;

-- Make email optional
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    shift_start TIMESTAMP NOT NULL,
    shift_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS availability CASCADE;

-- Availability table 
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL, 
    monday_start TIME CHECK (monday_start >= '09:00' AND monday_start <= '17:00'),
    monday_end TIME CHECK (monday_end >= '09:00' AND monday_end <= '17:00'),
    tuesday_start TIME CHECK (tuesday_start >= '09:00' AND tuesday_start <= '17:00'),
    tuesday_end TIME CHECK (tuesday_end >= '09:00' AND tuesday_end <= '17:00'),
    wednesday_start TIME CHECK (wednesday_start >= '09:00' AND wednesday_start <= '17:00'),
    wednesday_end TIME CHECK (wednesday_end >= '09:00' AND wednesday_end <= '17:00'),
    thursday_start TIME CHECK (thursday_start >= '09:00' AND thursday_start <= '17:00'),
    thursday_end TIME CHECK (thursday_end >= '09:00' AND thursday_end <= '17:00'),
    friday_start TIME CHECK (friday_start >= '09:00' AND friday_start <= '17:00'),
    friday_end TIME CHECK (friday_end >= '09:00' AND friday_end <= '17:00'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_monday_time CHECK (monday_end > monday_start),
    CONSTRAINT valid_tuesday_time CHECK (tuesday_end > tuesday_start),
    CONSTRAINT valid_wednesday_time CHECK (wednesday_end > wednesday_start),
    CONSTRAINT valid_thursday_time CHECK (thursday_end > thursday_start),
    CONSTRAINT valid_friday_time CHECK (friday_end > friday_start),
    UNIQUE(user_id, week_start)
);

-- Create an index for faster queries
CREATE INDEX idx_availability_user_week ON availability(user_id, week_start);

-- Create view to make it easier to get availability with user information
CREATE OR REPLACE VIEW availability_with_user AS
SELECT 
    a.*,
    u.first_name,
    u.last_name,
    u.email,
    u.role
FROM availability a
JOIN users u ON a.user_id = u.id;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notifications table for manager notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Manager schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    week_period DATE,
    shift_start TIMESTAMP NOT NULL,
    shift_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- If you need to update existing tables, run these separately:
ALTER TABLE IF EXISTS schedules 
    DROP CONSTRAINT IF EXISTS schedules_user_id_fkey,
    ADD CONSTRAINT schedules_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS time_logs 
    DROP CONSTRAINT IF EXISTS time_logs_user_id_fkey,
    ADD CONSTRAINT time_logs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.schedules
    DROP CONSTRAINT IF EXISTS schedules_manager_id_fkey,
    ADD CONSTRAINT schedules_manager_id_fkey 
    FOREIGN KEY (manager_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
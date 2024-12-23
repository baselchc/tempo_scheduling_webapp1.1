-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) CHECK (role IN ('employee', 'manager', 'admin')) DEFAULT 'employee',
    profile_image BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_whitelisted BOOLEAN DEFAULT FALSE
);

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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Make email optional
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Available Shifts table
CREATE TABLE IF NOT EXISTS available_shifts (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER NOT NULL,
    assigned_to VARCHAR(255), -- NULL if the shift is available
    week_period DATE,
    shift_start TIMESTAMP NOT NULL,
    shift_end TIMESTAMP NOT NULL,
    reason VARCHAR(255), -- Optional reason when a shift is dropped
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- My Shifts table
CREATE TABLE IF NOT EXISTS my_shifts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id), -- this must reference the integer ID from `users` table
    shift_start TIMESTAMP NOT NULL,
    shift_end TIMESTAMP NOT NULL,
    reason VARCHAR(255), -- Store the reason why a user dropped a shift
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    status VARCHAR(20) CHECK (status IN ('Available', 'Not Available')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, day_of_week)
);

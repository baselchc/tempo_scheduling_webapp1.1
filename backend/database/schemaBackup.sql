-- Create table: availability
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    week_start DATE NOT NULL,
    monday_morning BOOLEAN,
    monday_afternoon BOOLEAN,
    tuesday_morning BOOLEAN,
    tuesday_afternoon BOOLEAN,
    wednesday_morning BOOLEAN,
    wednesday_afternoon BOOLEAN,
    thursday_morning BOOLEAN,
    thursday_afternoon BOOLEAN,
    friday_morning BOOLEAN,
    friday_afternoon BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create table: available_shifts
CREATE TABLE available_shifts (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER,
    assigned_to VARCHAR(255),
    week_period DATE,
    shift_start TIMESTAMP NOT NULL,
    shift_end TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP,
    user_id VARCHAR
);

-- Create table: messages
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    from_user_id INTEGER,
    to_user_id INTEGER,
    message TEXT
);

-- Create table: my_shifts
CREATE TABLE my_shifts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR,
    shift_start TIMESTAMP NOT NULL,
    shift_end TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP,
    assigned_to VARCHAR,
    week_period DATE,
    manager_id INTEGER
);

-- Create table: notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    to_user_id INTEGER,
    from_user_id INTEGER,
    message TEXT NOT NULL,
    is_read BOOLEAN,
    broadcast BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    conversation_id VARCHAR
);

-- Create table: schedules
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER,
    employee_id INTEGER,
    date DATE NOT NULL,
    shift_type VARCHAR(10),
    status VARCHAR(20),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create table: time_logs
CREATE TABLE time_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    username VARCHAR(255),
    profile_image BYTEA,
    role VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_whitelisted BOOLEAN
);

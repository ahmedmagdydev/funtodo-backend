-- Migration: Create sensors and sensor_values tables
-- Created at: 2025-02-15 16:17:53

-- Create sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sensor_values table
CREATE TABLE IF NOT EXISTS sensor_values (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  key_name VARCHAR(255) NOT NULL,
  min_value NUMERIC,  -- Optional field: can be NULL if not provided
  max_value NUMERIC,  -- Optional field: can be NULL if not provided
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (sensor_id, key_name)  -- Ensures a sensor doesn't have duplicate keys
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sensor_values_sensor_id ON sensor_values(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_values_key_name ON sensor_values(key_name);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for both tables
CREATE TRIGGER update_sensors_updated_at
    BEFORE UPDATE ON sensors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensor_values_updated_at
    BEFORE UPDATE ON sensor_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Rollback SQL
-- DROP TRIGGER IF EXISTS update_sensor_values_updated_at ON sensor_values;
-- DROP TRIGGER IF EXISTS update_sensors_updated_at ON sensors;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS sensor_values;
-- DROP TABLE IF EXISTS sensors;

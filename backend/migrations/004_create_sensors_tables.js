// Create sensors and sensor_values tables
exports.up = (pgm) => {
  // Create sensors table
  pgm.createTable('sensors', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create sensor_values table
  pgm.createTable('sensor_values', {
    id: 'id',
    sensor_id: {
      type: 'integer',
      notNull: true,
      references: 'sensors',
      onDelete: 'CASCADE',
    },
    key_name: { type: 'varchar(255)', notNull: true },
    min_value: { type: 'numeric' },
    max_value: { type: 'numeric' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Add unique constraint
  pgm.addConstraint('sensor_values', 'unique_sensor_key', {
    unique: ['sensor_id', 'key_name'],
  });

  // Add indexes for better query performance
  pgm.createIndex('sensor_values', 'sensor_id');
  pgm.createIndex('sensor_values', 'key_name');

  // Create updated_at trigger function
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'trigger',
      language: 'plpgsql',
    },
    `
    BEGIN
        NEW.updated_at = current_timestamp;
        RETURN NEW;
    END;
    `
  );

  // Create triggers for both tables
  pgm.createTrigger('sensors', 'update_sensors_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'update_updated_at_column',
  });

  pgm.createTrigger('sensor_values', 'update_sensor_values_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'update_updated_at_column',
  });
};

exports.down = (pgm) => {
  // Drop triggers first
  pgm.dropTrigger('sensor_values', 'update_sensor_values_updated_at');
  pgm.dropTrigger('sensors', 'update_sensors_updated_at');
  
  // Drop function
  pgm.dropFunction('update_updated_at_column', []);
  
  // Drop tables (sensor_values must be dropped first due to foreign key)
  pgm.dropTable('sensor_values');
  pgm.dropTable('sensors');
};

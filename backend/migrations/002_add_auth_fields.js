exports.up = (pgm) => {
  // First add columns as nullable
  pgm.addColumns('users', {
    password: { type: 'varchar(255)', notNull: false },
    salt: { type: 'varchar(255)', notNull: false }
  });

  // Set default values for existing users
  pgm.sql(`
    UPDATE users 
    SET password = 'LEGACY_USER', 
        salt = 'LEGACY_SALT' 
    WHERE password IS NULL OR salt IS NULL
  `);

  // Now make the columns not nullable
  pgm.alterColumn('users', 'password', { notNull: true });
  pgm.alterColumn('users', 'salt', { notNull: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['password', 'salt']);
};

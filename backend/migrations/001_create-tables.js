exports.up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    tier: { type: "varchar(20)", notNull: true, default: "free" },
    stripe_customer_id: { type: "varchar(255)" },
    active: { type: "boolean", notNull: true, default: false },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("subscriptions", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "integer",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE",
    },
    stripe_subscription_id: { type: "varchar(255)", notNull: true },
    status: { type: "varchar(50)", notNull: true },
    current_period_end: { type: "timestamp", notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("subscriptions");
  pgm.dropTable("users");
};

// set active default to false
exports.up = (pgm) => {
  pgm.sql("UPDATE users SET active = false WHERE active IS NULL");
};

exports.down = (pgm) => {
  pgm.sql("UPDATE users SET active = true WHERE active IS NULL");
};

const { pool } = require("../db/pool");
const logger = require("../utils/logger");

class SensorModel {
  /**
   * Find a sensor by its ID, including its values
   * @param {number} id - The sensor ID
   * @returns {Promise<Object|null>} The sensor object with its values
   */
  static async findById(id) {
    try {
      const sensorResult = await pool.query(
        'SELECT * FROM sensors WHERE id = $1',
        [id]
      );

      if (!sensorResult.rows[0]) return null;

      const valuesResult = await pool.query(
        'SELECT * FROM sensor_values WHERE sensor_id = $1',
        [id]
      );

      return {
        ...sensorResult.rows[0],
        values: valuesResult.rows,
      };
    } catch (error) {
      logger.error('Error in findById:', error);
      throw error;
    }
  }

  /**
   * Find all sensors with pagination
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term for sensor name
   * @param {string} options.sortBy - Field to sort by
   * @param {string} options.sortOrder - Sort order (asc/desc)
   * @returns {Promise<{sensors: Array, total: number}>} Sensors and total count
   */
  static async findAll({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc' }) {
    try {
      const offset = (page - 1) * limit;
      const searchTerm = `%${search}%`;

      // Get total count for pagination
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM sensors WHERE name ILIKE $1',
        [searchTerm]
      );

      // Get sensors with pagination and sorting
      const sensorsResult = await pool.query(
        `SELECT * FROM sensors 
         WHERE name ILIKE $1 
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      );

      // Get all sensor values for the returned sensors
      const sensorIds = sensorsResult.rows.map(sensor => sensor.id);
      const valuesResult = sensorIds.length > 0 ? await pool.query(
        'SELECT * FROM sensor_values WHERE sensor_id = ANY($1)',
        [sensorIds]
      ) : { rows: [] };

      // Group values by sensor_id
      const valuesBySensorId = valuesResult.rows.reduce((acc, value) => {
        acc[value.sensor_id] = acc[value.sensor_id] || [];
        acc[value.sensor_id].push(value);
        return acc;
      }, {});

      // Attach values to their sensors
      const sensors = sensorsResult.rows.map(sensor => ({
        ...sensor,
        values: valuesBySensorId[sensor.id] || [],
      }));

      return {
        sensors,
        total: parseInt(countResult.rows[0].count),
      };
    } catch (error) {
      logger.error('Error in findAll:', error);
      throw error;
    }
  }

  /**
   * Create a new sensor with its values
   * @param {Object} data - The sensor data
   * @param {string} data.name - Sensor name
   * @param {Array} data.values - Sensor values
   * @returns {Promise<Object>} The created sensor
   */
  static async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create sensor
      const sensorResult = await client.query(
        'INSERT INTO sensors (name) VALUES ($1) RETURNING *',
        [data.name]
      );

      const sensor = sensorResult.rows[0];

      // Create sensor values if provided
      if (data.values && data.values.length > 0) {
        const valuePromises = data.values.map(value =>
          client.query(
            'INSERT INTO sensor_values (sensor_id, key_name, min_value, max_value) VALUES ($1, $2, $3, $4) RETURNING *',
            [sensor.id, value.key_name, value.min_value, value.max_value]
          )
        );

        const valueResults = await Promise.all(valuePromises);
        sensor.values = valueResults.map(result => result.rows[0]);
      }

      await client.query('COMMIT');
      return sensor;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in create:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update a sensor and its values
   * @param {number} id - The sensor ID
   * @param {Object} data - The update data
   * @returns {Promise<Object>} The updated sensor
   */
  static async update(id, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update sensor if name is provided
      if (data.name) {
        await client.query(
          'UPDATE sensors SET name = $1 WHERE id = $2',
          [data.name, id]
        );
      }

      // Update or create sensor values if provided
      if (data.values && data.values.length > 0) {
        for (const value of data.values) {
          if (value.id) {
            // Update existing value
            await client.query(
              'UPDATE sensor_values SET key_name = $1, min_value = $2, max_value = $3 WHERE id = $4 AND sensor_id = $5',
              [value.key_name, value.min_value, value.max_value, value.id, id]
            );
          } else {
            // Create new value
            await client.query(
              'INSERT INTO sensor_values (sensor_id, key_name, min_value, max_value) VALUES ($1, $2, $3, $4)',
              [id, value.key_name, value.min_value, value.max_value]
            );
          }
        }
      }

      await client.query('COMMIT');
      return this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in update:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a sensor and its values
   * @param {number} id - The sensor ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM sensors WHERE id = $1 RETURNING id',
        [id]
      );
      return !!result.rows[0];
    } catch (error) {
      logger.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = SensorModel;

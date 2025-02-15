import { z } from 'zod';

// Base schemas for timestamps
const timestampsSchema = z.object({
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Schema for sensor values
export const sensorValueSchema = timestampsSchema.extend({
  id: z.number(),
  sensor_id: z.number(),
  key_name: z.string(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
});

// Schema for sensor
export const sensorSchema = timestampsSchema.extend({
  id: z.number(),
  name: z.string(),
  values: z.array(sensorValueSchema).optional(),
});

// Schema for creating a new sensor
export const createSensorSchema = z.object({
  name: z.string(),
  values: z.array(
    z.object({
      key_name: z.string(),
      min_value: z.number().nullable().optional(),
      max_value: z.number().nullable().optional(),
    })
  ).optional(),
});

// Schema for updating a sensor
export const updateSensorSchema = z.object({
  name: z.string().optional(),
  values: z.array(
    z.object({
      id: z.number().optional(), // Optional for new values
      key_name: z.string(),
      min_value: z.number().nullable().optional(),
      max_value: z.number().nullable().optional(),
    })
  ).optional(),
});

// Schema for sensor data from MQTT
export const sensorDataSchema = z.object({
  value: z.number(),
  timestamp: z.string().datetime(),
});

// Infer TypeScript types from Zod schemas
export type Timestamps = z.infer<typeof timestampsSchema>;
export type SensorValue = z.infer<typeof sensorValueSchema>;
export type Sensor = z.infer<typeof sensorSchema>;
export type CreateSensor = z.infer<typeof createSensorSchema>;
export type UpdateSensor = z.infer<typeof updateSensorSchema>;
export type SensorData = z.infer<typeof sensorDataSchema>;

// Response types for the REST API
export type SensorResponse = {
  success: boolean;
  data: Sensor;
  message?: string;
};

export type SensorsResponse = {
  success: boolean;
  data: Sensor[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
  message?: string;
};

// Query parameters for GET /sensors endpoint
export const sensorQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SensorQuery = z.infer<typeof sensorQuerySchema>;

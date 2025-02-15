const { createSensorSchema } = require("../types/sensor.js");
const { z } = require("zod");
const express = require("express");
const SensorModel = require("../models/sensorModel");
const router = express.Router();

router.post("/sensors", async (req, res) => {
  try {
    const sensorData = createSensorSchema.parse(req.body);
    const sensor = await SensorModel.create(sensorData);
    res.json({ success: true, data: sensor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    } else {
      console.error("Error creating sensor:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
});

// Get all sensors with pagination
router.get("/sensors", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = req.query;
    const result = await SensorModel.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: result.sensors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
      },
    });
  } catch (error) {
    console.error("Error fetching sensors:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get sensor by ID
router.get("/sensors/:id", async (req, res) => {
  try {
    const sensor = await SensorModel.findById(Number(req.params.id));
    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: "Sensor not found",
      });
    }
    res.json({ success: true, data: sensor });
  } catch (error) {
    console.error("Error fetching sensor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update sensor
router.put("/sensors/:id", async (req, res) => {
  try {
    const sensorData = req.body;
    const sensor = await SensorModel.update(Number(req.params.id), sensorData);
    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: "Sensor not found",
      });
    }
    res.json({ success: true, data: sensor });
  } catch (error) {
    console.error("Error updating sensor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete sensor
router.delete("/sensors/:id", async (req, res) => {
  try {
    const deleted = await SensorModel.delete(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Sensor not found",
      });
    }
    res.json({
      success: true,
      message: "Sensor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sensor:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;

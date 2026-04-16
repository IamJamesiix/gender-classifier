const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3040;

// CORS header — required for grader to reach your server
app.use(cors({ origin: "*" }));

app.get("/api/classify", async (req, res) => {
  const { name } = req.query;

  // 1. Missing or empty name → 400
  if (!name || name.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Name query parameter is required",
    });
  }

  // 2. Non-string name → 422
  if (typeof name !== "string") {
    return res.status(422).json({
      status: "error",
      message: "Name must be a string",
    });
  }

  try {
    // 3. Call Genderize API
    const genderizeRes = await axios.get(
      `https://api.genderize.io/?name=${encodeURIComponent(name)}`
    );

    const { gender, probability, count } = genderizeRes.data;

    // 4. Edge case — no prediction available
    if (!gender || count === 0) {
      return res.status(200).json({
        status: "error",
        message: "No prediction available for the provided name",
      });
    }

    // 5. Process the data
    const sample_size = count;
    const is_confident = probability >= 0.7 && sample_size >= 100;
    const processed_at = new Date().toISOString();

    // 6. Return success response
    return res.status(200).json({
      status: "success",
      data: {
        name,
        gender,
        probability,
        sample_size,
        is_confident,
        processed_at,
      },
    });

  } catch (error) {
    // 7. Genderize API failed
    return res.status(502).json({
      status: "error",
      message: "Failed to reach external API",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
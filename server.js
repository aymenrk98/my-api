require("dotenv").config(); // load .env

const mongoose = require("mongoose");
const express = require("express");

const app = express();
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log(err));

// ✅ Schema
const rateSchema = new mongoose.Schema({
  from: String,
  to: String,
  rate: Number
});

const Rate = mongoose.model("Rate", rateSchema);

// ✅ Home route
app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

// ✅ GET rate
app.get("/rate/:from/:to", async (req, res) => {
  try {
    const { from, to } = req.params;

    const result = await Rate.findOne({ from, to });

    if (!result) {
      return res.status(404).json({ error: "Rate not found" });
    }

    res.json(result);

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ UPDATE / CREATE rate
app.post("/update-rate", async (req, res) => {
  try {
    const { from, to, rate } = req.body;

    let existing = await Rate.findOne({ from, to });

    if (existing) {
      existing.rate = rate;
      await existing.save();
    } else {
      await Rate.create({ from, to, rate });
    }

    res.json({ message: "Rate saved in MongoDB ✅" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Use dynamic port (IMPORTANT for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
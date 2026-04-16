const mongoose = require("mongoose");
const express = require("express");

const app = express();
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect("mongodb+srv://aymenrk:aymen123@cluster0.f5onjq1.mongodb.net/mydb?retryWrites=true&w=majority")
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log(err));

// ✅ Create schema
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

// ✅ GET rate (FROM DATABASE)
app.get("/rate/:from/:to", async (req, res) => {
  const { from, to } = req.params;

  try {
    const result = await Rate.findOne({ from, to });

    if (!result) {
      return res.status(404).json({ error: "Rate not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ UPDATE / CREATE rate (SAVE TO DATABASE)
app.post("/update-rate", async (req, res) => {
  const { from, to, rate } = req.body;

  try {
    let existing = await Rate.findOne({ from, to });

    if (existing) {
      existing.rate = rate;
      await existing.save();
    } else {
      await Rate.create({ from, to, rate });
    }

    res.json({ message: "Rate saved in MongoDB ✅" });

  } catch (error) {
    res.status(500).json({ error: "Error saving rate" });
  }
});

// ✅ Start server
app.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});
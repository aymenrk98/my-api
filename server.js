require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");

const app = express();
app.use(express.json());

 mongoose.connect("mongodb+srv://aymenrk:aymen123@cluster0.f5onjq1.mongodb.net/mydb?retryWrites=true&w=majority")
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log("MongoDB error:", err));

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

// ✅ GET rate FROM DATABASE
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

// ✅ UPDATE / CREATE rate IN DATABASE
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

    res.json({ message: "Saved in MongoDB ✅" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Dynamic port (IMPORTANT for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
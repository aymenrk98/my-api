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

 app.get("/", (req, res) => {
  res.send("API is working ");
});

 app.get("/rate/:from/:to", async (req, res) => {
  try {
    const { from, to } = req.params;

    const result = await Rate.findOne({ from, to });

    if (!result) {
      return res.status(404).json({ error: "Rate not found" });
    }

    res.json({
      from: result.from,
      to: result.to,
      rate: result.rate
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

 app.post("/update-rate", async (req, res) => {
  try {
    const { from, to, rate } = req.body;

    if (!from || !to || !rate) {
      return res.status(400).json({ error: "Missing data" });
    }

    let existing = await Rate.findOne({ from, to });

    if (existing) {
      existing.rate = rate;
      await existing.save();
    } else {
      await Rate.create({ from, to, rate });
    }

    res.json({ message: "Saved in MongoDB " });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/convert/:from/:to/:amount", async (req, res) => {
  try {
    const { from, to, amount } = req.params;

    const result = await Rate.findOne({ from, to });

    if (!result) {
      return res.status(404).json({ error: "Rate not found" });
    }

    const converted = Number(amount) * result.rate;

    res.json({
      from,
      to,
      amount: Number(amount),
      rate: result.rate,
      result: converted
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
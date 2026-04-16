const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

console.log("🔥 SERVER STARTED");


mongoose.connect(
  "mongodb+srv://aymenrk:aymen123@cluster0.f5onjq1.mongodb.net/mydb?retryWrites=true&w=majority"
)
.then(() => console.log("MongoDB connected ✅"))
.catch(err => console.log("MongoDB error:", err));


const rateSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  rate: { type: Number, required: true }
});

const Rate = mongoose.model("Rate", rateSchema);

app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

app.get("/rates", async (req, res) => {
  console.log("✅ /rates HIT");

  try {
    const rates = await Rate.find();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/rate/:from/:to", async (req, res) => {
  try {
    const from = req.params.from.toUpperCase();
    const to = req.params.to.toUpperCase();

    const result = await Rate.findOne({ from, to });

    if (!result) {
      return res.status(404).json({ error: "Rate not found" });
    }

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/update-rate", async (req, res) => {
  try {
    let { from, to, rate } = req.body;

    if (!from || !to || !rate) {
      return res.status(400).json({ error: "Missing data" });
    }

    from = from.toUpperCase();
    to = to.toUpperCase();

    await Rate.findOneAndUpdate(
      { from, to },
      { rate },
      { upsert: true, new: true }
    );

    res.json({ message: "Saved in MongoDB ✅" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get("/convert/:from/:to/:amount", async (req, res) => {
  console.log("✅ /convert HIT");

  try {
    const from = req.params.from.toUpperCase();
    const to = req.params.to.toUpperCase();
    const amount = Number(req.params.amount);

    if (isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a number" });
    }

    const result = await Rate.findOne({ from, to });

    if (!result) {
      return res.status(404).json({ error: "Rate not found" });
    }

    const converted = amount * result.rate;

    res.json({
      from,
      to,
      amount,
      rate: result.rate,
      result: converted
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const PORT = 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
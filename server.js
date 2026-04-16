const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

mongoose.connect(
  "mongodb+srv://aymenrk:aymen123@cluster0.f5onjq1.mongodb.net/mydb?retryWrites=true&w=majority"
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const rateSchema = new mongoose.Schema({
  currency: { type: String, required: true, uppercase: true },
  buy: { type: Number, required: true },
  sell: { type: Number, required: true }
});

const Rate = mongoose.model("Rate", rateSchema);

app.get("/", (req, res) => {
  res.send("API is working");
});

app.get("/rates", async (req, res) => {
  try {
    const rates = await Rate.find();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/rate/:currency", async (req, res) => {
  try {
    const currency = req.params.currency.toUpperCase();
    const result = await Rate.findOne({ currency });

    if (!result) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/update-rate", async (req, res) => {
  try {
    let { currency, buy, sell } = req.body;

    if (!currency || !buy || !sell) {
      return res.status(400).json({ error: "Missing data" });
    }

    currency = currency.toUpperCase();

    await Rate.findOneAndUpdate(
      { currency },
      { buy, sell },
      { upsert: true, new: true }
    );

    res.json({ message: "Rate saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/convert/:currency/:amount", async (req, res) => {
  try {
    const currency = req.params.currency.toUpperCase();
    const amount = Number(req.params.amount);

    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const rate = await Rate.findOne({ currency });

    if (!rate) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json({
      currency,
      amount,
      buy_price: rate.buy,
      sell_price: rate.sell,
      total_buy: amount * rate.buy,
      total_sell: amount * rate.sell
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
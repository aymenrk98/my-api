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
  type: { type: String, required: true },

  currency: { type: String, uppercase: true },

  liquide: {
    buy: Number,
    sell: Number
  },

  digital: {
    buy: Number,
    sell: Number
  },

  gold: {
    local: {
      buy: Number,
      sell: Number
    },
    importation: {
      buy: Number,
      sell: Number
    },
    casser: {
      buy: Number,
      sell: Number
    }
  }
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

app.get("/currency/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const result = await Rate.findOne({ type: "currency", currency: code });

    if (!result) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/gold", async (req, res) => {
  try {
    const result = await Rate.findOne({ type: "gold" });

    if (!result) {
      return res.status(404).json({ error: "Gold not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/update-rate", async (req, res) => {
  try {
    const data = req.body;

    if (!data.type) {
      return res.status(400).json({ error: "Type required" });
    }

    let filter = {};

    if (data.type === "currency") {
      data.currency = data.currency.toUpperCase();
      filter = { type: "currency", currency: data.currency };
    }

    if (data.type === "gold") {
      filter = { type: "gold" };
    }

   await Rate.findOneAndUpdate(
  filter,
  data,
  { upsert: true, returnDocument: "after" }
);

    res.json({ message: "Saved" });

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

    const rate = await Rate.findOne({ type: "currency", currency });

    if (!rate) {
      return res.status(404).json({ error: "Currency not found" });
    }

    res.json({
      currency,
      amount,
      liquide: {
        buy: rate.liquide.buy,
        sell: rate.liquide.sell,
        total_buy: amount * rate.liquide.buy,
        total_sell: amount * rate.liquide.sell
      },
      digital: {
        buy: rate.digital.buy,
        sell: rate.digital.sell,
        total_buy: amount * rate.digital.buy,
        total_sell: amount * rate.digital.sell
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
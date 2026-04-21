const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

/* =========================
   ✅ MongoDB Connection
========================= */
mongoose.connect(
  "mongodb+srv://aymenrk:aymen123@cluster0.f5onjq1.mongodb.net/mydb?retryWrites=true&w=majority"
)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

/* =========================
   ✅ RATE SCHEMA
========================= */
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

}, {
  timestamps: true
});

const Rate = mongoose.model("Rate", rateSchema);

/* =========================
   ✅ OFFER SCHEMA (NEW)
========================= */
const offerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  currency: String,
  type: String, // BUY or SELL
  amount: Number,
  price: Number
}, {
  timestamps: true
});

const Offer = mongoose.model("Offer", offerSchema);

/* =========================
   ✅ BASIC ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("API is working");
});

/* =========================
   ✅ GET ALL RATES
========================= */
app.get("/rates", async (req, res) => {
  const data = await Rate.find();

  const formatted = data.map(r => {
    if (r.type === "currency") {
      return {
        type: "currency",
        currency: r.currency,
        liquide: r.liquide,
        digital: r.digital,
        updatedAt: new Date(r.updatedAt).toLocaleString()
      };
    }

    if (r.type === "gold") {
      return {
        type: "gold",
        gold: r.gold,
        updatedAt: new Date(r.updatedAt).toLocaleString()
      };
    }
  });

  res.json(formatted);
});

/* =========================
   ✅ GET ONE CURRENCY
========================= */
app.get("/currency/:code", async (req, res) => {
  const code = req.params.code.toUpperCase();
  const rate = await Rate.findOne({ type: "currency", currency: code });

  if (!rate) return res.status(404).json({ error: "Not found" });

  res.json(rate);
});

/* =========================
   ✅ GET GOLD
========================= */
app.get("/gold", async (req, res) => {
  const gold = await Rate.findOne({ type: "gold" });

  if (!gold) return res.status(404).json({ error: "Gold not found" });

  res.json(gold);
});

/* =========================
   ✅ UPDATE RATE
========================= */
app.post("/update-rate", async (req, res) => {
  try {
    const data = req.body;

    if (!data.type) {
      return res.status(400).json({ error: "Type required" });
    }

    if (data.type === "currency") {
      const { currency, liquide, digital } = data;

      if (!currency || !liquide || !digital) {
        return res.status(400).json({ error: "Missing currency data" });
      }

      await Rate.findOneAndUpdate(
        { type: "currency", currency: currency.toUpperCase() },
        {
          type: "currency",
          currency: currency.toUpperCase(),
          liquide,
          digital
        },
        { upsert: true }
      );
    }

    if (data.type === "gold") {
      const { gold } = data;

      if (!gold) {
        return res.status(400).json({ error: "Missing gold data" });
      }

      await Rate.findOneAndUpdate(
        { type: "gold" },
        {
          type: "gold",
          gold
        },
        { upsert: true }
      );
    }

    res.json({ message: "Saved" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   ✅ GET LAST UPDATE
========================= */
app.get("/last-update", async (req, res) => {
  const last = await Rate.findOne().sort({ updatedAt: -1 });

  if (!last) return res.json({ lastUpdate: null });

  res.json({
    lastUpdate: new Date(last.updatedAt).toLocaleString()
  });
});

/* =========================
   🔥 OFFERS ROUTES (NEW)
========================= */

// ✅ CREATE OFFER
app.post("/offers", async (req, res) => {
  try {
    const offer = new Offer(req.body);
    await offer.save();

    res.status(201).json({
      message: "Offer saved",
      offer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET ALL OFFERS
app.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
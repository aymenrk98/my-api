const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ------------------------------------------------
// 🔥 CORS
// ------------------------------------------------
app.use(cors());

app.use(express.json());

// ------------------------------------------------
// 🔥 MONGODB
// ------------------------------------------------
mongoose.connect(
  "mongodb+srv://aymenrk:aymen123@cluster0.f5onjq1.mongodb.net/mydb?retryWrites=true&w=majority"
)

.then(() => {
  console.log("MongoDB connected");
})

.catch((err) => {
  console.log(err);
});

// ------------------------------------------------
// 🔥 SCHEMA
// ------------------------------------------------
const rateSchema = new mongoose.Schema({

  type: {
    type: String,
    required: true
  },

  currency: {
    type: String,
    uppercase: true
  },

  liquide: {
    buy: Number,
    sell: Number
  },

  digital: {
    buy: Number,
    sell: Number
  },

  buy: Number,
  sell: Number,

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

const Rate = mongoose.model(
  "Rate",
  rateSchema
);

// ------------------------------------------------
// 🔥 ROOT
// ------------------------------------------------
app.get("/", (req, res) => {

  res.send("API is working");
});

// ------------------------------------------------
// 🔥 GET ALL RATES
// ------------------------------------------------
app.get("/rates", async (req, res) => {

  try {

    // 🔥 disable cache
    res.set({

      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",

      "Pragma":
        "no-cache",

      "Expires":
        "0",

      "Surrogate-Control":
        "no-store"
    });

    const data = await Rate.find();

    const formatted = data.map((r) => {

      // ============================================
      // 🔥 CURRENCY
      // ============================================
      if (r.type === "currency") {

        return {

          type: "currency",

          currency: r.currency,

          liquide: r.liquide,

          digital: r.digital,

          updatedAt:
            new Date(
              r.updatedAt
            ).toLocaleString()
        };
      }

      // ============================================
      // 🔥 GOLD
      // ============================================
      if (r.type === "gold") {

        return {

          type: "gold",

          gold: r.gold,

          updatedAt:
            new Date(
              r.updatedAt
            ).toLocaleString()
        };
      }
    });

    res.json(formatted);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

// ------------------------------------------------
// 🔥 GET ONE CURRENCY
// ------------------------------------------------
app.get("/currency/:code", async (req, res) => {

  try {

    const code =
      req.params.code.toUpperCase();

    const rate =
      await Rate.findOne({

        type: "currency",

        currency: code
      });

    if (!rate) {

      return res.status(404).json({
        error: "Not found"
      });
    }

    res.json(rate);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

// ------------------------------------------------
// 🔥 GET GOLD
// ------------------------------------------------
app.get("/gold", async (req, res) => {

  try {

    const gold =
      await Rate.findOne({
        type: "gold"
      });

    if (!gold) {

      return res.status(404).json({
        error: "Gold not found"
      });
    }

    res.json(gold);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

// ------------------------------------------------
// 🔥 UPDATE RATE
// ------------------------------------------------
app.post("/update-rate", async (req, res) => {

  try {

    const data = req.body;

    // ============================================
    // 🔥 VALIDATION
    // ============================================
    if (!data.type) {

      return res.status(400).json({
        error: "Type required"
      });
    }

    // ============================================
    // 🔥 UPDATE CURRENCY
    // ============================================
    if (data.type === "currency") {

      const {
        currency,
        liquide,
        digital
      } = data;

      if (
        !currency ||
        !liquide ||
        !digital
      ) {

        return res.status(400).json({
          error: "Missing currency data"
        });
      }

      await Rate.findOneAndUpdate(

        {
          type: "currency",

          currency:
            currency.toUpperCase()
        },

        {
          type: "currency",

          currency:
            currency.toUpperCase(),

          liquide,

          digital,

          updatedAt: new Date()
        },

        {
          upsert: true,

          new: true
        }
      );
    }

    // ============================================
    // 🔥 UPDATE GOLD
    // ============================================
    if (data.type === "gold") {

      const { gold } = data;

      if (!gold) {

        return res.status(400).json({
          error: "Missing gold data"
        });
      }

      await Rate.findOneAndUpdate(

        {
          type: "gold"
        },

        {
          type: "gold",

          gold,

          updatedAt: new Date()
        },

        {
          upsert: true,

          new: true
        }
      );
    }

    res.json({
      message: "Saved successfully"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

// ------------------------------------------------
// 🔥 LAST UPDATE
// ------------------------------------------------
app.get("/last-update", async (req, res) => {

  try {

    const last =
      await Rate.findOne()
      .sort({
        updatedAt: -1
      });

    if (!last) {

      return res.json({
        lastUpdate: null
      });
    }

    res.json({

      lastUpdate:
        new Date(
          last.updatedAt
        ).toLocaleString()
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
});

// ------------------------------------------------
// 🔥 SERVER
// ------------------------------------------------
const PORT =
  process.env.PORT || 4000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});
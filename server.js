require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

// ------------------------------------------------
// 🔥 CORS
// ------------------------------------------------
app.use(cors());

app.use(express.json());

// ------------------------------------------------
// 🔥 FIREBASE ADMIN (pour les notifications push)
// ------------------------------------------------
// 1) Va sur https://console.firebase.google.com/
// 2) Ton projet -> ⚙️ Paramètres du projet -> Comptes de service
// 3) "Générer une nouvelle clé privée" -> télécharge le JSON
// 4) Place ce fichier ici : serviceAccountKey.json (à côté de ce fichier)
//    ⚠️ Ajoute-le à .gitignore, ne le commit JAMAIS.
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Topic auquel tous les téléphones de l'app sont abonnés (voir côté Flutter)
const RATES_TOPIC = "rate_updates";

/**
 * Envoie une notification push à tous les appareils abonnés au topic.
 */
async function sendRateUpdateNotification(title, body) {
  try {
    await admin.messaging().send({
      topic: RATES_TOPIC,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "rate_updates_channel",
        },
      },
    });

    console.log(`🔔 Notification envoyée : ${title} - ${body}`);
  } catch (error) {
    console.log("❌ Erreur envoi notification :", error.message);
  }
}

// ------------------------------------------------
// 🔥 MONGODB
// ------------------------------------------------
mongoose
  .connect(process.env.MONGODB_URI)

  .then(() => {
    console.log("MongoDB connected");
  })

  .catch((err) => {
    console.log(err);
  });

// ------------------------------------------------
// 🔥 SCHEMA
// ------------------------------------------------
const rateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    currency: {
      type: String,
      uppercase: true,
    },

    liquide: {
      buy: Number,
      sell: Number,
    },

    digital: {
      buy: Number,
      sell: Number,
    },

    gold: {
      local: {
        buy: Number,
        sell: Number,
      },

      importation: {
        buy: Number,
        sell: Number,
      },

      casser: {
        buy: Number,
        sell: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Rate = mongoose.model("Rate", rateSchema);

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
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",

      Pragma: "no-cache",

      Expires: "0",

      "Surrogate-Control": "no-store",
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

          updatedAt: new Date(r.updatedAt).toLocaleString(),
        };
      }

      // ============================================
      // 🔥 GOLD
      // ============================================
      if (r.type === "gold") {
        return {
          type: "gold",

          gold: r.gold,

          updatedAt: new Date(r.updatedAt).toLocaleString(),
        };
      }
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ------------------------------------------------
// 🔥 GET ONE CURRENCY
// ------------------------------------------------
app.get("/currency/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const rate = await Rate.findOne({
      type: "currency",

      currency: code,
    });

    if (!rate) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    res.json(rate);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ------------------------------------------------
// 🔥 GET GOLD
// ------------------------------------------------
app.get("/gold", async (req, res) => {
  try {
    const gold = await Rate.findOne({
      type: "gold",
    });

    if (!gold) {
      return res.status(404).json({
        error: "Gold not found",
      });
    }

    res.json(gold);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ------------------------------------------------
// 🔥 UPDATE RATE  (+ notification push si le taux change vraiment)
// ------------------------------------------------
app.post("/update-rate", async (req, res) => {
  try {
    const data = req.body;

    // ============================================
    // 🔥 VALIDATION
    // ============================================
    if (!data.type) {
      return res.status(400).json({
        error: "Type required",
      });
    }

    // ============================================
    // 🔥 UPDATE CURRENCY
    // ============================================
    if (data.type === "currency") {
      const { currency, liquide, digital } = data;

      if (!currency || !liquide || !digital) {
        return res.status(400).json({
          error: "Missing currency data",
        });
      }

      const code = currency.toUpperCase();

      // 🔥 On récupère l'ancienne valeur AVANT de modifier
      const previous = await Rate.findOne({
        type: "currency",
        currency: code,
      });

      const hasChanged =
        !previous ||
        previous.liquide?.buy !== liquide.buy ||
        previous.liquide?.sell !== liquide.sell ||
        previous.digital?.buy !== digital.buy ||
        previous.digital?.sell !== digital.sell;

      await Rate.findOneAndUpdate(
        {
          type: "currency",

          currency: code,
        },

        {
          type: "currency",

          currency: code,

          liquide,

          digital,

          updatedAt: new Date(),
        },

        {
          upsert: true,

          new: true,
        }
      );

      // 🔔 Notification uniquement si le prix a réellement changé
      if (hasChanged) {
        await sendRateUpdateNotification(
          `Taux ${code} mis à jour`,
          `Achat : ${liquide.buy} DZD · Vente : ${liquide.sell} DZD`
        );
      }
    }

    // ============================================
    // 🔥 UPDATE GOLD
    // ============================================
    if (data.type === "gold") {
      const { gold } = data;

      if (!gold) {
        return res.status(400).json({
          error: "Missing gold data",
        });
      }

      const previous = await Rate.findOne({ type: "gold" });

      const hasChanged =
        !previous ||
        JSON.stringify(previous.gold) !== JSON.stringify(gold);

      await Rate.findOneAndUpdate(
        {
          type: "gold",
        },

        {
          type: "gold",

          gold,

          updatedAt: new Date(),
        },

        {
          upsert: true,

          new: true,
        }
      );

      if (hasChanged) {
        await sendRateUpdateNotification(
          "Prix de l'or mis à jour",
          "Les nouveaux prix de l'or sont disponibles."
        );
      }
    }

    res.json({
      message: "Saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ------------------------------------------------
// 🔥 LAST UPDATE
// ------------------------------------------------
app.get("/last-update", async (req, res) => {
  try {
    const last = await Rate.findOne().sort({
      updatedAt: -1,
    });

    if (!last) {
      return res.json({
        lastUpdate: null,
      });
    }

    res.json({
      lastUpdate: new Date(last.updatedAt).toLocaleString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ------------------------------------------------
// 🔥 SERVER
// ------------------------------------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

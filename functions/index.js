import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const apply = onRequest(
  { cors: true, region: "europe-west1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { name, phone, email, city, age, background, motivation } = req.body;

    if (!name || !phone || !email || !city) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const doc = await db.collection("applications").add({
        name,
        phone,
        email,
        city,
        age: age || "",
        background: background || "",
        motivation: motivation || "",
        createdAt: new Date().toISOString(),
        status: "new",
      });

      res.status(200).json({ ok: true, id: doc.id });
    } catch (err) {
      console.error("Failed to save application:", err);
      res.status(500).json({ error: "Internal error" });
    }
  }
);

/**
 * bootstrap-admins.js — seed the first superadmins.
 *
 * Uses firebase-admin with Application Default Credentials. The seed accounts
 * must already exist in Firebase Auth (create them in the console/SDK first;
 * passwords are set there, never in code). Idempotent: re-running re-asserts
 * the same claim and revoked:false.
 *
 * Run from functions/:
 *   gcloud auth application-default login      # OR set GOOGLE_APPLICATION_CREDENTIALS
 *   node scripts/bootstrap-admins.js
 */

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const SEED_EMAILS = ["asaf@sb0.tech", "mor.k@elevation.ac"];

initializeApp();
const auth = getAuth();
const db = getFirestore();

async function main() {
  for (const email of SEED_EMAILS) {
    try {
      const user = await auth.getUserByEmail(email);
      const uid = user.uid;

      await auth.setCustomUserClaims(uid, { role: "superadmin" });

      await db.collection("admins").doc(uid).set(
        {
          uid,
          email,
          role: "superadmin",
          grantedByEmail: "bootstrap",
          grantedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          revoked: false,
        },
        { merge: true }
      );

      console.log(`OK   ${email} -> superadmin (uid ${uid})`);
    } catch (err) {
      if (err && err.code === "auth/user-not-found") {
        console.log(`SKIP ${email} -> no Auth account (create it first)`);
      } else {
        console.log(`FAIL ${email} -> ${err && err.message ? err.message : err}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("bootstrap-admins failed:", err);
    process.exit(1);
  });

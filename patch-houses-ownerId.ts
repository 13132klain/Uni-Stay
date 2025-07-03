import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// TODO: Replace with the correct owner UID you want to set for all houses
const OWNER_UID = "UNI_00000000000000000000000000000000";

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function patchHouses() {
  const housesRef = db.collection("houses");
  const snapshot = await housesRef.get();

  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.ownerId) {
      await doc.ref.update({ ownerId: OWNER_UID });
      updated++;
      console.log(`Patched house ${doc.id} with ownerId: ${OWNER_UID}`);
    }
  }
  console.log(`Patched ${updated} house(s).`);
}

patchHouses().catch(console.error); 
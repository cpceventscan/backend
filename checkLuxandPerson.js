const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const LUXAND_TOKEN = "39a93e5b3b2f4769ba3b69b14c79c53c";

(async () => {
  try {
    const response = await fetch("https://api.luxand.cloud/v2/person", {
      headers: { "token": LUXAND_TOKEN },
    });

    const people = await response.json();
    console.log("🧑‍🤝‍🧑 All persons in Luxand:\n", JSON.stringify(people, null, 2));
  } catch (err) {
    console.error("❌ Error fetching persons:", err);
  }
})();

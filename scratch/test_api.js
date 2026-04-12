async function test() {
  console.log("Fetching API without Auth Token...");
  const res = await fetch("http://localhost:3000/api/fasting/status", { method: "POST" });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Body:", text);
}
test();

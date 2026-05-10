const API_URL = "/api/chat";

export async function sendMessage({ userId, message, location }) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message, location }),
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    if (!res.ok) {
      let errorMessage = `Request failed (${res.status})`;
      if (isJson) {
        const data = await res.json().catch(() => null);
        errorMessage = data?.message || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (err) {
    throw new Error(err?.message || "AI Service Error");
  }
}

export async function getChatHistory(userId) {
  try {
    const res = await fetch(`${API_URL}/${userId}/history`);
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  } catch (err) {
    throw new Error(err?.message || "History Error");
  }
}

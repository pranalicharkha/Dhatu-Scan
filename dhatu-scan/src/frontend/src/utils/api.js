const API = "https://dhatu-scan-wvjq.onrender.com";

export const sendImageToBackend = async (image) => {
  try {
    const res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("API error:", error);
  }
};
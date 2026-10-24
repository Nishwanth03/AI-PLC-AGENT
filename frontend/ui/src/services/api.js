
const API_BASE_URL = "http://127.0.0.1:8000";

export async function checkBackend() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend health check failed.");
  }

  return response.json();
}

export async function generateSCL({
  requirement,
  blockName,
  blockType = "FB",
}) {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requirement,
      block_name: blockName,
      block_type: blockType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail)
    );
  }

  return data;
}

const APP_CONFIG_API = {
  load: "/api/app-config/load",
  save: "/api/app-config/save",
};

async function parseJsonResponse(response) {
  return response.json().catch(() => ({}));
}

function isUnauthorizedResponse(response, payload) {
  return response.status === 401
    || response.status === 403
    || payload?.reason === "unauthorized"
    || payload?.reason === "session_expired";
}

export async function dbLoadMany(keys) {
  try {
    const response = await fetch(APP_CONFIG_API.load, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ keys: Array.isArray(keys) ? keys : [] }),
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      return {
        ok: false,
        values: {},
        status: response.status,
        reason: isUnauthorizedResponse(response, payload) ? "unauthorized" : payload?.message || "load_failed",
      };
    }
    return { ok: true, values: payload?.values || {} };
  } catch (_error) {
    return { ok: false, values: {}, reason: "network_error" };
  }
}

export async function dbLoad(key) {
  const result = await dbLoadMany([key]);
  if (!result.ok) {
    return { ok: false, value: null, status: result.status, reason: result.reason };
  }
  return { ok: true, value: result.values?.[key] ?? null };
}

export async function dbSave(key, value) {
  try {
    const response = await fetch(APP_CONFIG_API.save, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ key, value }),
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        reason: isUnauthorizedResponse(response, payload) ? "unauthorized" : payload?.message || "save_failed",
      };
    }
    return { ok: true };
  } catch (_error) {
    return { ok: false, reason: "network_error" };
  }
}

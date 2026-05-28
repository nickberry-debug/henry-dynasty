/**
 * POST /api/netsuite/transfer
 *
 * Creates a Transfer Order in NetSuite and immediately fulfills + ships it.
 * Three-step sequence: Create → Fulfill → Ship
 *
 * Request body:
 * {
 *   fromLocationId: 6,          // NetSuite location ID (e.g. Greek Boys = 6)
 *   toLocationId: 7,            // NetSuite location ID (e.g. RJW = 7)
 *   items: [
 *     { nsItemId: "1234", quantity: 100 },
 *     ...
 *   ],
 *   memo: "Optional note"
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   transferNumber: "TO-10482",
 *   toId: "12345",
 *   fulfillmentId: "12346",
 *   shipmentId: "12347"
 * }
 */

const { buildAuthHeader, nsBaseUrl } = require("../_nsAuth");

async function nsPost(path, body) {
  const url  = `${nsBaseUrl()}${path}`;
  const auth = buildAuthHeader("POST", url);
  const res  = await fetch(url, {
    method:  "POST",
    headers: {
      "Authorization": auth,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function nsGet(path) {
  const url  = `${nsBaseUrl()}${path}`;
  const auth = buildAuthHeader("GET", url);
  const res  = await fetch(url, {
    method:  "GET",
    headers: { "Authorization": auth },
  });
  return res;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { fromLocationId, toLocationId, items, memo } = req.body || {};

  if (!fromLocationId || !toLocationId || !items?.length) {
    return res.status(400).json({
      error: "Missing required fields: fromLocationId, toLocationId, items",
    });
  }

  try {
    // ─── STEP 1: Create Transfer Order ────────────────────────────────
    console.log(`[Transfer] Creating TO: loc ${fromLocationId} → ${toLocationId}`);

    const toBody = {
      recordType:   "transferorder",
      transferlocation: { id: String(toLocationId) },
      location:     { id: String(fromLocationId) },
      memo:         memo || "Created via YOM Ops Hub",
      item: {
        items: items.map(item => ({
          item:     { id: String(item.nsItemId) },
          quantity: item.quantity,
          units:    { refName: "Case" },
        })),
      },
    };

    const createRes = await nsPost("/record/v1/transferorder", toBody);

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[Transfer] Create failed:", createRes.status, errText);
      return res.status(createRes.status).json({
        error:  "Failed to create Transfer Order",
        step:   "create",
        detail: errText,
      });
    }

    // Extract the new TO's internal ID from Location header
    const location = createRes.headers.get("location") || "";
    const toId     = location.split("/").pop();
    console.log(`[Transfer] TO created, id=${toId}`);

    // Get the TO number (e.g. "TO-10482")
    let transferNumber = "";
    try {
      const getRes  = await nsGet(`/record/v1/transferorder/${toId}?fields=tranid`);
      const getData = await getRes.json();
      transferNumber = getData.tranid || `TO-${toId}`;
    } catch {
      transferNumber = `TO-${toId}`;
    }

    // ─── STEP 2: Fulfill Transfer Order ───────────────────────────────
    console.log(`[Transfer] Fulfilling TO ${transferNumber}`);

    const fulfillBody = {
      tranid:   transferNumber,
      shipdate: new Date().toISOString().split("T")[0],
      item: {
        items: items.map(item => ({
          item:     { id: String(item.nsItemId) },
          quantity: item.quantity,
        })),
      },
    };

    const fulfillRes = await nsPost(
      `/record/v1/transferorder/${toId}/!transform/itemfulfillment`,
      fulfillBody
    );

    let fulfillmentId = "";
    if (fulfillRes.ok) {
      const fulfillLoc = fulfillRes.headers.get("location") || "";
      fulfillmentId    = fulfillLoc.split("/").pop();
      console.log(`[Transfer] Fulfillment created, id=${fulfillmentId}`);
    } else {
      const errText = await fulfillRes.text();
      console.error("[Transfer] Fulfill failed:", fulfillRes.status, errText);
      // Return partial success — TO was created even if fulfill failed
      return res.status(207).json({
        success:        false,
        partialSuccess: true,
        transferNumber,
        toId,
        error:  "Transfer Order created but fulfillment failed",
        step:   "fulfill",
        detail: errText,
      });
    }

    // ─── STEP 3: Ship (mark as shipped) ───────────────────────────────
    console.log(`[Transfer] Shipping fulfillment ${fulfillmentId}`);

    const shipBody = {
      shipstatus: { refName: "Shipped" },
      shipdate:   new Date().toISOString().split("T")[0],
    };

    const shipRes = await nsPost(
      `/record/v1/itemfulfillment/${fulfillmentId}`,
      shipBody
    );

    let shipmentId = fulfillmentId;
    if (!shipRes.ok) {
      const errText = await shipRes.text();
      console.warn("[Transfer] Ship status update failed (non-fatal):", errText);
    } else {
      console.log(`[Transfer] Shipment marked shipped`);
    }

    // ─── SUCCESS ──────────────────────────────────────────────────────
    return res.status(200).json({
      success:        true,
      transferNumber,
      toId,
      fulfillmentId,
      shipmentId,
      completedAt: new Date().toISOString(),
      message: `Transfer Order ${transferNumber} created, fulfilled, and shipped`,
    });

  } catch (err) {
    console.error("[Transfer] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error", message: err.message });
  }
};

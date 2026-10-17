import Lead from "../models/lead.model.js";
import Activity from "../models/activity.model.js";
import Notification from "../models/notification.model.js";

/**
 * Helper to fetch actual lead details from Meta Graph API
 * Meta Graph API Endpoint: https://graph.facebook.com/v19.0/<LEADGEN_ID>?access_token=<PAGE_ACCESS_TOKEN>
 */
export const fetchMetaLeadFromGraphApi = async (leadgenId, pageAccessToken) => {
  const token = pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

  if (!leadgenId) {
    return { name: "Inbound Meta Lead", email: "", phone: "", company: "" };
  }

  // If page access token is configured, query the live Meta Graph API
  if (token && token.trim() !== "") {
    try {
      const graphApiUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(
        leadgenId
      )}?access_token=${encodeURIComponent(token)}`;

      const response = await fetch(graphApiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🌐 Meta Graph API Lead Response:", data);

        // Parse standard field_data array: [{ name: "full_name", values: ["..."] }, ...]
        let name = "";
        let email = "";
        let phone = "";
        let company = "";

        if (Array.isArray(data.field_data)) {
          for (const field of data.field_data) {
            const fieldName = (field.name || "").toLowerCase().trim();
            const val = Array.isArray(field.values) && field.values.length > 0 ? field.values[0] : "";

            if (fieldName === "full_name" || fieldName === "name") {
              name = val;
            } else if (fieldName === "first_name") {
              name = val + (name ? ` ${name}` : "");
            } else if (fieldName === "last_name") {
              name = name ? `${name} ${val}` : val;
            } else if (fieldName === "email") {
              email = val;
            } else if (fieldName === "phone_number" || fieldName === "phone") {
              phone = val;
            } else if (fieldName === "company_name" || fieldName === "company") {
              company = val;
            }
          }
        }

        return {
          name: name || `Meta Lead #${leadgenId.slice(-6)}`,
          email: email || `lead_${leadgenId}@inbound.meta.com`,
          phone: phone || "",
          company: company || "Social Media Lead",
          adId: data.ad_id || "",
          formId: data.form_id || "",
          rawFieldData: data
        };
      } else {
        const errText = await response.text();
        console.warn(`⚠️ Meta Graph API returned ${response.status}:`, errText);
      }
    } catch (err) {
      console.error("Meta Graph API fetch exception:", err.message);
    }
  }

  // Graceful fallback when running in dev/sandbox or before live page token is injected
  return {
    name: `Social Lead #${leadgenId.slice(-6)}`,
    email: `lead_${leadgenId}@inbound.meta.com`,
    phone: "",
    company: "Social Media Lead",
    rawFieldData: { leadgen_id: leadgenId }
  };
};

/**
 * 1. GET /api/webhooks/meta
 * Validates Meta Webhook hub challenge verification during subscription setup
 */
export const verifyMetaWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expectedToken = process.env.META_VERIFY_TOKEN || "crm_meta_webhook_secret_token";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("✅ Meta Webhook Hub Challenge Verified Successfully!");
    return res.status(200).send(challenge);
  }

  console.warn("❌ Meta Webhook Verification Rejected: Token Mismatch");
  return res.status(403).json({
    error: "Verification token mismatch",
    hint: "Ensure hub.verify_token matches META_VERIFY_TOKEN in .env"
  });
};

/**
 * 2. POST /api/webhooks/meta
 * Receives incoming Facebook/Instagram Instant Lead Form submissions
 */
export const handleMetaWebhook = async (req, res) => {
  try {
    const body = req.body;
    console.log("📥 Incoming Meta Webhook Body:", JSON.stringify(body, null, 2));

    // Meta sends { object: "page" } or { object: "instagram" }
    if (!body || (body.object !== "page" && body.object !== "instagram" && body.object !== "leadgen")) {
      return res.status(200).json({ status: "ignored_non_leadgen_event" });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    const savedLeads = [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change.field === "leadgen") {
          const value = change.value || {};
          const leadgenId = String(value.leadgen_id || "");
          const pageId = String(value.page_id || entry.id || "");
          const formId = String(value.form_id || "");
          const adId = String(value.ad_id || "");

          // Determine channel platform
          const platformRaw = (body.object || value.platform || "").toLowerCase();
          const source = platformRaw === "instagram" ? "Instagram" : "Facebook";

          // If payload already provides mock/sandbox field values (e.g. from local test simulator)
          let extractedData = null;
          if (value.field_data && Array.isArray(value.field_data)) {
            let name = "";
            let email = "";
            let phone = "";
            let company = "";
            for (const f of value.field_data) {
              const fName = (f.name || "").toLowerCase().trim();
              const fVal = Array.isArray(f.values) && f.values.length > 0 ? f.values[0] : "";
              if (fName === "full_name" || fName === "name") name = fVal;
              else if (fName === "email") email = fVal;
              else if (fName === "phone_number" || fName === "phone") phone = fVal;
              else if (fName === "company_name" || fName === "company") company = fVal;
            }
            extractedData = {
              name: name || value.name || "Inbound Meta Lead",
              email: email || value.email || `lead_${leadgenId || Date.now()}@inbound.meta.com`,
              phone: phone || value.phone || "",
              company: company || value.company || "Social Ad Lead",
              rawFieldData: value
            };
          } else {
            // Query Meta Graph API using leadgen_id
            extractedData = await fetchMetaLeadFromGraphApi(leadgenId);
          }

          // Check if lead with this leadgenId was already ingested to prevent duplicate events
          let existingLead = null;
          if (leadgenId) {
            existingLead = await Lead.findOne({ "metaData.leadgenId": leadgenId });
          }

          if (existingLead) {
            console.log(` Lead with leadgen_id ${leadgenId} already ingested. Skipping duplicate.`);
            savedLeads.push(existingLead);
            continue;
          }

          // Automatically persist new lead into MongoDB
          const newLead = await Lead.create({
            name: extractedData.name || "Inbound Meta Lead",
            email: (extractedData.email || `lead_${Date.now()}@inbound.meta.com`).toLowerCase().trim(),
            phone: extractedData.phone || "",
            company: extractedData.company || "Social Ad Lead",
            source: source,
            status: "New",
            estimatedValue: value.estimatedValue || 2500,
            notes: `Auto-captured via Meta Graph Webhook (Form ID: ${formId || "N/A"}, Ad ID: ${adId || "N/A"}).`,
            metaData: {
              leadgenId,
              pageId,
              formId,
              adId,
              platform: source,
              rawFieldData: extractedData.rawFieldData || {}
            }
          });

          // Create audit activity timeline entry
          await Activity.create({
            title: `New ${source} Lead Ingested`,
            description: `${newLead.name} (${newLead.email}) submitted instant lead form.`,
            type: "lead",
            user: "Meta Webhook",
            timeAgo: "Just now"
          });

          // Create sales notification
          await Notification.create({
            title: `Instant ${source} Lead: ${newLead.name}`,
            description: `New prospect inquiry captured from ${source} ads (${newLead.phone || newLead.email}).`,
            type: "lead",
            isRead: false
          });

          savedLeads.push(newLead);
          console.log(`✅ Ingested lead into MongoDB: ${newLead.name} [${newLead._id}]`);
        }
      }
    }

    // Immediate 200 OK acknowledgment to Meta
    return res.status(200).json({
      success: true,
      message: "Meta webhook processed successfully",
      count: savedLeads.length,
      leads: savedLeads
    });
  } catch (error) {
    console.error("Meta Webhook Handler Error:", error);
    return res.status(500).json({
      error: "Failed to process Meta webhook event",
      details: error.message
    });
  }
};

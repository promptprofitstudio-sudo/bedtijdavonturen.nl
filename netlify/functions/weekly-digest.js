// Scheduled function: send weekly campaign link to Premium group via MailerLite API v2
const API = "https://connect.mailerlite.com/api";
exports.handler = async () => {
  const ML_API_KEY = process.env.ML_API_KEY;
  const ML_PREMIUM_GROUP_ID = process.env.ML_PREMIUM_GROUP_ID;
  const SITE_BASE = process.env.SITE_BASE || "https://bedtijdavonturen.nl";
  if(!ML_API_KEY || !ML_PREMIUM_GROUP_ID){
    return { statusCode: 200, body: "Missing ML_API_KEY or ML_PREMIUM_GROUP_ID" };
  }
  const headers = { 
    "Content-Type":"application/json",
    "Accept":"application/json",
    "Authorization": `Bearer ${ML_API_KEY}`
  };
  const subject = "Jullie nieuwe bedtijdavontuur is klaar";
  const html = `
  <p>Hoi {$name|default:'ouder'},</p>
  <p>Jullie persoonlijke verhaaltje van deze week staat klaar:</p>
  <p><a href="${SITE_BASE}/story.html?name={$child_name|default:'vriendje'}&interests={$interests|default:'dieren'}">Open jullie verhaal</a></p>
  <p>Welterusten,<br>Bedtijdavonturen</p>`;

  try{
    const createRes = await fetch(`${API}/campaigns`, {
      method:"POST", headers, body: JSON.stringify({
        type: "regular",
        subject, name: `Wekelijks verhaal ${new Date().toISOString().slice(0,10)}`,
        from: { name: "Bedtijdavonturen", email: process.env.ML_FROM_EMAIL || "noreply@example.com" },
        groups: [ML_PREMIUM_GROUP_ID]
      })
    });
    const campaign = await createRes.json();
    if(!createRes.ok){ throw new Error("Create campaign failed: "+JSON.stringify(campaign)); }

    const contentRes = await fetch(`${API}/campaigns/${campaign.id}/content`, {
      method:"PUT", headers, body: JSON.stringify({ html })
    });
    if(!contentRes.ok){ throw new Error("Set content failed"); }

    const sendRes = await fetch(`${API}/campaigns/${campaign.id}/actions/send`, { method:"POST", headers });
    if(!sendRes.ok){ throw new Error("Send failed"); }

    return { statusCode: 200, body: "Weekly campaign sent" };
  }catch(e){
    return { statusCode: 200, body: "Error: "+e.message };
  }
};

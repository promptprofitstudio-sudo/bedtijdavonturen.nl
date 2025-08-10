// Stripe webhook: on checkout completion, add subscriber to Premium group
exports.handler = async (event) => {
  if(event.httpMethod !== "POST") return {statusCode:405,body:"Method not allowed"};
  const ML_API_KEY = process.env.ML_API_KEY;
  const ML_PREMIUM_GROUP_ID = process.env.ML_PREMIUM_GROUP_ID;
  try{
    const payload = JSON.parse(event.body||"{}");
    if(payload.type === "checkout.session.completed"){
      const email = payload.data?.object?.customer_details?.email;
      const name = payload.data?.object?.customer_details?.name || "";
      if(email && ML_API_KEY && ML_PREMIUM_GROUP_ID){
        await fetch("https://connect.mailerlite.com/api/subscribers", {
          method:"POST",
          headers:{ "Content-Type":"application/json","Accept":"application/json", "Authorization":`Bearer ${ML_API_KEY}` },
          body: JSON.stringify({
            email, fields: { name },
            groups: [ML_PREMIUM_GROUP_ID]
          })
        });
      }
    }
  }catch(e){ /* ignore */ }
  return {statusCode:200, body:"ok"};
};

exports.handler = async (event) => {
  const params = new URLSearchParams(event.queryStringParameters || {});
  const name = (params.get('name') || 'vriendje').trim();
  const interests = (params.get('interests') || 'dieren').split(',').map(s=>s.trim()).filter(Boolean);
  const lang = (params.get('lang') || 'nl').toLowerCase();

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  async function withOpenAI() {
    const prompt = `Schrijf een kort, kalm bedtijdverhaal (~150-200 woorden) in het Nederlands voor een kind van 3-6 jaar.
Naam kind: ${name}
Thema's: ${interests.join(', ')}
Stijl: eenvoudig, rustgevend, zonder spanning. Eindig met een warme afsluiting.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{role:"user", content: prompt}],
        max_tokens: 400,
        temperature: 0.6
      })
    });
    if(!response.ok) throw new Error("OpenAI error");
    const data = await response.json();
    const story = data.choices?.[0]?.message?.content?.trim();
    return story;
  }

  function fallback() {
    const theme = interests[0] || "dieren";
    const lines = [
      `Er was eens een kind genaamd ${name}.`,
      `Op een rustige avond ontdekte ${name} iets moois over ${theme}.`,
      `Samen met een nieuwe vriend leerde ${name} zachtjes ademhalen en rustig worden.`,
      `Aan het eind zei iedereen: welterusten, ${name}.`,
    ];
    return lines.join(" ");
  }

  let story;
  try {
    if (OPENAI_API_KEY) {
      story = await withOpenAI();
    }
  } catch (e) {}

  if (!story) story = fallback();

  return {
    statusCode: 200,
    headers: {'Content-Type':'application/json','Cache-Control':'no-store'},
    body: JSON.stringify({story})
  };
};

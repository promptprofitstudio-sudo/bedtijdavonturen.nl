const fs = require('fs');

let content = fs.readFileSync('src/app/pricing/page.tsx', 'utf8');

// Replace Weekend Pakket
content = content.replace('3 bedtime stories — enough to get through sleepover drama', '3 verhalen voor het slapengaan — genoeg om logeerpartijtjes zonder drama door te komen');
content = content.replace('Start Now — 3 Stories for €2.99', 'Start Nu — 3 Verhalen voor €2,99');

// Replace Rust & Regelmaat
content = content.replace('A new story every night — never use the same bedtime script twice', 'Elke avond een nieuw verhaal — gebruik nooit meer twee keer hetzelfde script');
content = content.replace('Cancel anytime. No questions. No auto-renewal surprises.', 'Opzeggen kan altijd. Geen vragen. Geen verrassingen.');
content = content.replace('Try Free for 7 Days', 'Probeer 7 Dagen Gratis');

// Replace Family
content = content.replace("name: 'Family'", "name: 'Familie'");
content = content.replace("Bedtime peace for your whole house — even Grandma\\'s got a story ready", "Avondrust voor het hele gezin — zelfs oma heeft een verhaal klaar");
content = content.replace("Grandparents can listen & read along from their own home — bonding made easy", "Opa en oma kunnen meelezen en luisteren vanuit hun eigen huis");
content = content.replace("Unlock Family Plan", "Kies het Familie Plan");

// Replace Header
content = content.replace('Stop fighting bedtime. Start enjoying it.', 'Stop de strijd rond bedtijd. Begin met genieten.');

fs.writeFileSync('src/app/pricing/page.tsx', content);

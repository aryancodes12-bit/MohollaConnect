const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/WelcomePage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove IMPACT_STATS
content = content.replace(/\/\* ─── Data: Impact Stats ──.*?\*\/\s*const IMPACT_STATS = \[[\s\S]*?\];\s*/, '');

// 2. Remove Animated Impact Stats Bar
content = content.replace(/\{\/\* ── 2\. Animated Impact Stats Bar ──.*?<\/motion\.div>\s*/s, '');

// 3. Remove artisanCount from CATEGORIES
content = content.replace(/\s*artisanCount:\s*\d+,/g, '');

// 4. Remove artisanCount rendering
content = content.replace(/<span className="text-\[10px\] font-semibold text-indigo\/40 uppercase tracking-wider">[\s\S]*?\{category\.artisanCount\} sellers[\s\S]*?<\/span>/g, '');

// 5. Update Social Impact stats array
const oldStatsArray = `\\[\\s*\\{\\s*icon:\\s*Banknote,\\s*title:\\s*'Zero Commission Drain',\\s*stat:\\s*'₹2\\.4 Cr\\+',\\s*desc:\\s*'Money saved by sellers from platform commissions — stays in local economies instead of corporate bank accounts\\.'\\s*\\},\\s*\\{\\s*icon:\\s*Award,\\s*title:\\s*'Craft Preservation',\\s*stat:\\s*'120\\+',\\s*desc:\\s*'Traditional artisan techniques documented and preserved through our heritage craft catalog initiative\\.'\\s*\\},\\s*\\{\\s*icon:\\s*Users,\\s*title:\\s*'Jobs Created',\\s*stat:\\s*'5,400\\+',\\s*desc:\\s*'Direct and indirect employment opportunities generated for artisans, delivery partners, and support staff\\.'\\s*\\},\\s*\\{\\s*icon:\\s*Globe,\\s*title:\\s*'Cities Connected',\\s*stat:\\s*'28',\\s*desc:\\s*'Major Indian cities with active LocalConnect communities, from Saharanpur to Kochi\\.'\\s*\\},\\s*\\{\\s*icon:\\s*Handshake,\\s*title:\\s*'Trust-Based Orders',\\s*stat:\\s*'98\\.7%',\\s*desc:\\s*'Order completion rate with zero disputes — proof that neighborhood trust beats corporate logistics\\.'\\s*\\},\\s*\\{\\s*icon:\\s*Star,\\s*title:\\s*'Avg\\. Seller Rating',\\s*stat:\\s*'4\\.8/5',\\s*desc:\\s*'Average seller rating across the platform — verified by real community buyers, not anonymous reviews\\.'\\s*\\},\\s*\\]`;

const newStatsArray = `[
              { icon: Banknote, title: 'Zero Commission Drain', desc: 'Money saved by sellers from platform commissions stays in local economies instead of corporate bank accounts.' },
              { icon: Award, title: 'Craft Preservation', desc: 'Traditional artisan techniques are documented and preserved through our heritage craft catalog initiative.' },
              { icon: Users, title: 'Job Creation', desc: 'We aim to generate direct and indirect employment opportunities for artisans, delivery partners, and support staff.' },
              { icon: Globe, title: 'Connecting Cities', desc: 'Building active LocalConnect communities across major Indian cities, fostering inter-city cultural exchange.' },
              { icon: Handshake, title: 'Trust-Based Orders', desc: 'Focusing on high order completion rates with zero disputes — proving that neighborhood trust beats corporate logistics.' },
              { icon: Star, title: 'Genuine Seller Ratings', desc: 'Ensuring average seller ratings across the platform are verified by real community buyers, not anonymous reviews.' },
            ]`;

content = content.replace(new RegExp(oldStatsArray, 'g'), newStatsArray);

// Also update the renderer for Social Impact to remove the stat number
const oldSocialRenderer = `<div className="flex items-center gap-3">\\s*<div className="w-10 h-10 rounded-xl bg-marigold/20 flex items-center justify-center">\\s*<Icon className="w-5 h-5 text-marigold" />\\s*</div>\\s*<span className="font-display text-2xl text-warmwhite">\\{item\\.stat\\}</span>\\s*</div>\\s*<h3 className="font-display text-base text-warmwhite">\\{item\\.title\\}</h3>`;
const newSocialRenderer = `<div className="flex flex-col items-center justify-center space-y-2 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-marigold/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-marigold" />
                    </div>
                    <h3 className="font-display text-lg text-warmwhite text-center">{item.title}</h3>
                  </div>`;
content = content.replace(new RegExp(oldSocialRenderer, 'g'), newSocialRenderer);


// 6. Remove TESTIMONIALS_EXPANDED
content = content.replace(/\/\* ─── Data: Expanded Testimonials ──.*?\*\/\s*const TESTIMONIALS_EXPANDED = \[[\s\S]*?\];\s*/, '');

// 7. Remove Testimonials JSX (sections 16 and 17)
// Instead of complex regex, I can find the start of section 16 and the end of section 17.
// {/* ── 16. Testimonials — 3 Original Stories ──────────── */}
// all the way to before {/* ── 18. Pre-Footer / App Download Promo ────────── */}
content = content.replace(/\{\/\* ── 16\. Testimonials — 3 Original Stories ──────────── \*\/\}[\s\S]*?(?=\{\/\* ── 18\. Pre-Footer \/ App Download Promo ────────── \*\/})/g, '');

// 8. Update "Join 2,750+ Verified Artisans"
content = content.replace(/Join 2,750\+ Verified Artisans Across India/g, 'Join our growing community of verified artisans');

// 9. Remove FAQ item referencing 5,000+ artisans (let's check if there's any)
content = content.replace(/Over 5,000\+ verified sellers/g, 'Many verified sellers');


// 10. Update the flex layout of Social Impact cards so the content is centered
content = content.replace(/className="bg-warmwhite\/10 backdrop-blur-md rounded-2xl p-5 border border-warmwhite\/15 space-y-3"/g, 'className="bg-warmwhite/10 backdrop-blur-md rounded-2xl p-5 border border-warmwhite/15 space-y-3 flex flex-col items-center text-center"');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated WelcomePage.jsx');

import derived from './industry-vectors.json'
import { facetsByDimension } from './facets.js'

const VALUE_KEYS = facetsByDimension('values').map(f => f.key)

/**
 * The six Values facets have no O*NET source (spec §3.8) and are authored here.
 * They are editorial estimates of what a career in this industry typically
 * offers, on the same 0-100 scale, and are surfaced in the UI as judgments
 * rather than data. They describe the typical deal, not the best case:
 * `income` weighs the floor as well as the ceiling, `stability` is the odds
 * the job still exists in five years, `recognition` is how much visible
 * advancement the path offers. Keys match industry-vectors.json exactly —
 * a mismatch leaves a vector missing its 18 derived facets and fails the test.
 */
const AUTHORED_VALUES = {
  'healthcare-medicine':                   { autonomy: 38, impact: 92, income: 72, stability: 88, mastery: 82, recognition: 55 },
  'education-teaching':                    { autonomy: 52, impact: 85, income: 38, stability: 78, mastery: 68, recognition: 42 },
  'technology-software':                   { autonomy: 72, impact: 50, income: 85, stability: 60, mastery: 85, recognition: 58 },
  'engineering':                           { autonomy: 62, impact: 62, income: 76, stability: 74, mastery: 82, recognition: 52 },
  'science-research':                      { autonomy: 68, impact: 60, income: 58, stability: 52, mastery: 90, recognition: 48 },
  'finance-banking-insurance':             { autonomy: 45, impact: 32, income: 88, stability: 68, mastery: 70, recognition: 65 },
  'business-consulting-admin':             { autonomy: 50, impact: 40, income: 72, stability: 62, mastery: 62, recognition: 68 },
  'marketing-advertising-media':           { autonomy: 55, impact: 35, income: 62, stability: 45, mastery: 62, recognition: 70 },
  'arts-design-entertainment':             { autonomy: 85, impact: 45, income: 30, stability: 20, mastery: 88, recognition: 62 },
  'law-legal-services':                    { autonomy: 48, impact: 55, income: 82, stability: 72, mastery: 80, recognition: 72 },
  'government-public-admin':               { autonomy: 30, impact: 65, income: 48, stability: 92, mastery: 55, recognition: 38 },
  'public-safety-protective':              { autonomy: 35, impact: 88, income: 52, stability: 85, mastery: 65, recognition: 55 },
  'social-services-counseling':            { autonomy: 45, impact: 90, income: 32, stability: 65, mastery: 68, recognition: 30 },
  'construction-skilled-trades':           { autonomy: 58, impact: 58, income: 62, stability: 60, mastery: 80, recognition: 42 },
  'manufacturing-production':              { autonomy: 30, impact: 40, income: 48, stability: 52, mastery: 60, recognition: 32 },
  'agriculture-natural-resources':         { autonomy: 68, impact: 55, income: 38, stability: 48, mastery: 68, recognition: 25 },
  'energy-utilities-environment':          { autonomy: 42, impact: 60, income: 68, stability: 78, mastery: 70, recognition: 35 },
  'transportation-logistics-supply-chain': { autonomy: 40, impact: 45, income: 52, stability: 68, mastery: 52, recognition: 35 },
  'retail-sales':                          { autonomy: 35, impact: 30, income: 42, stability: 50, mastery: 42, recognition: 48 },
  'hospitality-travel-food':               { autonomy: 38, impact: 42, income: 35, stability: 45, mastery: 58, recognition: 38 },
  'real-estate-property':                  { autonomy: 82, impact: 40, income: 65, stability: 35, mastery: 55, recognition: 70 },
  'personal-services-wellness':            { autonomy: 78, impact: 62, income: 35, stability: 42, mastery: 65, recognition: 40 },
}

/**
 * Reader-facing copy. `blurb` is one plain sentence saying what the industry
 * is. `titles` are three titles a person would actually see on a posting, at
 * entry, mid, and senior. `firstMove` is a concrete action doable inside two
 * weeks for under $50 that produces a signal the reader can interpret — each
 * names the action and what a positive result looks like.
 */
const META = {
  'healthcare-medicine': {
    name: 'Healthcare & Medicine',
    blurb: 'Diagnosing, treating, and looking after people who are sick, hurt, or trying not to become either.',
    titles: [
      { title: 'Certified Nursing Assistant', level: 'entry' },
      { title: 'Registered Nurse', level: 'mid' },
      { title: 'Nurse Practitioner', level: 'senior' },
    ],
    firstMove: 'Book a CPR certification class — about $40 and one evening — and ask the instructor, who is usually a working nurse or paramedic, what their last genuinely bad shift looked like. If their answer makes you want the harder version of the class rather than relieved it is over, that is the signal.',
  },
  'education-teaching': {
    name: 'Education & Teaching',
    blurb: 'Getting knowledge and skills into other people’s heads, mostly in classrooms, and keeping them engaged while you do it.',
    titles: [
      { title: 'Teaching Assistant', level: 'entry' },
      { title: 'Classroom Teacher', level: 'mid' },
      { title: 'School Principal', level: 'senior' },
    ],
    firstMove: 'Tutor one person for free, three sessions inside two weeks — a neighbor’s kid, a coworker studying for a license, anyone. The signal comes in session three, when the novelty is gone: if you are still redesigning the explanation on your drive home, teaching will feed you; if you are watching the clock, it will not.',
  },
  'technology-software': {
    name: 'Technology & Software',
    blurb: 'Building and maintaining the software systems that most other work now runs on.',
    titles: [
      { title: 'Junior Developer', level: 'entry' },
      { title: 'Software Engineer', level: 'mid' },
      { title: 'Staff Software Engineer', level: 'senior' },
    ],
    firstMove: 'Automate one chore you currently do by hand — renaming files, reformatting a spreadsheet — with a free tutorial and a fifty-line script, and get it actually running. The signal is what the first error message does to you: if it reads as a puzzle, keep going; if it reads as a wall, believe that too.',
  },
  'engineering': {
    name: 'Engineering',
    blurb: 'Designing physical things and systems — machines, structures, circuits, processes — so they work, safely, at a price someone will pay.',
    titles: [
      { title: 'Engineering Technician', level: 'entry' },
      { title: 'Mechanical Engineer', level: 'mid' },
      { title: 'Principal Engineer', level: 'senior' },
    ],
    firstMove: 'Open a free Onshape account and model one real object from your house — a bracket, a handle — to its true dimensions, measured, not guessed. If the third hour of getting one curve exactly right felt like play rather than punishment, that precision appetite is the core of the job.',
  },
  'science-research': {
    name: 'Science & Research',
    blurb: 'Running careful experiments and analyses to find out things nobody knows yet, mostly in labs and universities.',
    titles: [
      { title: 'Laboratory Technician', level: 'entry' },
      { title: 'Research Scientist', level: 'mid' },
      { title: 'Principal Investigator', level: 'senior' },
    ],
    firstMove: 'Join a citizen-science project on Zooniverse and put in five real sessions of classification work over two weeks — actual data, actual protocols, free. Research is mostly this: repetitive care in service of a question. If the repetition felt satisfying because the question mattered, that is the signal; if it felt like data entry, that is also an answer.',
  },
  'finance-banking-insurance': {
    name: 'Finance, Banking & Insurance',
    blurb: 'Moving, lending, protecting, and accounting for money, and pricing the risk of things going wrong.',
    titles: [
      { title: 'Bank Teller', level: 'entry' },
      { title: 'Financial Analyst', level: 'mid' },
      { title: 'Portfolio Manager', level: 'senior' },
    ],
    firstMove: 'Build a complete spreadsheet model of something real — your own year of finances, or a small business you can observe — and do not stop until every number reconciles. If hunting a three-dollar discrepancy for an hour felt like winning rather than torture, you have the temperament this work runs on.',
  },
  'business-consulting-admin': {
    name: 'Business, Consulting & Administration',
    blurb: 'Keeping organizations running and making them run better — operations, planning, and advising the people in charge.',
    titles: [
      { title: 'Business Analyst', level: 'entry' },
      { title: 'Operations Manager', level: 'mid' },
      { title: 'Director of Operations', level: 'senior' },
    ],
    firstMove: 'Pick one broken process where you work or volunteer now, interview the three people it touches, map it on a single page, and hand the owner one concrete fix. If the interviews were the fun part and the inefficiency genuinely annoyed you, this is your work; the deliverable also becomes your first portfolio piece.',
  },
  'marketing-advertising-media': {
    name: 'Marketing, Advertising & Media',
    blurb: 'Getting people to notice, want, and choose things — products, ideas, stories — through words, images, and channels.',
    titles: [
      { title: 'Marketing Coordinator', level: 'entry' },
      { title: 'Brand Manager', level: 'mid' },
      { title: 'Creative Director', level: 'senior' },
    ],
    firstMove: 'Take one thing you care about and post it three different ways on one platform over two weeks — three framings, same substance — and track which one wins. The signal is not the numbers; it is whether you caught yourself checking them more than you meant to and immediately drafting a fourth version.',
  },
  'arts-design-entertainment': {
    name: 'Arts, Design & Entertainment',
    blurb: 'Making things people look at, listen to, read, and watch — and getting paid for taste and craft in a crowded market.',
    titles: [
      { title: 'Production Assistant', level: 'entry' },
      { title: 'Graphic Designer', level: 'mid' },
      { title: 'Art Director', level: 'senior' },
    ],
    firstMove: 'Make one finished piece to a deadline you set — a poster, a song, three comic pages — and publish it somewhere strangers can see it within two weeks. The signal is not the reaction; it is whether shipping an imperfect thing in public felt survivable, because doing that on schedule, forever, is the actual job.',
  },
  'law-legal-services': {
    name: 'Law & Legal Services',
    blurb: 'Applying rules to disputes and deals — arguing, drafting, and advising so your side’s interests hold up on paper and in court.',
    titles: [
      { title: 'Paralegal', level: 'entry' },
      { title: 'Associate Attorney', level: 'mid' },
      { title: 'Senior Counsel', level: 'senior' },
    ],
    firstMove: 'Spend one morning in a public courtroom gallery — hearings are open and free, and the docket is posted. If what happened at the bench read to you as moves and counter-moves rather than paperwork, and you left silently arguing one side, that instinct is the job; the paperwork is how you earn the right to make the argument.',
  },
  'government-public-admin': {
    name: 'Government & Public Administration',
    blurb: 'Running the public’s business — administering programs, budgets, and rules that apply to everyone whether they opted in or not.',
    titles: [
      { title: 'Administrative Specialist', level: 'entry' },
      { title: 'Policy Analyst', level: 'mid' },
      { title: 'Program Director', level: 'senior' },
    ],
    firstMove: 'Attend one city council or county commission meeting, and read the agenda packet beforehand — it is posted free online. The signal: if you were the one person in the room who cared how the ordinance was actually worded, and the slow grind of process read as legitimacy rather than obstruction, this work will suit you.',
  },
  'public-safety-protective': {
    name: 'Public Safety & Protective Services',
    blurb: 'Standing between the public and harm — policing, firefighting, emergency response, and security.',
    titles: [
      { title: 'Security Officer', level: 'entry' },
      { title: 'Police Officer', level: 'mid' },
      { title: 'Emergency Management Director', level: 'senior' },
    ],
    firstMove: 'Ask your local police or fire department about a ride-along or open station night — most departments run them free and book within two weeks. Watch the whole shift, not the highlights: if the long uneventful stretches felt like a rhythm you could live in for years, not just the calls, that is the honest signal.',
  },
  'social-services-counseling': {
    name: 'Social Services & Counseling',
    blurb: 'Helping people through the hardest parts of their lives — poverty, addiction, family crisis, mental health — one case at a time.',
    titles: [
      { title: 'Case Manager', level: 'entry' },
      { title: 'Licensed Clinical Social Worker', level: 'mid' },
      { title: 'Clinical Director', level: 'senior' },
    ],
    firstMove: 'Take two volunteer shifts at a shelter, food bank, or warmline intake desk — somewhere you talk with people mid-crisis, not just sort donations. The signal is what you carry home: if the stories left you steady and thinking about what the system should have done, you can do this daily; if they wrecked you for days, protect that and choose differently.',
  },
  'construction-skilled-trades': {
    name: 'Construction & Skilled Trades',
    blurb: 'Building and fixing the physical world — buildings, wiring, plumbing, finish work — with your hands and a licensed skill.',
    titles: [
      { title: 'Apprentice Electrician', level: 'entry' },
      { title: 'Journeyman Electrician', level: 'mid' },
      { title: 'Construction Superintendent', level: 'senior' },
    ],
    firstMove: 'Complete two real repairs from video instruction inside two weeks — patch and paint a wall properly, fix a running toilet, build a shelf that is square and level. The signal is which standard you held: if "square and level" mattered to you more than "done," the trades will reward you; if "done" was enough, they will frustrate you.',
  },
  'manufacturing-production': {
    name: 'Manufacturing & Production',
    blurb: 'Turning raw materials into finished goods at volume, where the line, the machine, and the schedule set the day.',
    titles: [
      { title: 'Production Operator', level: 'entry' },
      { title: 'CNC Machinist', level: 'mid' },
      { title: 'Plant Manager', level: 'senior' },
    ],
    firstMove: 'Take a public factory tour — breweries, food plants, and glassworks run them cheap or free — and watch one workstation for a full ten minutes. If you caught yourself redesigning the station’s layout in your head, ask the guide what stops the line most often; wanting that answer is the signal.',
  },
  'agriculture-natural-resources': {
    name: 'Agriculture & Natural Resources',
    blurb: 'Growing food and managing land, water, forests, and livestock, on nature’s schedule rather than yours.',
    titles: [
      { title: 'Farmhand', level: 'entry' },
      { title: 'Agronomist', level: 'mid' },
      { title: 'Farm Manager', level: 'senior' },
    ],
    firstMove: 'Put in two full volunteer days of real field work — a community farm workday or a conservation-crew planting day, both free and easy to book. The signal arrives on day two, when you are sore, the weather is wrong, and the task is the same as yesterday: if you still wanted day three, believe it.',
  },
  'energy-utilities-environment': {
    name: 'Energy, Utilities & Environment',
    blurb: 'Keeping power, water, and waste systems running — and increasingly, rebuilding them to run cleaner.',
    titles: [
      { title: 'Utility Technician', level: 'entry' },
      { title: 'Power Plant Operator', level: 'mid' },
      { title: 'Operations Superintendent', level: 'senior' },
    ],
    firstMove: 'Trace your own home’s electricity for one week: read the meter daily, open the breaker panel, follow your line to its substation on your utility’s public map, then explain to someone else where their power was at six last night. If the invisible system behind the wall socket became the most interesting thing in the room, that fascination is the career.',
  },
  'transportation-logistics-supply-chain': {
    name: 'Transportation, Logistics & Supply Chain',
    blurb: 'Moving goods and people from where they are to where they need to be, on time, at scale, around constant disruption.',
    titles: [
      { title: 'Warehouse Associate', level: 'entry' },
      { title: 'Logistics Coordinator', level: 'mid' },
      { title: 'Supply Chain Manager', level: 'senior' },
    ],
    firstMove: 'Pick one product you own and trace its route backward on a single page — factory, port, warehouse, shelf — using the maker’s site, free port data, and shipment trackers. If the handoffs and delays annoyed you personally, as if the route were yours to fix, that proprietary irritation is exactly what the work runs on.',
  },
  'retail-sales': {
    name: 'Retail & Sales',
    blurb: 'Selling things to people face to face or account by account, where the number you closed this month is the score.',
    titles: [
      { title: 'Sales Associate', level: 'entry' },
      { title: 'Store Manager', level: 'mid' },
      { title: 'Regional Sales Director', level: 'senior' },
    ],
    firstMove: 'List five things you own on a marketplace this week, price them slightly high, and negotiate every offer instead of taking the first one. The signal is twofold: whether the haggling was fun, and whether the ghosted chats and lowballs rolled off you — because a thick skin you do not have to fake is the entry fee.',
  },
  'hospitality-travel-food': {
    name: 'Hospitality, Travel & Food',
    blurb: 'Feeding, housing, and hosting people — restaurants, hotels, events — where the product is how the guest felt.',
    titles: [
      { title: 'Line Cook', level: 'entry' },
      { title: 'Restaurant Manager', level: 'mid' },
      { title: 'Hotel General Manager', level: 'senior' },
    ],
    firstMove: 'Work one real rush: ask a caterer, event kitchen, or food-bank kitchen for a single volunteer shift on their busiest night — they take walk-ins, and it costs nothing. The signal is what the slam did to you at its peak: if you got calmer and faster as the tickets piled up, you have the wiring; if you got rattled, no amount of loving food will fix that.',
  },
  'real-estate-property': {
    name: 'Real Estate & Property',
    blurb: 'Selling, leasing, and managing property on commission, where your income is whatever you closed.',
    titles: [
      { title: 'Leasing Agent', level: 'entry' },
      { title: 'Real Estate Agent', level: 'mid' },
      { title: 'Managing Broker', level: 'senior' },
    ],
    firstMove: 'Tour four open houses in one weekend — free, no appointment — and write the listing you would have written for each. Then ask one agent how many of their deals fell through last quarter and how long their first year took to pay. If the feast-or-famine truth made the work sound more appealing rather than less, trust that.',
  },
  'personal-services-wellness': {
    name: 'Personal Services & Wellness',
    blurb: 'Improving how individual clients look, feel, and function — fitness, beauty, bodywork, coaching — one appointment at a time.',
    titles: [
      { title: 'Personal Trainer', level: 'entry' },
      { title: 'Licensed Massage Therapist', level: 'mid' },
      { title: 'Spa Director', level: 'senior' },
    ],
    firstMove: 'Deliver one service you already half-know, free, to five different people in two weeks — a planned workout, a guided stretch session, a skin-care consult. The fifth repetition is the test: the work is the same service delivered freshly, hundreds of times. If round five felt as alive as round one and their reactions fed you, that is the signal.',
  },
}

export const INDUSTRIES = Object.keys(META).map(key => ({
  key,
  ...META[key],
  vector: { ...derived.industries[key], ...AUTHORED_VALUES[key] },
  authoredFacets: VALUE_KEYS,
}))

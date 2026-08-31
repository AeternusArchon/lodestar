/**
 * The 72 statements a respondent rates on a 1-5 agreement scale.
 *
 * Shape: { id, facet, dir, text }
 *   id    `<FACET-PREFIX>-<NN>`. Stable and unique; answers are keyed by it, so
 *         never renumber an existing item. Retire one and add a new id instead.
 *         The prefix records which facet an item belongs to; the number is its
 *         position within that facet, NOT its position in this array.
 *   facet A key from FACETS in ./facets.js. Every item loads on exactly one.
 *         To read a facet's items together, filter on this field.
 *   dir   +1 if agreeing means MORE of what the facet's blurb describes,
 *         -1 if agreeing means LESS. The scoring engine flips -1 items.
 *   text  A first-person present-tense statement. Never a question.
 *
 * ── Array order is presentation order ─────────────────────────────────────────
 *
 * The UI walks this array by index, so the order below is the order a
 * respondent meets the items in. It is a fixed literal on purpose: nothing is
 * shuffled at runtime and no seed is involved, so a saved session resumed at
 * index 34 returns to the same statement it left.
 *
 * The order was chosen to satisfy four properties, all of which survive as
 * facts about the literal rather than as code:
 *
 *   1. No two adjacent items share a facet. Asserted by tests/questions.test.js.
 *      Consecutive same-facet items invite straight-lining: once someone has
 *      agreed twice, the third is answered from momentum rather than read.
 *   2. No more than two adjacent items share a dimension, which is as even as
 *      30/18/12/12 allows. The four dimensions cycle rather than block, so no
 *      stretch of the assessment feels like it is "about" one thing.
 *   3. Reverse-keyed items are spread across the whole run - six, seven, six and
 *      five of them in the four quarters - so attention checks never stop.
 *   4. Reverse-keyed items are NOT on a fixed cadence. The gaps between them
 *      (1, 4, 1, 4, 1, 6, 1, 2, 7, ...) are deliberately irregular. A predictable
 *      "every fifth item flips" rhythm is a pattern an alert respondent learns
 *      to play to, which is worse than no reversal at all.
 *
 * Reordering this array is therefore a substantive change, not a cosmetic one.
 * If you add or retire an item, re-check all four properties.
 *
 * ── Authoring rules ───────────────────────────────────────────────────────────
 *
 * Counts are fixed by tests/questions.test.js: 5 items per interest facet,
 * 3 per value, 2 per aptitude, 2 per context facet, at least one reverse-keyed
 * item in each. The two-item facets therefore run exactly one of each direction.
 *
 * These rules matter more than they look, because a mis-keyed or off-construct
 * item produces no error, just a quietly wrong score:
 *
 *   1. The item never names its own construct. An item on `creative` that
 *      contains the word "creative" measures how creative someone wants to
 *      sound, not how many ideas they have.
 *   2. Reverse-keyed items describe a different person, not the absence of one.
 *      "I do not enjoy puzzles" is a negation; "I would rather be handed a
 *      working answer than derive one myself" is a reversal. Every -1 item here
 *      should be comfortably endorsable by the person it describes.
 *   3. Desirability is kept neutral, usually by forcing a trade between two
 *      respectable goods rather than asking for an endorsement. Nobody agrees
 *      with "I want credit for my work"; plenty of people will take the visible
 *      small role over the invisible big one.
 *   4. One construct per item. No "and" joining two different preferences.
 *   5. Aptitude items use a peer-comparison frame ("Compared with people I
 *      know, ..."). Absolute self-ratings drift with mood and self-esteem;
 *      ranking yourself against a known reference group drifts less. This
 *      applies to the reverse-keyed aptitude items too.
 *
 * Facets that sit close to each other were written to pull apart deliberately:
 * `investigative` is the pull toward a problem while `analytical` is skill at
 * one; `artistic` is wanting your own taste in the output while `creative` is
 * how readily ideas arrive; `social` is the motive to help while `interpersonal`
 * is reading people and `peopleFacing` is wanting them physically present;
 * `autonomy` is deciding how the work is done while `scheduleFlex` is deciding
 * when and where; `stability` is the job still existing while `riskTolerance` is
 * appetite for a variable upside.
 *
 * This module is inert data. It imports nothing and computes nothing.
 */

export const QUESTIONS = [
  // 1-12
  { id: 'REA-01', facet: 'realistic', dir: 1,
    text: 'When something in the house breaks, I open it up before I look for someone to call.' },
  { id: 'AUT-01', facet: 'autonomy', dir: 1,
    text: 'I would take less money for the freedom to decide how the work gets done.' },
  { id: 'ANA-02', facet: 'analytical', dir: -1,
    text: 'Compared with people I know, I go on how a situation feels more than on working it through step by step.' },
  { id: 'INV-05', facet: 'investigative', dir: -1,
    text: 'I lose interest once a problem stops being straightforward.' },
  { id: 'PPL-01', facet: 'peopleFacing', dir: 1,
    text: 'A day with nobody to talk to leaves me flat, however much I got done.' },
  { id: 'ART-01', facet: 'artistic', dir: 1,
    text: 'I change things that already work just to make them look the way I think they should.' },
  { id: 'IMP-01', facet: 'impact', dir: 1,
    text: 'Being able to name one person my work helped would matter more to me than a good quarter.' },
  { id: 'SOC-05', facet: 'social', dir: -1,
    text: 'I would rather be given a task to finish than a person to look after.' },
  { id: 'VER-02', facet: 'verbal', dir: -1,
    text: 'Compared with people I know, my first explanation more often needs a second one before it lands.' },
  { id: 'STR-01', facet: 'structurePref', dir: 1,
    text: 'I want to know before the day starts roughly what the day will contain.' },
  { id: 'INC-01', facet: 'income', dir: 1,
    text: 'Between two offers, the larger number would settle it for me.' },
  { id: 'ENT-01', facet: 'enterprising', dir: 1,
    text: 'In a group with no obvious leader, I end up steering things.' },

  // 13-24
  { id: 'CNV-05', facet: 'conventional', dir: -1,
    text: 'Paperwork and record-keeping are the parts of any job I put off longest.' },
  { id: 'STA-03', facet: 'stability', dir: -1,
    text: 'I would rather move on to something new every couple of years than stay put.' },
  { id: 'SPA-01', facet: 'spatial', dir: 1,
    text: 'Compared with people I know, I find it easy to picture how a room will look before anything is moved.' },
  { id: 'REA-02', facet: 'realistic', dir: 1,
    text: 'A day spent repairing an engine or a fence sits better with me than a day spent in meetings.' },
  { id: 'PAC-01', facet: 'pace', dir: 1,
    text: 'I do my best work when the deadline is close enough to be uncomfortable.' },
  { id: 'INV-01', facet: 'investigative', dir: 1,
    text: 'I enjoy figuring out why something broke, even when nobody asked me to.' },
  { id: 'MAS-01', facet: 'mastery', dir: 1,
    text: 'I want work that is still slightly beyond me three years from now.' },
  { id: 'ART-05', facet: 'artistic', dir: -1,
    text: 'I would rather execute a good brief well than be handed a blank page.' },
  { id: 'ITP-02', facet: 'interpersonal', dir: -1,
    text: 'Compared with people I know, I take what people say at face value and find out later there was more to it.' },
  { id: 'PHY-01', facet: 'physicality', dir: 1,
    text: 'Eight hours in a chair leaves me more tired than eight hours on my feet.' },
  { id: 'REC-03', facet: 'recognition', dir: -1,
    text: 'I would rather do the work in the background than be the one presenting it.' },
  { id: 'SOC-01', facet: 'social', dir: 1,
    text: 'I am the person friends call when something has gone wrong.' },

  // 25-36
  { id: 'ENT-02', facet: 'enterprising', dir: 1,
    text: 'I enjoy talking someone around to a plan more than I enjoy carrying the plan out.' },
  { id: 'AUT-02', facet: 'autonomy', dir: 1,
    text: 'Having to clear my approach with someone first takes more out of me than the work does.' },
  { id: 'ORG-01', facet: 'organizational', dir: 1,
    text: 'Compared with people I know, fewer things slip when several deadlines land in the same week.' },
  { id: 'CNV-01', facet: 'conventional', dir: 1,
    text: 'A filing system that is properly kept up is genuinely satisfying to me.' },
  { id: 'RSK-01', facet: 'riskTolerance', dir: 1,
    text: 'I would take the commission-only offer over the salaried one if the ceiling were higher.' },
  { id: 'REA-05', facet: 'realistic', dir: -1,
    text: 'The work that suits me best leaves nothing behind that anyone could pick up and hold.' },
  { id: 'IMP-03', facet: 'impact', dir: -1,
    text: 'A job is a job, and whether it changes anything is not what I judge it by.' },
  { id: 'INV-02', facet: 'investigative', dir: 1,
    text: 'I keep poking at a question after I already have an answer good enough to use.' },
  { id: 'CRE-02', facet: 'creative', dir: -1,
    text: 'Compared with people I know, I am better at improving an idea already on the table than at producing new ones.' },
  { id: 'SCH-02', facet: 'scheduleFlex', dir: -1,
    text: 'Fixed hours in a fixed place suit me better than deciding for myself when to work.' },
  { id: 'INC-02', facet: 'income', dir: 1,
    text: 'I would put up with work I found dull if it paid noticeably better.' },
  { id: 'ART-02', facet: 'artistic', dir: 1,
    text: 'Being told exactly how the finished thing should look takes the life out of the job for me.' },

  // 37-48
  { id: 'SOC-02', facet: 'social', dir: 1,
    text: 'Explaining something until it finally lands for someone is one of the better parts of my week.' },
  { id: 'STA-01', facet: 'stability', dir: 1,
    text: 'Not knowing whether the job will exist next year would sit at the back of my mind all year.' },
  { id: 'ANA-01', facet: 'analytical', dir: 1,
    text: 'Compared with people I know, I am quicker to see what is actually causing a mess.' },
  { id: 'ENT-03', facet: 'enterprising', dir: 1,
    text: 'I want a say in where the whole thing is going, not just in my piece of it.' },
  { id: 'PPL-02', facet: 'peopleFacing', dir: -1,
    text: 'Long stretches of working on my own are when I feel most like myself.' },
  { id: 'CNV-02', facet: 'conventional', dir: 1,
    text: 'I would rather tighten up a process that already works than replace it with a new one.' },
  { id: 'MAS-02', facet: 'mastery', dir: 1,
    text: 'Being merely competent at something I do every day would bother me.' },
  { id: 'REA-03', facet: 'realistic', dir: 1,
    text: 'I would rather learn to run an unfamiliar machine than learn an unfamiliar theory.' },
  { id: 'VER-01', facet: 'verbal', dir: 1,
    text: 'Compared with people I know, I am the one asked to word the difficult message.' },
  { id: 'STR-02', facet: 'structurePref', dir: -1,
    text: 'I do my best when the week arrives as an open field I get to fill in myself.' },
  { id: 'REC-01', facet: 'recognition', dir: 1,
    text: 'I would take the smaller part in something people notice over the larger part in something nobody sees.' },
  { id: 'INV-03', facet: 'investigative', dir: 1,
    text: 'I will read three articles deep into something I am never going to need.' },

  // 49-60
  { id: 'ART-03', facet: 'artistic', dir: 1,
    text: 'I want the finished work to look like something only I would have made, even if nobody knows I made it.' },
  { id: 'AUT-03', facet: 'autonomy', dir: -1,
    text: 'I work better when someone I trust picks the approach and I get on with it.' },
  { id: 'SPA-02', facet: 'spatial', dir: -1,
    text: 'Compared with people I know, I need to see the finished thing in front of me before I can tell whether it fits.' },
  { id: 'SOC-03', facet: 'social', dir: 1,
    text: 'I would rather spend an hour helping someone out of a mess than an hour sorting out a spreadsheet.' },
  { id: 'PAC-02', facet: 'pace', dir: -1,
    text: 'A steady, even week with room to think suits me better than a fast one.' },
  { id: 'ENT-05', facet: 'enterprising', dir: -1,
    text: 'I would rather someone else set the direction and leave me to do the work well.' },
  { id: 'IMP-02', facet: 'impact', dir: 1,
    text: 'A well-paid job that changed nothing for anyone would wear on me within a year.' },
  { id: 'CNV-03', facet: 'conventional', dir: 1,
    text: 'Checking figures against each other until they agree is a task I would volunteer for.' },
  { id: 'ITP-01', facet: 'interpersonal', dir: 1,
    text: 'Compared with people I know, I pick up sooner when someone is not saying what they mean.' },
  { id: 'PHY-02', facet: 'physicality', dir: -1,
    text: 'I would rather do the thinking part of a job and leave the lifting to someone else.' },
  { id: 'INC-03', facet: 'income', dir: -1,
    text: 'Past the point where the bills are covered, more money would not change which job I took.' },
  { id: 'REA-04', facet: 'realistic', dir: 1,
    text: 'I want to finish the day able to point at the thing I built or fixed.' },

  // 61-72
  { id: 'INV-04', facet: 'investigative', dir: 1,
    text: 'An explanation that works but that I do not understand still nags at me.' },
  { id: 'STA-02', facet: 'stability', dir: 1,
    text: 'I would pick the employer that has been around fifty years over the one that started last year.' },
  { id: 'ORG-02', facet: 'organizational', dir: -1,
    text: 'Compared with people I know, I run more of the week out of my head than off a list.' },
  { id: 'ART-04', facet: 'artistic', dir: 1,
    text: 'Handed a template to fill in, I usually end up redesigning the template.' },
  { id: 'RSK-02', facet: 'riskTolerance', dir: -1,
    text: 'A smaller number I can count on beats a larger one I might not get.' },
  { id: 'SOC-04', facet: 'social', dir: 1,
    text: 'Teaching someone else the job satisfies me more than doing the job faster myself.' },
  { id: 'MAS-03', facet: 'mastery', dir: -1,
    text: 'Once I can do a job without much effort, that is exactly where I want to stay.' },
  { id: 'ENT-04', facet: 'enterprising', dir: 1,
    text: 'Negotiating over price or terms is something I look forward to rather than dread.' },
  { id: 'CRE-01', facet: 'creative', dir: 1,
    text: 'Compared with people I know, I bring more options to the table before settling on one.' },
  { id: 'SCH-01', facet: 'scheduleFlex', dir: 1,
    text: 'Being expected in the same building at the same hour every day would wear on me.' },
  { id: 'REC-02', facet: 'recognition', dir: 1,
    text: 'Having my name left off something I did stays with me longer than it should.' },
  { id: 'CNV-04', facet: 'conventional', dir: 1,
    text: 'I like knowing there is a written rule I can point to.' },
]

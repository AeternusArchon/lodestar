/**
 * The 72 statements a respondent rates on a 1–5 agreement scale.
 *
 * Shape: { id, facet, dir, text }
 *   id    `<FACET-PREFIX>-<NN>`. Stable and unique; answers are keyed by it, so
 *         never renumber an existing item. Retire one and add a new id instead.
 *   facet A key from FACETS in ./facets.js. Every item loads on exactly one.
 *   dir   +1 if agreeing means MORE of what the facet's blurb describes,
 *         -1 if agreeing means LESS. The scoring engine flips -1 items.
 *   text  A first-person present-tense statement. Never a question.
 *
 * Counts are fixed by tests/questions.test.js: 5 items per interest facet,
 * 3 per value, 2 per aptitude, 2 per context facet, at least one reverse-keyed
 * item in each. The two-item facets therefore run exactly one of each direction.
 *
 * Authoring rules these items were written against — they matter more than they
 * look, because a mis-keyed or off-construct item produces no error, just a
 * quietly wrong score:
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
 *      ranking yourself against a known reference group drifts less.
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
  // ── Interests ──────────────────────────────────────────────────────────────

  // realistic — tools, machines, and physical things over ideas or people
  { id: 'REA-01', facet: 'realistic', dir: 1,
    text: 'When something in the house breaks, I open it up before I look for someone to call.' },
  { id: 'REA-02', facet: 'realistic', dir: 1,
    text: 'A day spent repairing an engine or a fence sits better with me than a day spent in meetings.' },
  { id: 'REA-03', facet: 'realistic', dir: 1,
    text: 'I would rather learn to run an unfamiliar machine than learn an unfamiliar theory.' },
  { id: 'REA-04', facet: 'realistic', dir: 1,
    text: 'I want to finish the day able to point at the thing I built or fixed.' },
  { id: 'REA-05', facet: 'realistic', dir: -1,
    text: 'The work that suits me best leaves nothing behind that anyone could pick up and hold.' },

  // investigative — pulled toward problems that need figuring out
  { id: 'INV-01', facet: 'investigative', dir: 1,
    text: 'I enjoy figuring out why something broke, even when nobody asked me to.' },
  { id: 'INV-02', facet: 'investigative', dir: 1,
    text: 'I keep poking at a question after I already have an answer good enough to use.' },
  { id: 'INV-03', facet: 'investigative', dir: 1,
    text: 'I will read three articles deep into something I am never going to need.' },
  { id: 'INV-04', facet: 'investigative', dir: 1,
    text: 'An explanation that works but that I do not understand still nags at me.' },
  { id: 'INV-05', facet: 'investigative', dir: -1,
    text: 'I lose interest once a problem stops being straightforward.' },

  // artistic — room to make something recognizably your own
  { id: 'ART-01', facet: 'artistic', dir: 1,
    text: 'I change things that already work just to make them look the way I think they should.' },
  { id: 'ART-02', facet: 'artistic', dir: 1,
    text: 'Being told exactly how the finished thing should look takes the life out of the job for me.' },
  { id: 'ART-03', facet: 'artistic', dir: 1,
    text: 'I want the finished work to look like something only I would have made, even if nobody knows I made it.' },
  { id: 'ART-04', facet: 'artistic', dir: 1,
    text: 'Handed a template to fill in, I usually end up redesigning the template.' },
  { id: 'ART-05', facet: 'artistic', dir: -1,
    text: 'I would rather execute a good brief well than be handed a blank page.' },

  // social — teaching, helping, looking after people
  { id: 'SOC-01', facet: 'social', dir: 1,
    text: 'I am the person friends call when something has gone wrong.' },
  { id: 'SOC-02', facet: 'social', dir: 1,
    text: 'Explaining something until it finally lands for someone is one of the better parts of my week.' },
  { id: 'SOC-03', facet: 'social', dir: 1,
    text: 'I would rather spend an hour helping someone out of a mess than an hour sorting out a spreadsheet.' },
  { id: 'SOC-04', facet: 'social', dir: 1,
    text: 'Teaching someone else the job satisfies me more than doing the job faster myself.' },
  { id: 'SOC-05', facet: 'social', dir: -1,
    text: 'I would rather be given a task to finish than a person to look after.' },

  // enterprising — persuading, leading, setting the direction
  { id: 'ENT-01', facet: 'enterprising', dir: 1,
    text: 'In a group with no obvious leader, I end up steering things.' },
  { id: 'ENT-02', facet: 'enterprising', dir: 1,
    text: 'I enjoy talking someone around to a plan more than I enjoy carrying the plan out.' },
  { id: 'ENT-03', facet: 'enterprising', dir: 1,
    text: 'I want a say in where the whole thing is going, not just in my piece of it.' },
  { id: 'ENT-04', facet: 'enterprising', dir: 1,
    text: 'Negotiating over price or terms is something I look forward to rather than dread.' },
  { id: 'ENT-05', facet: 'enterprising', dir: -1,
    text: 'I would rather someone else set the direction and leave me to do the work well.' },

  // conventional — rules, records, and systems that already work
  { id: 'CNV-01', facet: 'conventional', dir: 1,
    text: 'A filing system that is properly kept up is genuinely satisfying to me.' },
  { id: 'CNV-02', facet: 'conventional', dir: 1,
    text: 'I would rather tighten up a process that already works than replace it with a new one.' },
  { id: 'CNV-03', facet: 'conventional', dir: 1,
    text: 'Checking figures against each other until they agree is a task I would volunteer for.' },
  { id: 'CNV-04', facet: 'conventional', dir: 1,
    text: 'I like knowing there is a written rule I can point to.' },
  { id: 'CNV-05', facet: 'conventional', dir: -1,
    text: 'Paperwork and record-keeping are the parts of any job I put off longest.' },

  // ── Values ─────────────────────────────────────────────────────────────────

  // autonomy — deciding how the work gets done
  { id: 'AUT-01', facet: 'autonomy', dir: 1,
    text: 'I would take less money for the freedom to decide how the work gets done.' },
  { id: 'AUT-02', facet: 'autonomy', dir: 1,
    text: 'Having to clear my approach with someone first takes more out of me than the work does.' },
  { id: 'AUT-03', facet: 'autonomy', dir: -1,
    text: 'I work better when someone I trust picks the approach and I get on with it.' },

  // impact — being able to point to who is better off
  { id: 'IMP-01', facet: 'impact', dir: 1,
    text: 'Being able to name one person my work helped would matter more to me than a good quarter.' },
  { id: 'IMP-02', facet: 'impact', dir: 1,
    text: 'A well-paid job that changed nothing for anyone would wear on me within a year.' },
  { id: 'IMP-03', facet: 'impact', dir: -1,
    text: 'A job is a job, and whether it changes anything is not what I judge it by.' },

  // income — what the job pays weighs heavily
  { id: 'INC-01', facet: 'income', dir: 1,
    text: 'Between two offers, the larger number would settle it for me.' },
  { id: 'INC-02', facet: 'income', dir: 1,
    text: 'I would put up with work I found dull if it paid noticeably better.' },
  { id: 'INC-03', facet: 'income', dir: -1,
    text: 'Past the point where the bills are covered, more money would not change which job I took.' },

  // stability — the job still being there in five years
  { id: 'STA-01', facet: 'stability', dir: 1,
    text: 'Not knowing whether the job will exist next year would sit at the back of my mind all year.' },
  { id: 'STA-02', facet: 'stability', dir: 1,
    text: 'I would pick the employer that has been around fifty years over the one that started last year.' },
  { id: 'STA-03', facet: 'stability', dir: -1,
    text: 'I would rather move on to something new every couple of years than stay put.' },

  // mastery — getting genuinely good at something difficult
  { id: 'MAS-01', facet: 'mastery', dir: 1,
    text: 'I want work that is still slightly beyond me three years from now.' },
  { id: 'MAS-02', facet: 'mastery', dir: 1,
    text: 'Being merely competent at something I do every day would bother me.' },
  { id: 'MAS-03', facet: 'mastery', dir: -1,
    text: 'Once I can do a job without much effort, that is exactly where I want to stay.' },

  // recognition — the work seen and credited by name
  { id: 'REC-01', facet: 'recognition', dir: 1,
    text: 'I would take the smaller part in something people notice over the larger part in something nobody sees.' },
  { id: 'REC-02', facet: 'recognition', dir: 1,
    text: 'Having my name left off something I did stays with me longer than it should.' },
  { id: 'REC-03', facet: 'recognition', dir: -1,
    text: 'I would rather do the work in the background than be the one presenting it.' },

  // ── Aptitudes — self-rated against a known reference group ─────────────────

  // analytical — taking a mess apart and finding the pattern under it
  { id: 'ANA-01', facet: 'analytical', dir: 1,
    text: 'Compared with people I know, I am quicker to see what is actually causing a mess.' },
  { id: 'ANA-02', facet: 'analytical', dir: -1,
    text: 'Compared with people I know, I go on how a situation feels more than on working it through step by step.' },

  // verbal — reading closely and putting things into words others get first time
  { id: 'VER-01', facet: 'verbal', dir: 1,
    text: 'Compared with people I know, I am the one asked to word the difficult message.' },
  { id: 'VER-02', facet: 'verbal', dir: -1,
    text: 'Compared with people I know, I would sooner talk something through than put it in writing.' },

  // spatial — holding a shape or layout in your head and turning it around
  { id: 'SPA-01', facet: 'spatial', dir: 1,
    text: 'Compared with people I know, I find it easy to picture how a room will look before anything is moved.' },
  { id: 'SPA-02', facet: 'spatial', dir: -1,
    text: 'Compared with people I know, I need to see the finished thing in front of me before I can tell whether it fits.' },

  // interpersonal — hearing what someone means underneath what they said
  { id: 'ITP-01', facet: 'interpersonal', dir: 1,
    text: 'Compared with people I know, I pick up sooner when someone is not saying what they mean.' },
  { id: 'ITP-02', facet: 'interpersonal', dir: -1,
    text: 'Compared with people I know, I take what people say at face value and find out later there was more to it.' },

  // organizational — keeping the moving parts from dropping
  { id: 'ORG-01', facet: 'organizational', dir: 1,
    text: 'Compared with people I know, fewer things slip when several deadlines land in the same week.' },
  { id: 'ORG-02', facet: 'organizational', dir: -1,
    text: 'Compared with people I know, I run more of the week out of my head than off a list.' },

  // creative — how readily ideas arrive, including the strange ones
  { id: 'CRE-01', facet: 'creative', dir: 1,
    text: 'Compared with people I know, I bring more options to the table before settling on one.' },
  { id: 'CRE-02', facet: 'creative', dir: -1,
    text: 'Compared with people I know, I am better at improving an idea already on the table than at producing new ones.' },

  // ── Context — the daily reality of the work ────────────────────────────────

  // peopleFacing — people in front of you rather than long stretches alone
  { id: 'PPL-01', facet: 'peopleFacing', dir: 1,
    text: 'A day with nobody to talk to leaves me flat, however much I got done.' },
  { id: 'PPL-02', facet: 'peopleFacing', dir: -1,
    text: 'Long stretches of working on my own are when I feel most like myself.' },

  // structurePref — the day arriving with a known shape
  { id: 'STR-01', facet: 'structurePref', dir: 1,
    text: 'I want to know before the day starts roughly what the day will contain.' },
  { id: 'STR-02', facet: 'structurePref', dir: -1,
    text: 'I do my best when the week arrives as an open field I get to fill in myself.' },

  // pace — working with the clock running
  { id: 'PAC-01', facet: 'pace', dir: 1,
    text: 'I do my best work when the deadline is close enough to be uncomfortable.' },
  { id: 'PAC-02', facet: 'pace', dir: -1,
    text: 'A steady, even week with room to think suits me better than a fast one.' },

  // physicality — on your feet rather than at a desk
  { id: 'PHY-01', facet: 'physicality', dir: 1,
    text: 'Eight hours in a chair leaves me more tired than eight hours on my feet.' },
  { id: 'PHY-02', facet: 'physicality', dir: -1,
    text: 'I would rather do the thinking part of a job and leave the lifting to someone else.' },

  // riskTolerance — betting on an uncertain outcome over a smaller sure thing
  { id: 'RSK-01', facet: 'riskTolerance', dir: 1,
    text: 'I would take the commission-only offer over the salaried one if the ceiling were higher.' },
  { id: 'RSK-02', facet: 'riskTolerance', dir: -1,
    text: 'A smaller number I can count on beats a larger one I might not get.' },

  // scheduleFlex — setting your own hours and choosing where you work
  { id: 'SCH-01', facet: 'scheduleFlex', dir: 1,
    text: 'Being expected in the same building at the same hour every day would wear on me.' },
  { id: 'SCH-02', facet: 'scheduleFlex', dir: -1,
    text: 'Fixed hours in a fixed place suit me better than deciding for myself when to work.' },
]

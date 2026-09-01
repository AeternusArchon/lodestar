/**
 * The 24 facets Lodestar measures, grouped into four dimensions.
 *
 * Order is load-bearing: the dimensions run interests → values → aptitudes →
 * context, and FACETS lists all six of each dimension together in that order.
 * The star plot draws its rays in this order, and the results readout groups by
 * it, so do not shuffle entries.
 *
 * Each facet carries TWO sentences of copy, one per pole:
 *   `blurb`    — what a HIGH score on that facet means.
 *   `blurbLow` — what a LOW score means. This is a real description of a
 *                different person, not a negation of the high one — "you do
 *                not want X" is not acceptable on its own; it has to say what
 *                that person wants instead.
 * Both are one sentence, second person, concrete, no jargon, and each states
 * its own polarity so nobody has to guess which end of the scale a number
 * sits at. This split matters beyond readability: the match engine centers
 * each dimension around its own mean (see engine/match.js), so a shared LOW
 * score between the respondent and an industry is a genuine positive
 * contributor to fit — "neither of us cares about this" is real signal, not
 * noise — and a reason built on that contributor must render `blurbLow`, or
 * the sentence asserts the opposite of what the person actually answered.
 * Callers select the pole from the respondent's own score, never the
 * industry's, since the copy is always a claim about the person reading it.
 */

export const DIMENSIONS = ['interests', 'values', 'aptitudes', 'context']

export const FACETS = [
  // Interests — RIASEC
  { key: 'realistic', dimension: 'interests', label: 'Realistic',
    blurb: 'You would rather work with tools, machines, and physical things than with ideas or people.',
    blurbLow: 'You would rather think a problem through, talk it out, or work with people than spend the day with tools or machinery in your hands.' },
  { key: 'investigative', dimension: 'interests', label: 'Investigative',
    blurb: 'You are pulled toward problems that need figuring out, and you enjoy the figuring more than the answer.',
    blurbLow: 'You want the answer itself, not the process of chasing it down; puzzling over a problem for its own sake feels like a detour.' },
  { key: 'artistic', dimension: 'interests', label: 'Artistic',
    blurb: 'You want room to make something that is recognizably yours, and work with no room for your own taste in it wears you down.',
    blurbLow: 'You would rather be handed a clear brief than a blank page, and someone else’s taste is not something you need to fight.' },
  { key: 'social', dimension: 'interests', label: 'Social',
    blurb: 'You would rather spend the day teaching, helping, or looking after people than working on things or numbers.',
    blurbLow: 'A day spent mostly with data, machines, or your own thoughts suits you better than one spent teaching or looking after people.' },
  { key: 'enterprising', dimension: 'interests', label: 'Enterprising',
    blurb: 'You like persuading and leading, and you would rather be the one deciding where something goes than the one being told.',
    blurbLow: 'Pitching, persuading, and steering a room is not where you want to spend your energy; you would rather execute a plan someone else set.' },
  { key: 'conventional', dimension: 'interests', label: 'Conventional',
    blurb: 'You are at ease with rules, records, and systems that already work, and you would rather run one well than reinvent it.',
    blurbLow: 'Fixed procedures and systems that already work chafe at you, and you would rather tear one up and build something new than tend to it.' },

  // Values
  { key: 'autonomy', dimension: 'values', label: 'Autonomy',
    blurb: 'Being left to decide how the work gets done matters more to you than most things, and being checked on constantly would cost you more than a pay cut.',
    blurbLow: 'Working inside someone else’s plan does not bother you; you would rather be handed clear direction than invent your own approach from scratch.' },
  { key: 'impact', dimension: 'values', label: 'Impact',
    blurb: 'You need to be able to point to who is better off because of your work; a job that paid well and changed nothing would feel hollow.',
    blurbLow: 'Whether the work changes anyone’s life is not what you are chasing — doing it well and getting paid for it is enough on its own.' },
  { key: 'income', dimension: 'values', label: 'Income',
    blurb: 'What a job pays weighs heavily with you, and you would trade a more interesting title for a bigger number.',
    blurbLow: 'A bigger paycheck is not what pulls you toward one job over another; you would take the more interesting work for less money.' },
  { key: 'stability', dimension: 'values', label: 'Stability',
    blurb: 'You want to know the job will still be there in five years, and uncertainty costs you more than it costs most people.',
    blurbLow: 'Not knowing whether the job still exists in five years does not rattle you, and you would take the uncertain path if the work itself was right.' },
  { key: 'mastery', dimension: 'values', label: 'Mastery',
    blurb: 'You want to get genuinely good at something difficult, and work that never got any harder would go stale on you.',
    blurbLow: 'You do not need the work to keep getting harder; doing a familiar job competently and moving on with your day is enough.' },
  { key: 'recognition', dimension: 'values', label: 'Recognition',
    blurb: 'You want your work seen and credited by name; doing it well quietly in the background is not enough.',
    blurbLow: 'Being named or credited for what you did is not something you need; doing the work well and unseen suits you fine.' },

  // Aptitudes — self-rated
  { key: 'analytical', dimension: 'aptitudes', label: 'Analytical',
    blurb: 'You take a messy situation apart, find the pattern underneath it, and can say why your conclusion holds.',
    blurbLow: 'You would rather trust a read on a situation than take it apart piece by piece and defend every step of how you got there.' },
  { key: 'verbal', dimension: 'aptitudes', label: 'Verbal',
    blurb: 'You read closely and put things into words other people understand the first time.',
    blurbLow: 'Putting a thought into words that land clearly on the first try takes real effort for you; you would rather show or do than explain.' },
  { key: 'spatial', dimension: 'aptitudes', label: 'Spatial',
    blurb: 'You can hold a shape, a layout, or a machine in your head and turn it around without having to see it.',
    blurbLow: 'You need to see a shape or a layout in front of you to work with it — turning it around in your head alone does not come easily.' },
  { key: 'interpersonal', dimension: 'aptitudes', label: 'Interpersonal',
    blurb: 'You notice what someone means underneath what they actually said, and you adjust before it becomes a problem.',
    blurbLow: 'You take people mostly at their word rather than reading what is underneath it, and picking up on unspoken tension is not a strength.' },
  { key: 'organizational', dimension: 'aptitudes', label: 'Organizational',
    blurb: 'You keep track of details, deadlines, and moving parts without dropping any, and a small mistake in your own work bothers you until it is fixed.',
    blurbLow: 'Details, deadlines, and moving parts slip past you more than you would like, and a small mistake in your own work does not keep you up at night.' },
  { key: 'creative', dimension: 'aptitudes', label: 'Creative',
    blurb: 'Ideas come to you easily, including strange ones, and you would rather produce ten options than defend the first.',
    blurbLow: 'You would rather commit early to one solid approach and execute it well than generate a pile of options to sort through.' },

  // Context — the daily reality of the work
  { key: 'peopleFacing', dimension: 'context', label: 'People-facing',
    blurb: 'You want people in front of you for most of the day rather than long stretches of working alone.',
    blurbLow: 'Long, uninterrupted stretches alone suit you better than a day spent mostly with people in front of you.' },
  { key: 'structurePref', dimension: 'context', label: 'Preference for structure',
    blurb: 'You want the day to arrive with a known shape — set procedures, clear expectations — rather than an open field you have to fill in yourself.',
    blurbLow: 'An open day with no fixed shape does not unsettle you; you would rather work out your own approach than follow a set procedure.' },
  { key: 'pace', dimension: 'context', label: 'Pace',
    blurb: 'You do your best work with the clock running, and a slow, even week is harder on you than a fast one.',
    blurbLow: 'A slow, even week suits you better than a fast one, and work against the clock wears on you rather than sharpening you.' },
  // Label is "On your feet", not "Physicality". The KEY stays `physicality` —
  // it is load-bearing across the engine, the data, and the derivation script
  // — but the label was over-promising. This facet maps to O*NET 4.C.2.d.1.b
  // ("Spend Time Standing") and to PHY-01's own wording, which is about eight
  // hours in a chair versus eight hours upright. "Physicality" reads as
  // lifting and exertion, which is why hospitality nearly tying construction
  // looked wrong at a glance when it was in fact measuring exactly what it
  // claimed. The blurbs say standing and moving, never strength.
  { key: 'physicality', dimension: 'context', label: 'On your feet',
    blurb: 'You want to spend the day upright and moving between places rather than sitting at a desk for eight hours.',
    blurbLow: 'Sitting at a desk for most of the day is no burden to you; being on your feet from morning to evening is not what you are after.' },
  { key: 'riskTolerance', dimension: 'context', label: 'Risk tolerance',
    blurb: 'You will bet on an uncertain outcome — commission, competition, something newly started — over a smaller sure thing.',
    blurbLow: 'A guaranteed smaller outcome beats a bigger uncertain one for you, and commission-driven or newly-started ventures do not appeal to you.' },
  { key: 'scheduleFlex', dimension: 'context', label: 'Schedule freedom',
    blurb: 'You want to set your own hours and choose where you work, and a fixed nine-to-five in one building would chafe.',
    blurbLow: 'A fixed nine-to-five in one place does not chafe at you, and choosing your own hours is not something you need.' },
]

export function facetsByDimension(dimension) {
  return FACETS.filter(f => f.dimension === dimension)
}

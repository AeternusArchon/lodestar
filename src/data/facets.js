/**
 * The 24 facets Lodestar measures, grouped into four dimensions.
 *
 * Order is load-bearing: the dimensions run interests → values → aptitudes →
 * context, and FACETS lists all six of each dimension together in that order.
 * The star plot draws its rays in this order, and the results readout groups by
 * it, so do not shuffle entries.
 *
 * Each `blurb` is one sentence in second person describing what a HIGH score on
 * that facet means. It is rendered verbatim next to the number on the results
 * page, so it is written for the person who just took the assessment, not for a
 * developer reading this file. Every blurb states its own polarity, so nobody
 * has to guess which end of the scale a 78 sits at.
 */

export const DIMENSIONS = ['interests', 'values', 'aptitudes', 'context']

export const FACETS = [
  // Interests — RIASEC
  { key: 'realistic', dimension: 'interests', label: 'Realistic',
    blurb: 'You would rather work with tools, machines, and physical things than with ideas or people.' },
  { key: 'investigative', dimension: 'interests', label: 'Investigative',
    blurb: 'You are pulled toward problems that need figuring out, and you enjoy the figuring more than the answer.' },
  { key: 'artistic', dimension: 'interests', label: 'Artistic',
    blurb: 'You want room to make something that is recognizably yours, and work with no room for your own taste in it wears you down.' },
  { key: 'social', dimension: 'interests', label: 'Social',
    blurb: 'You would rather spend the day teaching, helping, or looking after people than working on things or numbers.' },
  { key: 'enterprising', dimension: 'interests', label: 'Enterprising',
    blurb: 'You like persuading and leading, and you would rather be the one deciding where something goes than the one being told.' },
  { key: 'conventional', dimension: 'interests', label: 'Conventional',
    blurb: 'You are at ease with rules, records, and systems that already work, and you would rather run one well than reinvent it.' },

  // Values
  { key: 'autonomy', dimension: 'values', label: 'Autonomy',
    blurb: 'Being left to decide how the work gets done matters more to you than most things, and being checked on constantly would cost you more than a pay cut.' },
  { key: 'impact', dimension: 'values', label: 'Impact',
    blurb: 'You need to be able to point to who is better off because of your work; a job that paid well and changed nothing would feel hollow.' },
  { key: 'income', dimension: 'values', label: 'Income',
    blurb: 'What a job pays weighs heavily with you, and you would trade a more interesting title for a bigger number.' },
  { key: 'stability', dimension: 'values', label: 'Stability',
    blurb: 'You want to know the job will still be there in five years, and uncertainty costs you more than it costs most people.' },
  { key: 'mastery', dimension: 'values', label: 'Mastery',
    blurb: 'You want to get genuinely good at something difficult, and work that never got any harder would go stale on you.' },
  { key: 'recognition', dimension: 'values', label: 'Recognition',
    blurb: 'You want your work seen and credited by name; doing it well quietly in the background is not enough.' },

  // Aptitudes — self-rated
  { key: 'analytical', dimension: 'aptitudes', label: 'Analytical',
    blurb: 'You take a messy situation apart, find the pattern underneath it, and can say why your conclusion holds.' },
  { key: 'verbal', dimension: 'aptitudes', label: 'Verbal',
    blurb: 'You read closely and put things into words other people understand the first time.' },
  { key: 'spatial', dimension: 'aptitudes', label: 'Spatial',
    blurb: 'You can hold a shape, a layout, or a machine in your head and turn it around without having to see it.' },
  { key: 'interpersonal', dimension: 'aptitudes', label: 'Interpersonal',
    blurb: 'You notice what someone means underneath what they actually said, and you adjust before it becomes a problem.' },
  { key: 'organizational', dimension: 'aptitudes', label: 'Organizational',
    blurb: 'You keep track of details, deadlines, and moving parts without dropping any, and a small mistake in your own work bothers you until it is fixed.' },
  { key: 'creative', dimension: 'aptitudes', label: 'Creative',
    blurb: 'Ideas come to you easily, including strange ones, and you would rather produce ten options than defend the first.' },

  // Context — the daily reality of the work
  { key: 'peopleFacing', dimension: 'context', label: 'People-facing',
    blurb: 'You want people in front of you for most of the day rather than long stretches of working alone.' },
  { key: 'structurePref', dimension: 'context', label: 'Preference for structure',
    blurb: 'You want the day to arrive with a known shape — set procedures, clear expectations — rather than an open field you have to fill in yourself.' },
  { key: 'pace', dimension: 'context', label: 'Pace',
    blurb: 'You do your best work with the clock running, and a slow, even week is harder on you than a fast one.' },
  { key: 'physicality', dimension: 'context', label: 'Physicality',
    blurb: 'You want to be on your feet and moving rather than sitting at a desk for eight hours.' },
  { key: 'riskTolerance', dimension: 'context', label: 'Risk tolerance',
    blurb: 'You will bet on an uncertain outcome — commission, competition, something newly started — over a smaller sure thing.' },
  { key: 'scheduleFlex', dimension: 'context', label: 'Schedule freedom',
    blurb: 'You want to set your own hours and choose where you work, and a fixed nine-to-five in one building would chafe.' },
]

export function facetsByDimension(dimension) {
  return FACETS.filter(f => f.dimension === dimension)
}

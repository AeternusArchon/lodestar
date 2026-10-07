/**
 * Where each of the 24 industry numbers comes from, in reader-facing terms.
 *
 * The derivation script and industries.js already record this in comments.
 * Comments are invisible to the person reading a results card, who is being
 * asked to weigh "this field typically runs 72 here" without any way to see
 * whether 72 was measured or judged. This module makes that visible: for the
 * 17 derived facets, the O*NET element the number came from; for the 7
 * authored ones, what question the author was answering.
 *
 * DERIVED_SOURCE must stay in lockstep with the MAP in
 * data-build/derive-industry-vectors.mjs. tests/provenance.test.js compares
 * them, so a change to the script without a change here fails the build.
 */

export const DERIVED_SOURCE = {
  realistic:      { scale: 'OI', els: ['1.B.1.a'], file: 'Career Interest Types.txt', what: 'O*NET Realistic interest rating for the industry’s occupations' },
  investigative:  { scale: 'OI', els: ['1.B.1.b'], file: 'Career Interest Types.txt', what: 'O*NET Investigative interest rating' },
  artistic:       { scale: 'OI', els: ['1.B.1.c'], file: 'Career Interest Types.txt', what: 'O*NET Artistic interest rating' },
  social:         { scale: 'OI', els: ['1.B.1.d'], file: 'Career Interest Types.txt', what: 'O*NET Social interest rating' },
  enterprising:   { scale: 'OI', els: ['1.B.1.e'], file: 'Career Interest Types.txt', what: 'O*NET Enterprising interest rating' },
  conventional:   { scale: 'OI', els: ['1.B.1.f'], file: 'Career Interest Types.txt', what: 'O*NET Conventional interest rating' },
  analytical:     { scale: 'LV', els: ['1.A.1.b.4', '1.A.1.b.3'], file: 'Abilities.txt', what: 'O*NET abilities: Inductive and Deductive Reasoning, level required' },
  verbal:         { scale: 'LV', els: ['1.A.1.a.1', '1.A.1.a.2'], file: 'Abilities.txt', what: 'O*NET abilities: Oral and Written Comprehension, level required' },
  spatial:        { scale: 'LV', els: ['1.A.1.f.1', '1.A.1.f.2'], file: 'Abilities.txt', what: 'O*NET abilities: Spatial Orientation and Visualization, level required' },
  creative:       { scale: 'LV', els: ['1.A.1.b.2', '1.A.1.b.1'], file: 'Abilities.txt', what: 'O*NET abilities: Originality and Fluency of Ideas, level required' },
  interpersonal:  { scale: 'LV', els: ['2.B.1.a'],                file: 'Transferable Skills.txt', what: 'O*NET skill: Social Perceptiveness, level required' },
  organizational: { scale: 'CX', els: ['4.C.3.b.4'],              file: 'Work Context.txt', what: 'O*NET work context: Importance of Being Exact or Accurate' },
  peopleFacing:   { scale: 'CX', els: ['4.C.1.b.1.f'], file: 'Work Context.txt', what: 'O*NET work context: Deal With External Customers or the Public' },
  physicality:    { scale: 'CX', els: ['4.C.2.d.1.b'], file: 'Work Context.txt', what: 'O*NET work context: Spend Time Standing' },
  structurePref:  { scale: 'CX', els: ['4.C.3.b.7'], file: 'Work Context.txt', what: 'O*NET work context: Structured versus Unstructured Work' },
  pace:           { scale: 'CX', els: ['4.C.3.d.1'], file: 'Work Context.txt', what: 'O*NET work context: Pace Determined by Speed of Equipment' },
  riskTolerance:  { scale: 'CX', els: ['4.C.3.c.1'], file: 'Work Context.txt', what: 'O*NET work context: Level of Competition' },
}

/**
 * For each authored facet, the question the author answered per industry.
 * These are the same definitions the second-rater rubric uses
 * (data-build/values-rubric.md), so two raters are answering one question.
 */
export const AUTHORED_RATIONALE = {
  autonomy: 'How much the work lets a person decide HOW it gets done. Judged, not measured: O*NET dropped Work Values from its database.',
  impact: 'How directly a person can point to who is better off because of the work. Judged, not measured.',
  income: 'What the industry typically pays, weighing the floor as well as the ceiling across its common roles. Judged, not measured.',
  stability: 'The odds the job still exists, for this person, in five years. Judged, not measured.',
  mastery: 'Whether the work keeps getting harder in a way that rewards getting better. Judged, not measured.',
  recognition: 'How much visible, named credit and advancement the path offers. Judged, not measured.',
  scheduleFlex: 'How much a career here lets a person choose their own hours and place. O*NET records schedules as categories, not a scale, so this is judged per industry.',
}

# Rating rubric for the six authored Values facets

The six Values facets per industry (`autonomy`, `impact`, `income`, `stability`,
`mastery`, `recognition`) have no O*NET source and are editorial estimates. One
person wrote the 132 numbers in `src/data/industries.js`. One opinion, however
careful, is one opinion. This rubric exists so a second person can rate the same
22 industries blind - without reading the existing numbers - and the two sets can
be averaged, with the disagreement shown to the respondent.

## How to rate

1. Do not open `src/data/industries.js` until you have finished.
2. For each industry, answer the question under each facet on a 0-100 scale,
   using the anchors. Rate the **typical deal** a person gets in that industry
   across its common occupations - not the best case, not the worst.
3. Write your numbers into `src/data/authored-values-rater2.json` under
   `values`, keyed by industry key, with `meta.rater` set to your initials and
   `meta.date` to today. Run `npm test`.
4. Only then compare with the first rater. Do not reconcile - the point is the
   difference. If a gap is over 25 points, both raters write one sentence on why
   and leave the numbers as they are.

## The six questions and their anchors

### autonomy - How much does the work let you decide HOW it gets done?
- 10: Procedures are fixed and audited; deviation is a disciplinary matter.
- 30: A supervisor sets method and checks it often.
- 50: Method is yours inside a clear brief; review at milestones.
- 70: You set the approach; others see outcomes, not steps.
- 90: Nobody is positioned to tell you how; you answer for results alone.

### impact - How directly can you point to who is better off because of your work?
- 10: The link between your work and any person's wellbeing is several steps removed.
- 30: You can name who benefits but rarely see it.
- 50: Some roles see the effect on people; most do not.
- 70: You see the effect on named people most weeks.
- 90: The effect on a person is the job itself, visible daily.

### income - How much does the industry typically pay, weighing the floor as well as the ceiling?
- 10: Common roles sit at or near minimum wage with little progression.
- 30: Entry pay is low; the median is below the national median.
- 50: Around the national median, with a modest spread.
- 70: Comfortably above median; a credible path to the top decile.
- 90: High floor and a very high ceiling across common roles.

### stability - What are the odds the job still exists, for you, in five years?
- 10: Seasonal, gig, or commission; income routinely goes to zero between engagements.
- 30: Frequent layoffs or project endings; regular job search is part of the career.
- 50: Normal exposure to the business cycle.
- 70: Steady demand; layoffs are unusual.
- 90: Tenure, licensure, or structural demand makes the role close to permanent.

### mastery - Does the work keep getting harder in a way that rewards getting better?
- 10: Competence is reached in weeks and the work does not deepen.
- 30: A year to proficiency; after that, variations on the same thing.
- 50: Several years to be good; a real difference between good and great.
- 70: A decade-long skill curve; experts are recognisable and sought.
- 90: Lifelong deepening; the frontier of the craft moves and you can move it.

### recognition - How much visible, named credit and advancement does the path offer?
- 10: Work is anonymous by design; advancement is rare or lateral.
- 30: Credit stays inside the team; titles change slowly.
- 50: Named credit for notable work; a visible ladder.
- 70: Your name attaches to your work; advancement is public and expected.
- 90: Reputation is the currency of the field; the work is signed.

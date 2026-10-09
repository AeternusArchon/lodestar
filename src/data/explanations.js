/**
 * A plain-language note for each of the 72 items, shown behind a "What does
 * this mean?" control on the question screen.
 *
 * One rule governs every line here, and it matters more than the prose: the
 * note NEVER names what the statement measures. The items in questions.js
 * are written so that nobody answers the label instead of the sentence —
 * "I want credit for my work" gets a different answer from the trade-off
 * actually asked — and a note that said "this is about recognition" would
 * undo that in one line. So each note rewords the statement, gives one
 * everyday example of the choice it describes, and stops. It says what the
 * two answers look like in a real life; it does not say which facet they
 * feed or which pole is "high".
 *
 * Keyed by item id. Every id in QUESTIONS must have an entry; the test
 * asserts it, and asserts that no note contains a facet label or key.
 */
export const EXPLANATIONS = {
  'REA-01': 'When the washing machine or the Wi-Fi stops working, is your first instinct to take it apart and look, or to find someone who fixes these things?',
  'AUT-01': 'Imagine two jobs: one pays more but a manager signs off on how you do everything; the other pays less and leaves the method entirely to you. Which would you take?',
  'ANA-02': 'When a situation is messy, do you tend to trust your gut read of it, or do you sit down and work through it piece by piece? Compare yourself to the people around you, not to an ideal.',
  'INV-05': 'When a problem turns out to be more tangled than it looked, does your interest drop off, or do you get more into it?',
  'PPL-01': 'A whole workday without a real conversation — nobody to talk to, just you and the task. Does that leave you feeling drained even if you got a lot done, or does it suit you fine?',
  'ART-01': 'If something already works fine but doesn’t look the way you’d have made it, do you leave it alone, or do you change it anyway?',
  'IMP-01': 'Which would feel like a better month: knowing one specific person is better off because of your work, or hitting a strong number for the business?',
  'SOC-05': 'Given the choice, would you rather be handed a job to complete, or a person to help, train, or look after?',
  'VER-02': 'When you explain something, does it usually land the first time, or do you often find yourself explaining it a second way? Compare yourself to the people around you.',
  'STR-01': 'Do you want to know, before the day starts, roughly what it will involve — or is a day with no set shape fine with you?',
  'INC-01': 'Two job offers, similar work. One pays clearly more. Does the bigger number decide it, or would other things weigh just as much?',
  'ENT-01': 'In a group project where nobody has been put in charge, do you tend to end up running it, or do you wait for someone else to?',
  'CNV-05': 'Forms, records, logs, filing — the paperwork side of any job. Is that the part you leave until last, or does it not bother you?',
  'STA-03': 'Would you rather change jobs or roles every couple of years for something new, or stay somewhere for a long stretch?',
  'SPA-01': 'Before the furniture is moved, can you already see in your head how the room will look? Compare yourself to the people around you.',
  'REA-02': 'A day fixing something physical — an engine, a fence, a machine — versus a day of meetings. Which one would you rather have?',
  'PAC-01': 'Do you work best when the deadline is close enough to make you a little uncomfortable, or does pressure like that get in your way?',
  'INV-01': 'When something breaks and nobody asked you to look into it, do you still want to know why it broke?',
  'MAS-01': 'Three years into a job, would you want the work to still be a bit beyond you — still hard — or would you rather have it fully in hand?',
  'ART-05': 'Would you rather be given a clear brief and do it well, or be handed a blank page and decide everything yourself?',
  'ITP-02': 'When someone says "it’s fine" or "sure, whatever works," do you tend to take that as true, and only later find out they meant something else? Compare yourself to the people around you.',
  'PHY-01': 'Which leaves you more tired: eight hours sitting at a desk, or eight hours standing and moving around?',
  'REC-03': 'When work gets presented, would you rather be the one who did it quietly in the background, or the one standing up and showing it?',
  'SOC-01': 'When something goes wrong for a friend, are you the one they call?',
  'ENT-02': 'Which do you enjoy more: convincing someone to go with a plan, or actually carrying the plan out once it’s agreed?',
  'AUT-02': 'Having to run your approach past someone before you start — does that cost you more energy than the work itself, or is it no big deal?',
  'ORG-01': 'When several deadlines land in the same week, do fewer things slip for you than for most people you know?',
  'CNV-01': 'A filing system, a spreadsheet, a set of records that is properly kept up and in order — does that give you real satisfaction?',
  'RSK-01': 'Two offers for the same job: a safe salary, or commission only with a higher possible ceiling. Which would you take?',
  'REA-05': 'Think about the work that suits you best. At the end of the day, is there a physical thing someone could pick up — or is it all ideas, screens, and conversations?',
  'IMP-03': 'Do you judge a job by whether it changes anything for anyone, or is a job just a job as long as it’s done well and pays?',
  'INV-02': 'Once you have an answer that’s good enough to use, do you stop there, or do you keep digging anyway?',
  'CRE-02': 'Are you better at taking an idea that’s already on the table and making it better, or at coming up with new ones from scratch? Compare yourself to the people around you.',
  'SCH-02': 'Fixed hours in one place, versus choosing for yourself when and where you work. Which actually suits you better — not which sounds better?',
  'INC-02': 'Would you put up with work you found boring if it paid noticeably more than something more interesting?',
  'ART-02': 'If someone tells you exactly how the finished thing should look, does that take the life out of the job for you, or does it make it easier?',
  'SOC-02': 'Explaining something to someone until it finally clicks for them — is that one of the better parts of your week, or a chore?',
  'STA-01': 'If you weren’t sure the job would still exist next year, would that sit at the back of your mind all year, or would you mostly not think about it?',
  'ANA-01': 'When things are going wrong, are you quicker than most people you know at spotting what’s actually causing it?',
  'ENT-03': 'Do you want a say in where the whole project or business is going, or are you happy to own your piece and let others steer?',
  'PPL-02': 'Long stretches working alone, nobody around — is that when you feel most like yourself, or does it wear on you?',
  'CNV-02': 'Something works but could be tighter. Would you rather improve it as it is, or throw it out and build something new?',
  'MAS-02': 'If you were merely competent at something you do every day — fine, not great — would that bother you?',
  'REA-03': 'Would you rather learn to operate an unfamiliar machine, or learn an unfamiliar theory?',
  'VER-01': 'When there’s a difficult message to write — bad news, a sensitive email — are you the one people ask to word it? Compare yourself to the people around you.',
  'STR-02': 'A week with nothing fixed in it, that you get to shape yourself — is that when you do your best work, or does it leave you adrift?',
  'REC-01': 'A smaller role in something people notice, or a bigger role in something nobody sees. Which would you take?',
  'INV-03': 'Do you find yourself three articles deep into something you’ll never actually need, just because you got curious?',
  'ART-03': 'Do you want the finished work to look like something only you would have made, even if nobody ever knows it was you?',
  'AUT-03': 'When someone you trust picks the approach and you just get on with it — do you work better that way than when you have to decide the approach yourself?',
  'SPA-02': 'Do you need to see the finished thing in front of you before you can tell whether it fits, or can you judge it in your head? Compare yourself to the people around you.',
  'SOC-03': 'An hour helping someone out of a mess, or an hour sorting out a spreadsheet. Which would you rather spend?',
  'PAC-02': 'A steady, even week with room to think, versus a fast one. Which suits you better?',
  'ENT-05': 'Would you rather someone else set the direction and leave you to do the work well?',
  'IMP-02': 'A well-paid job that doesn’t change anything for anyone. Would that wear on you within a year, or would the pay be enough?',
  'CNV-03': 'Checking figures against each other until everything agrees — is that a task you’d volunteer for?',
  'ITP-01': 'When someone says one thing but means another — "I’m fine," "interesting idea" — do you catch it sooner than most people you know?',
  'PHY-02': 'Would you rather do the thinking part of a job and leave the physical part to someone else?',
  'INC-03': 'Once the bills are covered, would more money change which job you’d take — or would you pick on other things?',
  'REA-04': 'At the end of the day, do you want to be able to point at the thing you built or fixed?',
  'INV-04': 'If something works but you don’t understand why, does that nag at you, or is working enough?',
  'STA-02': 'An employer that’s been around fifty years, or one that started last year. Which would you pick?',
  'ORG-02': 'Do you run most of your week out of your head, or off a written list? Compare yourself to the people around you.',
  'ART-04': 'Handed a template to fill in, do you fill it in — or do you usually end up redesigning the template?',
  'RSK-02': 'A guaranteed smaller amount, or a bigger amount you might not get. Which one?',
  'SOC-04': 'Teaching someone else to do the job, versus just doing it faster yourself. Which satisfies you more?',
  'MAS-03': 'Once you can do a job without much effort, is that exactly where you want to stay — or do you start looking for the next hard thing?',
  'ENT-04': 'Negotiating over price or terms — something you look forward to, or something you dread?',
  'CRE-01': 'Before settling on one option, do you bring more possibilities to the table than most people you know?',
  'SCH-01': 'Being expected in the same building at the same hour every day — would that wear on you, or is it fine?',
  'REC-02': 'If your name was left off something you did, would it stay with you longer than it should?',
  'CNV-04': 'Do you like knowing there is a written rule you can point to, or would you rather work it out as you go?',
}

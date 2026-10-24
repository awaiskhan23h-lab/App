export type Category = 'work' | 'personal';
export type Difficulty = 'easy' | 'realistic' | 'tough';

/** Lines the demo coach draws from as the conversation moves through its phases. */
export interface DemoScript {
  resist: string[];
  probe: string[];
  soften: string[];
  close: string[];
  /** Said when the user makes a clear, concrete ask for the first time. */
  onAsk: string[];
  /** Said when the user sounds unsure (hedging or apologising). */
  exploit: string[];
}

export interface Scenario {
  id: string;
  title: string;
  category: Category;
  emoji: string;
  /** Who the AI plays. */
  persona: string;
  /** What the user is trying to achieve, shown before they start. */
  goal: string;
  /** What a clear ask looks like here; used for feedback. Omit when there's no single ask. */
  askPattern?: RegExp;
  askHint?: string;
  opener: string;
  demo: DemoScript;
}

const NUMBER = /(\$|£|€)\s?\d|\d+\s?(k|%|percent|thousand|grand)\b|\d{2,}/i;

export const SCENARIOS: Scenario[] = [
  {
    id: 'raise',
    title: 'Ask for a raise',
    category: 'work',
    emoji: '💰',
    persona: 'Jordan, your manager',
    goal: 'Get a concrete pay rise, or a clear plan and date for one.',
    askPattern: NUMBER,
    askHint: 'Name a specific number or percentage.',
    opener: "Hey, you wanted to chat? I've got about fifteen minutes before my next call.",
    demo: {
      resist: [
        "Budgets are really tight this year. Leadership has basically frozen increases outside the review cycle.",
        "I hear you, but everyone on the team is working hard right now. What makes your case different?",
        "Honestly, reviews are in six months. Can this wait until then?",
      ],
      probe: [
        "Okay. What specifically have you delivered that goes beyond your role?",
        "What number did you have in mind, and how did you get to it?",
        "If I take this to my boss, what's the one result I should lead with?",
      ],
      soften: [
        "That's a fair point. I didn't realise the impact on the client renewal was that big.",
        "Alright, I can see you've thought this through. I'll need it in writing to make the case.",
      ],
      close: [
        "Let me take this to finance this week. Send me a one-page summary and I'll come back to you by Friday.",
      ],
      onAsk: [
        "That's higher than I expected. Walk me through why that number is fair.",
      ],
      exploit: [
        "It sounds like you're not totally sure about this yourself. Maybe we revisit it next quarter?",
        "If it's just a thought, let's park it for the annual review.",
      ],
    },
  },
  {
    id: 'offer',
    title: 'Negotiate a job offer',
    category: 'work',
    emoji: '🤝',
    persona: 'Sam, a recruiter',
    goal: 'Raise the offer, or win extras like signing bonus, remote days or holiday.',
    askPattern: NUMBER,
    askHint: 'Counter with a specific figure.',
    opener: "Great news, the team loved you! We'd like to offer you the role. Did you get a chance to look at the numbers?",
    demo: {
      resist: [
        "That offer is already at the top of the band for this level, to be honest.",
        "We've had a lot of strong candidates, so we built the offer to be competitive from the start.",
        "I'm not sure there's much room to move on base salary.",
      ],
      probe: [
        "Do you have a competing offer, or is this based on market research?",
        "If we could move on one thing, what matters most to you?",
      ],
      soften: [
        "Let me see what I can do. The hiring manager really wants you on the team.",
        "There might be some flexibility on the signing bonus.",
      ],
      close: [
        "I'll take your counter to the hiring manager today and get back to you within 48 hours.",
      ],
      onAsk: ["Okay, that's a specific number. What's it based on?"],
      exploit: [
        "So it sounds like you're happy with the offer as it is? I can send the contract today.",
      ],
    },
  },
  {
    id: 'resign',
    title: 'Hand in your notice',
    category: 'work',
    emoji: '🚪',
    persona: 'Alex, your manager',
    goal: 'Resign clearly and professionally without being talked out of it.',
    askPattern: /\b(resign|resigning|notice|leaving|last day|moving on|accepted (an|a) (offer|role|position))\b/i,
    askHint: 'Say plainly that you are resigning and when your last day is.',
    opener: "Oh, a calendar invite from you? Sounds serious. What's up?",
    demo: {
      resist: [
        "Wow. That's a surprise. Is there anything we could do to change your mind?",
        "This really isn't a great time with the launch coming up. Could you stay until it ships?",
      ],
      probe: [
        "Can I ask what they're offering? Maybe we can match it.",
        "Was it something about the team, or about me?",
      ],
      soften: ["I'm disappointed, but I understand. It sounds like a great opportunity."],
      close: [
        "Okay. Let's sort out a handover plan. Can you send me your notice in writing today?",
      ],
      onAsk: ["Okay. I appreciate you telling me directly. When's your last day?"],
      exploit: ["It sounds like you're still deciding. Let's talk about a counter-offer before you commit."],
    },
  },
  {
    id: 'workload',
    title: 'Push back on workload',
    category: 'work',
    emoji: '📚',
    persona: 'Taylor, your team lead',
    goal: 'Say no to new work, or agree what gets dropped to make room.',
    askPattern: /\b(can'?t|cannot|won'?t be able|not able|prioriti[sz]e|drop|deprioriti[sz]e|which (one|of these)|trade.?off|push back)\b/i,
    askHint: 'Say clearly what you can’t take on, or ask what should be dropped.',
    opener: "Hey, quick one. I need you to pick up the Henderson report too. It's due Thursday. That's fine, right?",
    demo: {
      resist: [
        "Everyone's stretched right now. I really need you on this one.",
        "It's only a few hours of work. I'm sure you can fit it in.",
      ],
      probe: [
        "Okay, so what's on your plate right now that's taking all the time?",
        "If you had to drop one thing, what would it be?",
      ],
      soften: ["Fair enough. I didn't realise the migration was eating that much of your week."],
      close: ["Let's move the migration deadline to next week, and you take the report. Does that work?"],
      onAsk: ["Okay, that's clear. Let's look at what can move."],
      exploit: ["Great, so you'll squeeze it in? Thanks, you're a star."],
    },
  },
  {
    id: 'breakup',
    title: 'End a relationship',
    category: 'personal',
    emoji: '💔',
    persona: 'Chris, your partner',
    goal: 'End things kindly but clearly, without leaving false hope.',
    askPattern: /\b(break up|breaking up|end (this|things|it|us|the relationship)|not working|over between|we should stop|split up)\b/i,
    askHint: 'Say clearly that the relationship is ending.',
    opener: "Hey, you said you wanted to talk? You seem a bit nervous. Is everything okay?",
    demo: {
      resist: [
        "Wait, what? Where is this coming from? I thought things were good.",
        "Is this because of last weekend? We can fix that.",
      ],
      probe: [
        "Have you met someone else?",
        "Can't we at least try? Maybe take a break instead?",
      ],
      soften: ["I... okay. I guess I've felt it too, if I'm honest."],
      close: ["I need some time to process this. Can we talk about the flat and our stuff in a few days?"],
      onAsk: ["You really mean that? You're sure?"],
      exploit: ["So you're not sure? Then let's not throw it all away. Let's just try harder."],
    },
  },
  {
    id: 'parent',
    title: 'Set a boundary with a parent',
    category: 'personal',
    emoji: '🏡',
    persona: 'Mum',
    goal: 'Stop the surprise visits and agree to calling ahead first.',
    askPattern: /\b(call (me |first|ahead|before)|text (me |first|before)|ask (me )?first|check with me|need you to|i'?d like you to|please don'?t)\b/i,
    askHint: 'Make one specific request, like “please call before you come over”.',
    opener: "Surprise! I was in the area so I brought you some soup. You don't mind, do you?",
    demo: {
      resist: [
        "I'm your mother! I don't need an appointment to see my own child.",
        "I'm only trying to help. You never call me anyway.",
      ],
      probe: [
        "So what, you want me to stop coming over altogether?",
        "Is this coming from you, or did someone put this idea in your head?",
      ],
      soften: ["Well... I suppose I could send a message first. I just miss you, that's all."],
      close: ["Fine. I'll call first. But you have to come to Sunday lunch more often then."],
      onAsk: ["Call ahead? To my own child's home? Hmm."],
      exploit: ["Oh, so it's fine really then. I'll pop round Thursday too!"],
    },
  },
  {
    id: 'flatmate',
    title: 'Confront a messy flatmate',
    category: 'personal',
    emoji: '🧽',
    persona: 'Riley, your flatmate',
    goal: 'Agree a fair cleaning arrangement without a blow-up.',
    askPattern: /\b(rota|schedule|agree|could you|can you|would you|let'?s|every (week|day)|by tonight|take turns)\b/i,
    askHint: 'Propose a specific fix, like a rota or “dishes done by bedtime”.',
    opener: "Oh hey. You've got that look. Is this about the kitchen?",
    demo: {
      resist: [
        "I've been really busy with work, okay? It's not that bad.",
        "You left your stuff in the bathroom last week, so…",
      ],
      probe: [
        "What exactly do you want me to do?",
        "Is it just the dishes, or is there more?",
      ],
      soften: ["Yeah, okay, fair. I have been slacking. Sorry."],
      close: ["Alright, let's do a rota. I'll stick it on the fridge tonight."],
      onAsk: ["A rota? I guess that could work. Who does what?"],
      exploit: ["Cool, so it's not a big deal then. I'll get to them eventually."],
    },
  },
  {
    id: 'money',
    title: 'Ask a friend to pay you back',
    category: 'personal',
    emoji: '💸',
    persona: 'Morgan, your friend',
    goal: 'Get a date for the money they owe, and keep the friendship.',
    askPattern: /(\$|£|€)\s?\d|\b(pay (me )?back|by (friday|monday|the end|next week|\w+day)|when can you|owe)\b/i,
    askHint: 'Mention the amount and ask for a date.',
    opener: "Heyyy! What's up? Fancy grabbing food later?",
    demo: {
      resist: [
        "Oh, that. Yeah, I've been meaning to. Things are just a bit tight right now.",
        "Didn't I get the last round of drinks though? I thought that kind of evened out.",
      ],
      probe: ["How much was it again?", "Is it urgent? I get paid at the end of the month."],
      soften: ["You're right, I'm sorry. I didn't realise it had been that long."],
      close: ["I'll send half now and the rest on payday, the 28th. Promise."],
      onAsk: ["Okay, okay. That's fair. Let me check my account."],
      exploit: ["Ah no worries then, I'll sort it at some point!"],
    },
  },
  {
    id: 'interview',
    title: 'Job interview: tough questions',
    category: 'work',
    emoji: '🎤',
    persona: 'Pat, a hiring manager',
    goal: 'Answer confidently with specific examples and results.',
    askPattern: /\d|\b(result|increased|reduced|led|built|launched|delivered|saved)\b/i,
    askHint: 'Back up answers with a specific example and result.',
    opener: "Thanks for coming in. Let's start simple: tell me about yourself.",
    demo: {
      resist: [
        "Okay. What would you say is your biggest weakness?",
        "Why are you leaving your current role?",
      ],
      probe: [
        "Tell me about a time something went badly wrong. What did you do?",
        "Why should we pick you over the other candidates?",
      ],
      soften: ["That's a really good example. I like that you measured the outcome."],
      close: ["Great. Do you have any questions for me before we wrap up?"],
      onAsk: ["Nice, that's concrete. What was your role in that, specifically?"],
      exploit: ["Hmm. Can you give me something more concrete than that?"],
    },
  },
];

export const CUSTOM_ID = 'custom';

export function customScenario(who: string, goal: string): Scenario {
  const persona = who.trim() || 'The other person';
  return {
    id: CUSTOM_ID,
    title: goal.trim() || 'Custom conversation',
    category: 'personal',
    emoji: '✍️',
    persona,
    goal: goal.trim() || 'Say what you need to say, clearly and calmly.',
    opener: "Hi. You said you wanted to talk to me about something?",
    demo: {
      resist: [
        "Hmm. I'm not sure I see it the same way.",
        "That's a lot to take in. Why are you bringing this up now?",
      ],
      probe: ["What exactly are you asking me to do?", "How long have you felt like this?"],
      soften: ["Okay. I can see this matters to you. I appreciate you being straight with me."],
      close: ["Alright. Let's go with what you suggested and check in again in a couple of weeks."],
      onAsk: ["Okay, that's clear. Let me think about that."],
      exploit: ["It sounds like you're not sure yourself. Maybe we leave it for now?"],
    },
  };
}

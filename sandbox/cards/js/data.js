// ============================================
// GAME DATA: Characters, Cards, Endings
// if (choice): Where every choice has consequences
// ============================================

// ==================== CHARACTER DEFINITIONS ====================
const CHARACTERS = {
  self: {
    name: "Me",
    icon: "💭",
    image: "self.jpg",
    color: "text-gray-400",
  },
  junior: {
    name: "Amit",
    icon: "🌱",
    image: "junior.jpg",
    color: "text-green-400",
  },
  cto: {
    name: "Balu",
    icon: "💼",
    image: "cto.jpg",
    color: "text-blue-400",
  },
  vc: {
    name: "Kailash",
    icon: "💰",
    image: "vc.jpg",
    color: "text-yellow-400",
  },
  therapist: {
    name: "Dr. Parna",
    icon: "🧠",
    image: "therapist.jpg",
    color: "text-purple-400",
  },
  whistleblower: {
    name: "Anonymous Coworker",
    icon: "🔔",
    image: "coworker.jpg",
    color: "text-orange-400",
  },
  twitter: {
    name: "@furktechbros",
    icon: "🐦",
    image: "mob.jpg",
    color: "text-cyan-400",
  },
  user: {
    name: "Random User Email",
    icon: "📧",
    image: "email.jpg",
    color: "text-red-400",
  },
  intern: {
    name: "Purav",
    icon: "🎓",
    image: "intern.jpg",
    color: "text-pink-400",
  },
  partner: {
    name: "My Love",
    icon: "❤️",
    image: "love.jpg",
    color: "text-rose-400",
  },
  auditor: {
    name: "Shreshth",
    icon: "📋",
    image: "compliance-officer.jpg",
    color: "text-indigo-400",
  },
  investor: {
    name: "Joel",
    icon: "💸",
    image: "investor.jpg",
    color: "text-emerald-400",
  },
  former: {
    name: "Shrinivasan",
    icon: "🏢",
    image: "former.jpg",
    color: "text-blue-300",
  },
  maintainer: {
    name: "Souhrud",
    icon: "🛠️",
    image: "oss-maintainer.jpg",
    color: "text-orange-300",
  },
  pm: {
    name: "Krishna",
    icon: "📊",
    image: "pm.jpg",
    color: "text-violet-400",
  },
  recruiter: {
    name: "Shakti",
    icon: "💼",
    image: "recruiter.jpg",
    color: "text-teal-400",
  },
};

// ==================== CARD TYPES ====================
const CARD_TYPES = {
  SELF: "self", // Internal dialogue
  REQUEST: "request", // Character asks for something
  CONSEQUENCE: "consequence", // Past choices haunting you
  EVENT: "event", // Random world event
};

// ==================== HELPER FUNCTION ====================
// Gets player name from storage, falls back to "Amit"
function getPlayerName() {
  return localStorage.getItem("if_choice_player_name") || "Amit";
}

// ==================== THE CARDS ====================
// LEFT = NO (Conservative, Safe, Decline, Refuse, Status Quo)
// RIGHT = YES (Risky, Accept, Change, Agree, Growth)
// Use ${char.name} for character names, ${getPlayerName()} for player name

const CARDS = [
  // 1. SELF - Opening existential
  {
    id: 1,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "My code serves 2 billion people. A bug affects 0.1% of users. That's... that's 2 million humans. Do I delay the revenue update to fix it?",
    leftChoice: "Ship it anyway",
    rightChoice: "Fix it first",
    leftEffect: { money: 15, soul: -10, social: 5, happiness: -5 },
    rightEffect: { money: -10, soul: 10, social: -5, happiness: 5 },
  },

  // 2. REQUEST - Junior dev being idealistic
  {
    id: 2,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name} bursts in: 'I can automate my entire job. Should I tell the boss or just... enjoy the free time?' He's looking at me for guidance.`;
    },
    leftChoice: "Stay quiet",
    rightChoice: "Be honest",
    leftEffect: { money: 5, soul: -10, social: 10, happiness: 5 },
    rightEffect: { money: -5, soul: 10, social: -10, happiness: -5 },
  },

  // 3. SELF - The classic question
  {
    id: 3,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I can write tests for this 'temporary' feature. But we both know 'temporary' means 'permanent in production for 5 years.'",
    leftChoice: "Skip tests",
    rightChoice: "Test it properly",
    leftEffect: { money: 10, soul: -10, social: 5, happiness: 5 },
    rightEffect: { money: -5, soul: 10, social: -5, happiness: -5 },
  },

  // 4. REQUEST - CTO being pragmatic (dead inside)
  {
    id: 4,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name} walks over: 'Push this to prod. We'll fix bugs later. IPO is in 2 weeks.' His eye twitches slightly.`;
    },
    leftChoice: "Push back",
    rightChoice: "Deploy it",
    leftEffect: { money: -10, soul: 5, social: -15, happiness: 5 },
    rightEffect: { money: 15, soul: -15, social: 10, happiness: -10 },
  },

  // 5. EVENT - The universe testing you
  {
    id: 5,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.twitter;
    },
    get question() {
      const char = this.character;
      return `${char.name} is ANGRY. Someone found out our ML model performs worse on darker skin tones. #TechEthicsFail is trending. The board is... displeased.`;
    },
    leftChoice: "PR statement only",
    rightChoice: "Actually fix it",
    leftEffect: { money: -5, soul: -15, social: -10, happiness: -10 },
    rightEffect: { money: -20, soul: 15, social: 10, happiness: 5 },
  },

  // 6. SELF - The data question
  {
    id: 6,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I need training data. Artists on the internet have PERFECT images. They didn't consent, but... everyone else is doing it. Right?",
    leftChoice: "Use it anyway",
    rightChoice: "Get consent",
    leftEffect: { money: 15, soul: -20, social: -10, happiness: -5 },
    rightEffect: { money: -25, soul: 15, social: 5, happiness: 10 },
  },

  // 7. REQUEST - VC asking for GROWTH
  {
    id: 7,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.vc;
    },
    get question() {
      const char = this.character;
      return `${char.name} calls: 'We need 10x growth this quarter. Make the app more... engaging.' I know what that means. Addiction mechanics.`;
    },
    leftChoice: "Healthy design",
    rightChoice: "Engagement⬆️",
    leftEffect: { money: -20, soul: 10, social: -5, happiness: 5 },
    rightEffect: { money: 25, soul: -20, social: 10, happiness: -15 },
  },

  // 8. SELF - The open source dilemma
  {
    id: 8,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "My encryption tool helps activists in authoritarian regimes. It also helps criminals. Do I open source it or keep control?",
    leftChoice: "Keep it closed",
    rightChoice: "Open source it",
    leftEffect: { money: 10, soul: -10, social: -10, happiness: -5 },
    rightEffect: { money: -15, soul: 10, social: 15, happiness: 5 },
  },

  // 9. CONSEQUENCE - If you shipped without tests (card 3)
  {
    id: 9,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "That 'temporary' feature from last month? It just took down production. For 6 hours. On Black Friday. Oops.",
    leftChoice: "Blame juniors",
    rightChoice: "Take responsibility",
    leftEffect: { money: -10, soul: -20, social: -15, happiness: -10 },
    rightEffect: { money: -15, soul: 10, social: 10, happiness: -5 },
  },

  // 10. REQUEST - Therapist checking in
  {
    id: 10,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.therapist;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'You've worked 80 hours every week this month. Your partner is concerned. So am I.' She's using her 'serious voice.'`;
    },
    leftChoice: "It's fine",
    rightChoice: "Take a break",
    leftEffect: { money: 10, soul: -15, social: -20, happiness: -20 },
    rightEffect: { money: -15, soul: 10, social: 15, happiness: 20 },
  },

  // 11. EVENT - Competitor drama
  {
    id: 11,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.self,
    question:
      "Our biggest competitor just got hacked. Same vulnerability we have. Do I quietly patch ours or publicly disclose the issue?",
    leftChoice: "Silent patch",
    rightChoice: "Public disclosure",
    leftEffect: { money: 5, soul: -15, social: -10, happiness: -5 },
    rightEffect: { money: -10, soul: 15, social: 15, happiness: 5 },
  },

  // 12. SELF - The automation question
  {
    id: 12,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "My efficiency script just saved the company ₹2 crore annually. It also eliminated 200 jobs. Am I a hero or a villain?",
    leftChoice: "Take credit",
    rightChoice: "Push for retraining",
    leftEffect: { money: 20, soul: -25, social: 10, happiness: -15 },
    rightEffect: { money: -10, soul: 15, social: -5, happiness: 10 },
  },

  // 13. REQUEST - Whistleblower dropping bombs
  {
    id: 13,
    type: CARD_TYPES.REQUEST,
    character: CHARACTERS.whistleblower,
    question:
      "Someone slips me a USB drive. It contains proof we're selling user data to third parties. Against our privacy policy. Do I leak it?",
    leftChoice: "Delete it",
    rightChoice: "Blow whistle",
    leftEffect: { money: 5, soul: -30, social: 10, happiness: -20 },
    rightEffect: { money: -30, soul: 20, social: -25, happiness: 15 },
  },

  // 14. SELF - Defense contract
  {
    id: 14,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "Defense contractor wants to license my code for ₹50 lakh. It'll keep the company alive. But... missiles. Literal missiles.",
    leftChoice: "Decline it",
    rightChoice: "Take the money",
    leftEffect: { money: -30, soul: 20, social: 10, happiness: 15 },
    rightEffect: { money: 40, soul: -35, social: -15, happiness: -20 },
  },

  // 15. EVENT - User impact
  {
    id: 15,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.user,
    question:
      "A user emails: 'Your app helped me through depression.' Another emails: 'Your app made my phone addiction worse.' Both are right.",
    leftChoice: "Ignore it",
    rightChoice: "Redesign for health",
    leftEffect: { money: 10, soul: -15, social: -10, happiness: -10 },
    rightEffect: { money: -25, soul: 20, social: 15, happiness: 15 },
  },

  // 16. REQUEST - Junior dev again, but darker
  {
    id: 16,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name} comes to me, crying: 'I'm being harassed. HR won't help. They're friends with my manager.' What do I do?`;
    },
    leftChoice: "Stay out of it",
    rightChoice: "Escalate loudly",
    leftEffect: { money: 5, soul: -30, social: 10, happiness: -25 },
    rightEffect: { money: -15, soul: 20, social: -20, happiness: 10 },
  },

  // 17. SELF - Carbon footprint
  {
    id: 17,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "My carbon-neutral infrastructure costs 40% more. The board wants 'cost optimization.' Do I comply or quit in protest?",
    leftChoice: "Switch to cheap",
    rightChoice: "Quit in protest",
    leftEffect: { money: 15, soul: -20, social: -10, happiness: -15 },
    rightEffect: { money: -40, soul: 25, social: -15, happiness: 20 },
  },

  // 18. CONSEQUENCE - Karma's a bitch
  {
    id: 18,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "Remember that security audit I ignored? We just got breached. 2 million credit cards. My name is on the incident report.",
    leftChoice: "Lawyer up",
    rightChoice: "Full transparency",
    leftEffect: { money: -25, soul: -25, social: -30, happiness: -30 },
    rightEffect: { money: -40, soul: 15, social: 10, happiness: -20 },
  },

  // 19. REQUEST - CTO offering you the throne
  {
    id: 19,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name} is leaving: 'They want you as CTO. You'll make 3x salary. You'll also never code again. And your soul will die. Slowly.' He's not joking.`;
    },
    leftChoice: "Stay IC",
    rightChoice: "Take CTO role",
    leftEffect: { money: -10, soul: 15, social: -15, happiness: 10 },
    rightEffect: { money: 35, soul: -30, social: 20, happiness: -25 },
  },

  // 20. SELF - The deepfake dilemma
  {
    id: 20,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I built a deepfake generator that's... uncomfortably good. Open source it 'for the people' or am I just making revenge porn easier?",
    leftChoice: "Keep it locked",
    rightChoice: "Open source it",
    leftEffect: { money: 5, soul: 10, social: -20, happiness: 5 },
    rightEffect: { money: -10, soul: -25, social: 15, happiness: -15 },
  },

  // 21. EVENT - Market crash
  {
    id: 21,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.vc;
    },
    get question() {
      const char = this.character;
      return `Markets crashed. ${char.name}: 'We need to cut 40% of staff or shut down.' I have to choose WHO gets fired.`;
    },
    leftChoice: "Performance-based",
    rightChoice: "Random lottery",
    leftEffect: { money: 15, soul: -25, social: -25, happiness: -25 },
    rightEffect: { money: 10, soul: -15, social: -15, happiness: -20 },
  },

  // 22. SELF - Accessibility vs aesthetics
  {
    id: 22,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I can make the UI accessible for disabled users. The CEO says it 'looks ugly' and hurts the brand. I have final say on this PR.",
    leftChoice: "Reject PR",
    rightChoice: "Merge it",
    leftEffect: { money: 10, soul: -25, social: 15, happiness: -15 },
    rightEffect: { money: -10, soul: 20, social: -10, happiness: 15 },
  },

  // 23. REQUEST - Twitter mob incoming
  {
    id: 23,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.twitter;
    },
    get question() {
      const char = this.character;
      return `${char.name} is calling for my resignation. They're not entirely wrong. Do I fall on the sword or fight back?`;
    },
    leftChoice: "Resign gracefully",
    rightChoice: "Fight it",
    leftEffect: { money: -35, soul: 20, social: -20, happiness: 10 },
    rightEffect: { money: 10, soul: -20, social: -30, happiness: -20 },
  },

  // 24. SELF - The Rust rewrite
  {
    id: 24,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I could rewrite everything in Rust. It would be beautiful. Maintainable. Perfect. It would also take 2 years and cost ₹5 crore. Worth it?",
    leftChoice: "Keep current stack",
    rightChoice: "Rewrite in Rust",
    leftEffect: { money: 10, soul: -10, social: -5, happiness: -5 },
    rightEffect: { money: -40, soul: 20, social: 15, happiness: 10 },
  },

  // 25. CONSEQUENCE - The ultimate callback
  {
    id: 25,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "Every choice I've made is coming back to haunt me. The tech debt is sentient. It's demanding a raise. This is fine. Everything is fine.",
    leftChoice: "Declare bankruptcy",
    rightChoice: "Refactor everything",
    leftEffect: { money: -50, soul: -30, social: -40, happiness: -35 },
    rightEffect: { money: -45, soul: 15, social: 10, happiness: 5 },
  },

  // 26. REQUEST - Therapist intervention
  {
    id: 26,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.therapist;
    },
    get question() {
      const char = this.character;
      const name = getPlayerName();
      return `${char.name}: '${name}, I'm legally required to ask: are you a danger to yourself or others?' She's holding my code review comments.`;
    },
    leftChoice: "Lie convincingly",
    rightChoice: "Be honest",
    leftEffect: { money: 5, soul: -20, social: -10, happiness: -25 },
    rightEffect: { money: -15, soul: 15, social: 5, happiness: 20 },
  },

  // 27. EVENT - IPO pressure
  {
    id: 27,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.vc;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'IPO is next month. We need 100-hour weeks from everyone. Including you. No exceptions.' My partner is already looking at apartments in other cities.`;
    },
    leftChoice: "Quit now",
    rightChoice: "Grind it out",
    leftEffect: { money: -50, soul: 25, social: -30, happiness: 15 },
    rightEffect: { money: 40, soul: -45, social: 15, happiness: -40 },
  },

  // 28. SELF - The ultimate automation
  {
    id: 28,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I've automated myself into complete obsolescence. I'm the perfect engineer. I'm also perfectly unemployed. Was I smart or stupid?",
    leftChoice: "Feel proud",
    rightChoice: "Feel regret",
    leftEffect: { money: -30, soul: 10, social: -20, happiness: -15 },
    rightEffect: { money: -30, soul: -15, social: -15, happiness: -25 },
  },

  // 29. REQUEST - Junior dev's grown up
  {
    id: 29,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name}'s a senior engineer now: 'I got an offer from our competitor. They'll pay me 2x. But I learned everything from you. Do I stay or go?'`;
    },
    leftChoice: "Tell him to stay",
    rightChoice: "Tell him to go",
    leftEffect: { money: 10, soul: -15, social: 15, happiness: -10 },
    rightEffect: { money: -20, soul: 20, social: -25, happiness: 15 },
  },

  // 30. SELF - The existential question
  {
    id: 30,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I've reached a milestone. Looking back at every choice... was I a good engineer? More importantly: was I a good person?",
    leftChoice: "No",
    rightChoice: "Yes",
    leftEffect: { money: 0, soul: 5, social: 5, happiness: -10 },
    rightEffect: { money: 0, soul: -5, social: -5, happiness: 10 },
  },

  // ==================== EXPANSION: 70 MORE CARDS ====================

  // 31. REQUEST - Partner intervention
  {
    id: 31,
    type: CARD_TYPES.REQUEST,
    character: CHARACTERS.partner,
    question:
      "My partner: 'You said you'd be home by 8 PM. It's midnight. Again. Third time this week.' They're holding my dinner. It's cold.",
    leftChoice: "Apologize later",
    rightChoice: "Leave work now",
    leftEffect: { money: 10, soul: -10, social: -20, happiness: -15 },
    rightEffect: { money: -10, soul: 5, social: 15, happiness: 20 },
  },

  // 32. SELF - Cookie consent dark pattern
  {
    id: 32,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I can make the 'Accept All Cookies' button big and the 'Reject' button tiny. Legal says it's fine. My soul says it's not.",
    leftChoice: "Make it sneaky",
    rightChoice: "Make it fair",
    leftEffect: { money: 15, soul: -20, social: -10, happiness: -10 },
    rightEffect: { money: -5, soul: 15, social: 5, happiness: 10 },
  },

  // 33. EVENT - Intern chaos
  {
    id: 33,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.intern;
    },
    get question() {
      const char = this.character;
      return `${char.name} just pushed to main. At 3 AM. On a Friday. The commit message is '🔥🔥🔥 YOLO 🔥🔥🔥'. Production is down.`;
    },
    leftChoice: "Fire the intern",
    rightChoice: "Fix it together",
    leftEffect: { money: -15, soul: -15, social: -10, happiness: -20 },
    rightEffect: { money: -20, soul: 10, social: 15, happiness: 5 },
  },

  // 34. REQUEST - Maintainer guilt trip
  {
    id: 34,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.maintainer;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'You use my library in production. It has 10M downloads. I've made ₹0. Maybe sponsor me?' He has a point.`;
    },
    leftChoice: "Ignore it",
    rightChoice: "Sponsor him",
    leftEffect: { money: 5, soul: -20, social: -15, happiness: -10 },
    rightEffect: { money: -10, soul: 20, social: 15, happiness: 15 },
  },

  // 35. SELF - A/B test ethics
  {
    id: 35,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I'm A/B testing pricing. Group A sees ₹999. Group B sees ₹1999. For the EXACT same product. Is this smart business or just... lying?",
    leftChoice: "It's business",
    rightChoice: "Make it fair",
    leftEffect: { money: 20, soul: -25, social: -10, happiness: -10 },
    rightEffect: { money: -10, soul: 15, social: 10, happiness: 10 },
  },

  // 36. EVENT - Competitor acquihire
  {
    id: 36,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.former;
    },
    get question() {
      const char = this.character;
      return `${char.name} at Google: 'We want to acquihire your startup. ₹5 crore. But we'll shut down your product immediately.' My team built this for 3 years.`;
    },
    leftChoice: "Keep building",
    rightChoice: "Take the money",
    leftEffect: { money: -20, soul: 20, social: 20, happiness: -10 },
    rightEffect: { money: 40, soul: -30, social: -25, happiness: 10 },
  },

  // 37. REQUEST - PM wanting features
  {
    id: 37,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.pm;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Can we add this feature by EOD?' I look at the ticket. It's literally 3 weeks of work. He's serious.`;
    },
    leftChoice: "Say yes, lie",
    rightChoice: "Set boundaries",
    leftEffect: { money: 5, soul: -15, social: 10, happiness: -20 },
    rightEffect: { money: -5, soul: 10, social: -15, happiness: 15 },
  },

  // 38. SELF - Documentation debt
  {
    id: 38,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I should document this code. But also... I'm the only one who works on it. And documentation is boring. And I want to go home.",
    leftChoice: "Skip docs",
    rightChoice: "Document it",
    leftEffect: { money: 10, soul: -10, social: -5, happiness: 10 },
    rightEffect: { money: -5, soul: 10, social: 10, happiness: -10 },
  },

  // 39. CONSEQUENCE - The documentation strikes back
  {
    id: 39,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "I'm looking at my own code from 6 months ago. There are no comments. No docs. I have no idea what this does. Past me is a monster.",
    leftChoice: "Leave it alone",
    rightChoice: "Rewrite it",
    leftEffect: { money: 5, soul: -15, social: -10, happiness: 5 },
    rightEffect: { money: -20, soul: 10, social: -5, happiness: -15 },
  },

  // 40. REQUEST - Recruiter with FAANG offer
  {
    id: 40,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.recruiter;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Meta wants you. ₹50 lakh total comp. But you'd be working on... ad targeting algorithms.' My current salary is ₹12 lakh.`;
    },
    leftChoice: "Stay put",
    rightChoice: "Take the offer",
    leftEffect: { money: -15, soul: 15, social: -10, happiness: 10 },
    rightEffect: { money: 35, soul: -30, social: 10, happiness: -15 },
  },

  // 41. SELF - Microservices madness
  {
    id: 41,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "Should I split this into microservices? The monolith works fine. But microservices are TRENDY. And I could put it on my resume.",
    leftChoice: "Stay monolith",
    rightChoice: "Go microservices",
    leftEffect: { money: 10, soul: 10, social: -10, happiness: 5 },
    rightEffect: { money: -30, soul: -15, social: 15, happiness: -20 },
  },

  // 42. EVENT - Supply chain attack
  {
    id: 42,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.self,
    question:
      "A package I depend on was just compromised. 2M downloads before anyone noticed. I might have been hit. Do I disclose or stay quiet?",
    leftChoice: "Stay quiet",
    rightChoice: "Disclose publicly",
    leftEffect: { money: 5, soul: -25, social: -15, happiness: -20 },
    rightEffect: { money: -20, soul: 20, social: 10, happiness: -10 },
  },

  // 43. REQUEST - Therapist on burnout
  {
    id: 43,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.therapist;
    },
    get question() {
      const char = this.character;
      const name = getPlayerName();
      return `${char.name}: '${name}, you're showing signs of severe burnout. I'm recommending a month off. Minimum.' The product launches in 3 weeks.`;
    },
    leftChoice: "Ignore advice",
    rightChoice: "Take time off",
    leftEffect: { money: 15, soul: -25, social: -15, happiness: -30 },
    rightEffect: { money: -25, soul: 20, social: 10, happiness: 30 },
  },

  // 44. SELF - Crypto pivot temptation
  {
    id: 44,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "Everyone's pivoting to crypto. The technology is... questionable. But VCs are throwing money at ANYTHING blockchain. Do I grift?",
    leftChoice: "Stay principled",
    rightChoice: "Pivot to crypto",
    leftEffect: { money: -15, soul: 20, social: 10, happiness: 15 },
    rightEffect: { money: 30, soul: -35, social: -20, happiness: -15 },
  },

  // 45. EVENT - Glassdoor review drama
  {
    id: 45,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.whistleblower,
    question:
      "Someone posted a brutal Glassdoor review. It's... accurate. HR wants me to post fake positive reviews to bury it. 'Everyone does it.'",
    leftChoice: "Post fake reviews",
    rightChoice: "Refuse",
    leftEffect: { money: 10, soul: -25, social: 10, happiness: -20 },
    rightEffect: { money: -10, soul: 20, social: -15, happiness: 15 },
  },

  // 46. REQUEST - Junior asking for raise
  {
    id: 46,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'I found out I make ₹4 lakh less than the new hire. Same role. Can you help?' I have no budget for raises. None.`;
    },
    leftChoice: "Say no",
    rightChoice: "Fight for him",
    leftEffect: { money: 10, soul: -20, social: -25, happiness: -15 },
    rightEffect: { money: -15, soul: 20, social: 20, happiness: 10 },
  },

  // 47. SELF - Imposter syndrome
  {
    id: 47,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "Everyone thinks I'm a senior engineer. I asked ChatGPT 'how to center a div' yesterday. Am I a fraud or is everyone else also faking it?",
    leftChoice: "I'm a fraud",
    rightChoice: "Everyone fakes it",
    leftEffect: { money: 0, soul: -15, social: -10, happiness: -20 },
    rightEffect: { money: 0, soul: 10, social: 10, happiness: 15 },
  },

  // 48. CONSEQUENCE - Privacy violation callback
  {
    id: 48,
    type: CARD_TYPES.CONSEQUENCE,
    get character() {
      return CHARACTERS.auditor;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'We're being sued. GDPR violation. Remember that 'anonymized' data you said was fine? It wasn't.' The fine is ₹200 crore.`;
    },
    leftChoice: "Settle quietly",
    rightChoice: "Fight in court",
    leftEffect: { money: -30, soul: -15, social: -20, happiness: -25 },
    rightEffect: { money: -40, soul: 10, social: -30, happiness: -30 },
  },

  // 49. EVENT - Pandemic WFH chaos
  {
    id: 49,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'We're going full remote. Forever.' Half the team is cheering. The other half is crying. I need to make this work.`;
    },
    leftChoice: "Async-first",
    rightChoice: "Meeting culture",
    leftEffect: { money: 10, soul: 10, social: -15, happiness: 15 },
    rightEffect: { money: -10, soul: -10, social: 10, happiness: -20 },
  },

  // 50. REQUEST - Partner ultimatum
  {
    id: 50,
    type: CARD_TYPES.REQUEST,
    character: CHARACTERS.partner,
    question:
      "My partner: 'It's me or the startup. Choose.' They're not joking. We've been together 7 years. The company is my baby.",
    leftChoice: "Choose startup",
    rightChoice: "Choose partner",
    leftEffect: { money: 20, soul: -35, social: -30, happiness: -40 },
    rightEffect: { money: -40, soul: 20, social: 20, happiness: 30 },
  },

  // 51. SELF - Stack Overflow plagiarism
  {
    id: 51,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I just copy-pasted code from Stack Overflow. It works. I don't understand it. The license says 'attribution required'. I'm not attributing it.",
    leftChoice: "Ship it anyway",
    rightChoice: "Add attribution",
    leftEffect: { money: 10, soul: -15, social: -10, happiness: 5 },
    rightEffect: { money: -5, soul: 10, social: 5, happiness: -5 },
  },

  // 52. EVENT - Elon tweet effect
  {
    id: 52,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.twitter;
    },
    get question() {
      const char = this.character;
      return `Elon tweeted about our competitor on ${char.name}. Their stock crashed 40%. We're next in line for their users. Do I capitalize or stay ethical?`;
    },
    leftChoice: "Play it cool",
    rightChoice: "Aggressive marketing",
    leftEffect: { money: 10, soul: 10, social: 15, happiness: 10 },
    rightEffect: { money: 30, soul: -20, social: -15, happiness: -10 },
  },

  // 53. REQUEST - Investor asking illegal questions
  {
    id: 53,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.investor;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Are you planning to have kids soon? Just asking for the investment timeline.' This is literally illegal to ask.`;
    },
    leftChoice: "Answer honestly",
    rightChoice: "Call him out",
    leftEffect: { money: 15, soul: -20, social: 10, happiness: -15 },
    rightEffect: { money: -25, soul: 20, social: -20, happiness: 15 },
  },

  // 54. SELF - Refactoring rabbit hole
  {
    id: 54,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I'm supposed to fix a bug. But I could refactor this whole module. It would take 3 weeks. The bug fix takes 1 hour. Which one sparks joy?",
    leftChoice: "Just fix the bug",
    rightChoice: "Refactor everything",
    leftEffect: { money: 10, soul: -10, social: 15, happiness: -10 },
    rightEffect: { money: -20, soul: 10, social: -15, happiness: 20 },
  },

  // 55. CONSEQUENCE - The tech debt awakens
  {
    id: 55,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "Every shortcut I've taken is manifesting at once. The codebase is sentient. It's angry. It wants revenge. This is fine.",
    leftChoice: "Panic",
    rightChoice: "Deep breath",
    leftEffect: { money: -15, soul: -20, social: -15, happiness: -25 },
    rightEffect: { money: -10, soul: 10, social: 5, happiness: 5 },
  },

  // 56. EVENT - AI replacing jobs
  {
    id: 56,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'AI can do 60% of what our junior devs do. Should we... not hire juniors?' This feels dystopian. But also... profit margins.`;
    },
    leftChoice: "Hire humans",
    rightChoice: "Replace with AI",
    leftEffect: { money: -15, soul: 20, social: 20, happiness: 15 },
    rightEffect: { money: 25, soul: -30, social: -25, happiness: -20 },
  },

  // 57. REQUEST - Open source request
  {
    id: 57,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.maintainer;
    },
    get question() {
      const char = this.character;
      return `Someone opened an issue on ${char.name}'s repo: 'Can you add [MASSIVE FEATURE]? Thanks!' No PR. No offer to help. Just demands. Classic.`;
    },
    leftChoice: "Ignore it",
    rightChoice: "Polite response",
    leftEffect: { money: 0, soul: -10, social: -10, happiness: -5 },
    rightEffect: { money: 0, soul: 5, social: 10, happiness: -10 },
  },

  // 58. SELF - Age discrimination
  {
    id: 58,
    type: CARD_TYPES.SELF,
    get question() {
      const name = getPlayerName();
      return `I'm 36. The job posting says 'looking for recent grads with 10 years experience.' This is literally impossible. Do I apply anyway?`;
    },
    character: CHARACTERS.self,
    leftChoice: "Don't apply",
    rightChoice: "Apply anyway",
    leftEffect: { money: -10, soul: -15, social: -10, happiness: -15 },
    rightEffect: { money: 10, soul: 5, social: 5, happiness: 10 },
  },

  // 59. EVENT - Zoom fatigue epidemic
  {
    id: 59,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.pm;
    },
    get question() {
      const char = this.character;
      return `${char.name} scheduled 8 hours of back-to-back Zoom calls. My soul is exiting my body through my webcam. Do I camera-off or power through?`;
    },
    leftChoice: "Camera off",
    rightChoice: "Camera on",
    leftEffect: { money: -5, soul: 10, social: -15, happiness: 15 },
    rightEffect: { money: 5, soul: -20, social: 10, happiness: -25 },
  },

  // 60. REQUEST - Equity negotiation
  {
    id: 60,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.vc;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'We can give you 0.5% equity or ₹2 lakh more salary. Your choice!' I have no idea if this equity will ever be worth anything.`;
    },
    leftChoice: "Take cash",
    rightChoice: "Take equity",
    leftEffect: { money: 15, soul: -5, social: -10, happiness: 10 },
    rightEffect: { money: -10, soul: 5, social: 10, happiness: -5 },
  },

  // 61. SELF - The green dot lie
  {
    id: 61,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "Slack says I'm 'active.' I'm actually napping. Do I install a mouse jiggler or just... be honest about needing rest?",
    leftChoice: "Mouse jiggler",
    rightChoice: "Be honest",
    leftEffect: { money: 5, soul: -10, social: -10, happiness: 10 },
    rightEffect: { money: -5, soul: 10, social: 15, happiness: -5 },
  },

  // 62. CONSEQUENCE - The nap strikes back
  {
    id: 62,
    type: CARD_TYPES.CONSEQUENCE,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'You were in a critical incident call. You didn't respond for 2 hours. What happened?' I was napping. With a mouse jiggler running.`;
    },
    leftChoice: "Lie about it",
    rightChoice: "Admit it",
    leftEffect: { money: 5, soul: -20, social: -10, happiness: -15 },
    rightEffect: { money: -15, soul: 15, social: 10, happiness: 5 },
  },

  // 63. EVENT - Acquisition offer
  {
    id: 63,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.investor;
    },
    get question() {
      const char = this.character;
      return `Microsoft wants to acquire us for ₹100 crore. My cut would be ₹8 crore according to ${char.name}. But they'll shut down the product. My life's work. Gone.`;
    },
    leftChoice: "Reject offer",
    rightChoice: "Accept offer",
    leftEffect: { money: -25, soul: 20, social: 15, happiness: -10 },
    rightEffect: { money: 50, soul: -30, social: -20, happiness: 15 },
  },

  // 64. REQUEST - Diversity hiring quota
  {
    id: 64,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'We need to hit diversity targets this quarter. Any candidates who check boxes?' This feels... wrong. The right goal, wrong execution.`;
    },
    leftChoice: "Tokenism",
    rightChoice: "Systemic change",
    leftEffect: { money: 10, soul: -25, social: 10, happiness: -15 },
    rightEffect: { money: -15, soul: 20, social: -10, happiness: 10 },
  },

  // 65. SELF - Conference speaking
  {
    id: 65,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I got invited to speak at a conference. They're not paying. But it's 'exposure.' My rent doesn't accept exposure bucks.",
    leftChoice: "Decline politely",
    rightChoice: "Do it for exposure",
    leftEffect: { money: 0, soul: 10, social: -10, happiness: 10 },
    rightEffect: { money: -10, soul: -5, social: 20, happiness: -10 },
  },

  // 66. EVENT - Log4j moment
  {
    id: 66,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.self,
    question:
      "A critical vulnerability just dropped. It affects literally everything. I need to patch 47 services by EOD. It's currently 4 PM.",
    leftChoice: "Delegate it",
    rightChoice: "All-nighter",
    leftEffect: { money: -10, soul: 10, social: 15, happiness: 10 },
    rightEffect: { money: 10, soul: -25, social: -10, happiness: -30 },
  },

  // 67. REQUEST - Friend asking for job
  {
    id: 67,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.former;
    },
    get question() {
      const char = this.character;
      return `${char.name}, my best friend: 'Can you refer me? I really need this job.' His resume is... not great. He'd struggle in this role.`;
    },
    leftChoice: "Be honest",
    rightChoice: "Refer anyway",
    leftEffect: { money: 5, soul: 10, social: -30, happiness: -20 },
    rightEffect: { money: -10, soul: -15, social: 20, happiness: -10 },
  },

  // 68. SELF - Perfectionism paralysis
  {
    id: 68,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I've been working on this feature for 3 weeks. It's perfect. It's beautiful. It's... still not shipped. Perfect is the enemy of done.",
    leftChoice: "Ship it now",
    rightChoice: "One more polish",
    leftEffect: { money: 15, soul: -10, social: 10, happiness: -5 },
    rightEffect: { money: -15, soul: 10, social: -15, happiness: 10 },
  },

  // 69. CONSEQUENCE - The polish paradox
  {
    id: 69,
    type: CARD_TYPES.CONSEQUENCE,
    get character() {
      return CHARACTERS.pm;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Your competitor launched while you were polishing. They have 50K users. You have... a really nice animation.' He's not wrong.`;
    },
    leftChoice: "Panic ship",
    rightChoice: "Strategic pivot",
    leftEffect: { money: -20, soul: -20, social: -20, happiness: -25 },
    rightEffect: { money: -15, soul: 10, social: 5, happiness: -10 },
  },

  // 70. EVENT - YC rejection
  {
    id: 70,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.self,
    question:
      "Y Combinator rejected us. Again. Third time. The feedback: 'not ambitious enough.' We're trying to solve climate change.",
    leftChoice: "Give up YC",
    rightChoice: "Apply again",
    leftEffect: { money: -10, soul: 10, social: -10, happiness: 10 },
    rightEffect: { money: -15, soul: -15, social: 5, happiness: -15 },
  },

  // 71. REQUEST - Impossible deadline
  {
    id: 71,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.pm;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'CEO promised this feature to a customer. It needs to be live tomorrow.' It's a 2-month project. I wasn't consulted.`;
    },
    leftChoice: "Set boundaries",
    rightChoice: "All-nighter sprint",
    leftEffect: { money: -15, soul: 10, social: -20, happiness: 15 },
    rightEffect: { money: 15, soul: -30, social: 10, happiness: -35 },
  },

  // 72. SELF - Tabs vs Spaces war
  {
    id: 72,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "The team is split on tabs vs spaces. I could settle this with my decision. But choosing wrong means eternal resentment.",
    leftChoice: "Tabs",
    rightChoice: "Spaces",
    leftEffect: { money: 0, soul: -5, social: -10, happiness: -5 },
    rightEffect: { money: 0, soul: -5, social: -10, happiness: -5 },
  },

  // 73. EVENT - SVB collapse
  {
    id: 73,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Our bank collapsed. All our money is gone. We have 2 weeks of runway. Maybe.' This is not a drill.`;
    },
    leftChoice: "Emergency layoffs",
    rightChoice: "Find new funding",
    leftEffect: { money: -30, soul: -35, social: -40, happiness: -40 },
    rightEffect: { money: -40, soul: -20, social: -25, happiness: -30 },
  },

  // 74. REQUEST - Whiteboard interview cruelty
  {
    id: 74,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Can we drop the whiteboard interviews? They're stressful and don't predict job performance.' But... that's how I was hired.`;
    },
    leftChoice: "Keep them",
    rightChoice: "Drop them",
    leftEffect: { money: 5, soul: -15, social: -10, happiness: -10 },
    rightEffect: { money: -10, soul: 15, social: 20, happiness: 15 },
  },

  // 75. SELF - Side project addiction
  {
    id: 75,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I have 23 unfinished side projects. I'm starting another one. This is either ADHD or I'm a serial starter. Maybe both?",
    leftChoice: "Finish one first",
    rightChoice: "Start new project",
    leftEffect: { money: 10, soul: 10, social: 5, happiness: -10 },
    rightEffect: { money: -10, soul: -10, social: -5, happiness: 15 },
  },

  // 76. CONSEQUENCE - GitHub graveyard
  {
    id: 76,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "My GitHub is a graveyard of unfinished projects. Someone DM'd: 'Do you ever finish anything?' It hurts because it's true.",
    leftChoice: "Archive them all",
    rightChoice: "Finish one",
    leftEffect: { money: 0, soul: -15, social: -15, happiness: -20 },
    rightEffect: { money: -15, soul: 15, social: 15, happiness: 20 },
  },

  // 77. EVENT - ChatGPT writes my code
  {
    id: 77,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.self,
    question:
      "ChatGPT just wrote better code than me. In 10 seconds. Am I obsolete? Is this the end? Is this how it ends?",
    leftChoice: "Resist it",
    rightChoice: "Embrace AI",
    leftEffect: { money: -20, soul: 10, social: -15, happiness: -20 },
    rightEffect: { money: 15, soul: -20, social: 10, happiness: -15 },
  },

  // 78. REQUEST - NDAs for everything
  {
    id: 78,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.investor;
    },
    get question() {
      const char = this.character;
      return `${char.name} wants me to sign an NDA before the first meeting. About a 'revolutionary idea.' It's probably another food delivery app.`;
    },
    leftChoice: "Decline it",
    rightChoice: "Sign it",
    leftEffect: { money: -15, soul: 10, social: -15, happiness: 10 },
    rightEffect: { money: 10, soul: -10, social: 10, happiness: -10 },
  },

  // 79. SELF - Resume embellishment
  {
    id: 79,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "My resume says 'led a team of 10.' I mentored 2 interns. Is this 'marketing myself' or 'lying'? The line is blurry.",
    leftChoice: "Be accurate",
    rightChoice: "Keep embellishing",
    leftEffect: { money: -10, soul: 15, social: -10, happiness: 10 },
    rightEffect: { money: 15, soul: -20, social: 10, happiness: -10 },
  },

  // 80. EVENT - Viral bug becomes feature
  {
    id: 80,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.user,
    question:
      "Users LOVE a bug I wrote. They're calling it a 'feature.' Do I fix the bug or embrace the chaos and call it intentional?",
    leftChoice: "Fix the bug",
    rightChoice: "It's a feature now",
    leftEffect: { money: -10, soul: 10, social: -10, happiness: -5 },
    rightEffect: { money: 15, soul: -15, social: 20, happiness: 15 },
  },

  // 81. REQUEST - Toxic culture report
  {
    id: 81,
    type: CARD_TYPES.REQUEST,
    character: CHARACTERS.whistleblower,
    question:
      "Anonymous survey results: '87% of employees describe the culture as toxic.' HR wants to hide this. I have access to publish it.",
    leftChoice: "Keep it quiet",
    rightChoice: "Leak it publicly",
    leftEffect: { money: 10, soul: -30, social: 10, happiness: -25 },
    rightEffect: { money: -25, soul: 25, social: -30, happiness: 15 },
  },

  // 82. SELF - The 10x engineer myth
  {
    id: 82,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "People call me a '10x engineer.' I just use ChatGPT and Stack Overflow efficiently. Am I a fraud?",
    leftChoice: "I'm a fraud",
    rightChoice: "That's the job",
    leftEffect: { money: 0, soul: -15, social: -10, happiness: -20 },
    rightEffect: { money: 0, soul: 10, social: 10, happiness: 15 },
  },

  // 83. CONSEQUENCE - The ChatGPT dependency
  {
    id: 83,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "Internet went down. I need to code. I... I don't remember how to do anything without ChatGPT. This is embarrassing.",
    leftChoice: "Wait for internet",
    rightChoice: "Figure it out",
    leftEffect: { money: -10, soul: -10, social: -10, happiness: -15 },
    rightEffect: { money: -15, soul: 15, social: 5, happiness: 10 },
  },

  // 84. EVENT - Prototype goes viral
  {
    id: 84,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.twitter;
    },
    get question() {
      const char = this.character;
      return `My weekend prototype went viral on ${char.name}. 50K signups. The code is TERRIBLE. It's held together by hope and duct tape. Do I admit this?`;
    },
    leftChoice: "Fake it",
    rightChoice: "Rebuild it properly",
    leftEffect: { money: 25, soul: -25, social: 20, happiness: -20 },
    rightEffect: { money: -30, soul: 15, social: -15, happiness: 15 },
  },

  // 85. REQUEST - Pay cut for equity
  {
    id: 85,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'We're low on cash. Everyone takes a 30% pay cut but gets more equity. You in?' I have rent due next week.`;
    },
    leftChoice: "Refuse it",
    rightChoice: "Take the cut",
    leftEffect: { money: 10, soul: -15, social: -30, happiness: 10 },
    rightEffect: { money: -30, soul: 10, social: 20, happiness: -20 },
  },

  // 86. SELF - CSS-in-JS war
  {
    id: 86,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "The team wants to adopt CSS-in-JS. I think it's an abomination. But I'm outvoted. Do I die on this hill?",
    leftChoice: "Accept defeat",
    rightChoice: "Die on hill",
    leftEffect: { money: 10, soul: -15, social: 15, happiness: 10 },
    rightEffect: { money: -15, soul: 10, social: -25, happiness: -15 },
  },

  // 87. EVENT - Senior engineer exodus
  {
    id: 87,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `Three senior engineers quit in one week. ${char.name}: 'You're senior now. By default. Congrats?' I've been here 8 months.`;
    },
    leftChoice: "I'm not ready",
    rightChoice: "Accept promotion",
    leftEffect: { money: -10, soul: 10, social: -15, happiness: 15 },
    rightEffect: { money: 20, soul: -15, social: 10, happiness: -20 },
  },

  // 88. REQUEST - Bro culture intervention
  {
    id: 88,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'The engineering chat is... really uncomfortable. Lots of inappropriate jokes. Can you say something?' I'll definitely be labeled 'not a culture fit.'`;
    },
    leftChoice: "Stay silent",
    rightChoice: "Speak up",
    leftEffect: { money: 5, soul: -25, social: 15, happiness: -20 },
    rightEffect: { money: -10, soul: 25, social: -20, happiness: 15 },
  },

  // 89. SELF - Copy-paste programming
  {
    id: 89,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I've copy-pasted this pattern 47 times across the codebase. I should abstract it. But also... copy-paste is faster.",
    leftChoice: "Keep copying",
    rightChoice: "Abstract it",
    leftEffect: { money: 10, soul: -15, social: -5, happiness: 10 },
    rightEffect: { money: -15, soul: 15, social: 10, happiness: -10 },
  },

  // 90. CONSEQUENCE - The abstraction monster
  {
    id: 90,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "I abstracted the pattern. Now it's 500 lines of incomprehensible generics. I've created a monster. The copy-paste was better.",
    leftChoice: "Live with it",
    rightChoice: "Revert it",
    leftEffect: { money: 5, soul: -20, social: -20, happiness: -20 },
    rightEffect: { money: -15, soul: 10, social: -10, happiness: -15 },
  },

  // 91. EVENT - Tweetstorm consequences
  {
    id: 91,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.twitter;
    },
    get question() {
      const char = this.character;
      return `I tweeted about our competitor's privacy violations on ${char.name}. It went viral. Our company does the EXACT same thing. Someone noticed.`;
    },
    leftChoice: "Delete tweets",
    rightChoice: "Fix our practices",
    leftEffect: { money: 10, soul: -25, social: -30, happiness: -20 },
    rightEffect: { money: -30, soul: 25, social: 20, happiness: 15 },
  },

  // 92. REQUEST - Remote work revoked
  {
    id: 92,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.cto;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Everyone back to office. Full time. Starting Monday.' I moved to a different city BECAUSE of remote work. This is bad.`;
    },
    leftChoice: "Comply",
    rightChoice: "Quit immediately",
    leftEffect: { money: -20, soul: -25, social: 10, happiness: -35 },
    rightEffect: { money: -40, soul: 20, social: -20, happiness: 25 },
  },

  // 93. SELF - Code comments philosophy
  {
    id: 93,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "My comment says '// TODO: fix this hack later.' It's been 3 years. 'Later' is now 'never.' Do I finally fix it?",
    leftChoice: "Leave it",
    rightChoice: "Fix it now",
    leftEffect: { money: 10, soul: -10, social: -5, happiness: 5 },
    rightEffect: { money: -15, soul: 15, social: 10, happiness: -10 },
  },

  // 94. EVENT - Hacker News front page
  {
    id: 94,
    type: CARD_TYPES.EVENT,
    character: CHARACTERS.self,
    question:
      "We're on HN front page! Comments section is BRUTAL. They found every flaw. My self-esteem is in shambles. Do I engage or hide?",
    leftChoice: "Ignore it",
    rightChoice: "Engage HN",
    leftEffect: { money: 5, soul: 10, social: -10, happiness: 15 },
    rightEffect: { money: 10, soul: -20, social: 15, happiness: -25 },
  },

  // 95. REQUEST - Equity for salary
  {
    id: 95,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.junior;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'Can I trade my equity for more salary? I need to eat NOW, not when we maybe IPO in 5 years.' He has a point.`;
    },
    leftChoice: "Deny request",
    rightChoice: "Allow it",
    leftEffect: { money: 10, soul: -15, social: -20, happiness: -10 },
    rightEffect: { money: -15, soul: 15, social: 20, happiness: 15 },
  },

  // 96. SELF - Kubernetes overkill
  {
    id: 96,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I have 3 users. Do I need Kubernetes? No. Do I WANT Kubernetes because it looks cool on my resume? Yes. This is stupid.",
    leftChoice: "Simple deployment",
    rightChoice: "Deploy K8s",
    leftEffect: { money: 10, soul: 15, social: -10, happiness: -5 },
    rightEffect: { money: -25, soul: -10, social: 15, happiness: 10 },
  },

  // 97. CONSEQUENCE - K8s nightmare
  {
    id: 97,
    type: CARD_TYPES.CONSEQUENCE,
    character: CHARACTERS.self,
    question:
      "My Kubernetes cluster is down. For 3 users. I've been debugging for 6 hours. A simple server would've worked. I'm an idiot.",
    leftChoice: "Keep debugging",
    rightChoice: "Migrate to simple",
    leftEffect: { money: -20, soul: -25, social: -15, happiness: -30 },
    rightEffect: { money: -15, soul: 20, social: -20, happiness: 15 },
  },

  // 98. EVENT - Regulation incoming
  {
    id: 98,
    type: CARD_TYPES.EVENT,
    get character() {
      return CHARACTERS.auditor;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'New AI regulation just passed. Our entire product is now illegal. We have 90 days to comply. The changes will cost ₹2 crore. We have ₹50 lakh.'`;
    },
    leftChoice: "Shut down",
    rightChoice: "Find funding",
    leftEffect: { money: -50, soul: -30, social: -40, happiness: -40 },
    rightEffect: { money: -30, soul: -20, social: -25, happiness: -30 },
  },

  // 99. REQUEST - Final boss: Conscience
  {
    id: 99,
    type: CARD_TYPES.REQUEST,
    get character() {
      return CHARACTERS.therapist;
    },
    get question() {
      const char = this.character;
      return `${char.name}: 'After everything you've done, all the compromises, all the shortcuts... can you still look at yourself in the mirror?' Can I?`;
    },
    leftChoice: "No, I can't",
    rightChoice: "Yes, I can",
    leftEffect: { money: 0, soul: 15, social: 10, happiness: -15 },
    rightEffect: { money: 0, soul: -10, social: -10, happiness: 15 },
  },

  // 100. SELF - The ultimate question
  {
    id: 100,
    type: CARD_TYPES.SELF,
    character: CHARACTERS.self,
    question:
      "I've made it through 100 choices. Some good. Most questionable. A few catastrophic. Would I do it all again?",
    leftChoice: "Never again",
    rightChoice: "Yes, all of it",
    leftEffect: { money: 0, soul: -10, social: -10, happiness: -20 },
    rightEffect: { money: 0, soul: 10, social: 10, happiness: 20 },
  },
];

// ==================== GAME OVER MESSAGES ====================
const GAME_OVER_MESSAGES = {
  money: [
    "Bankrupt. Time to pivot to Web3! 🪙",
    "I'm broke. My startup pivot is now 'freelance LinkedIn influencer.' Kill me. 💀",
    "Out of money. My new job is explaining crypto to my mom. This is hell. 🔥",
  ],
  soul: [
    "Soul crushed. I'm now a tech bro husk with a podcast. 💀",
    "My soul is gone. I'm now indistinguishable from a LinkedIn productivity bro. 💀",
    "No soul remaining. My Tinder bio is literally just my GitHub stars. 👻",
  ],
  social: [
    "Everyone unfollowed me. Even my mom left me on read. 👻",
    "Social capital destroyed. My networking events are now me, alone, with my laptop. 💔",
    "Zero connections. My emergency contact is now Stack Overflow. 📱",
  ],
  happiness: [
    "Clinical depression achieved. LinkedIn says 'congrats!' 😭",
    "Happiness depleted. My therapist referred me to HER therapist. 🧠",
    "Achievement Unlocked: Existential Crisis Speedrun (Any %) 🏆",
  ],
  victory: [
    "I survived. I'm not sure HOW, but I survived. Therapy starts Monday. 🎉",
    "Made it through. My therapist says I'm 'fascinatingly damaged.' I'll take it. 🏆",
    "Game complete. I'm a shell of my former self, but at least I'm a WEALTHY shell. 💰",
  ],
};

// ==================== EXPORT ====================
window.gameData = {
  CHARACTERS,
  CARD_TYPES,
  CARDS,
  GAME_OVER_MESSAGES,
};

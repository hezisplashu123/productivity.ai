const fs = require('fs');

const taggedData = {
  "friendship": {
    "icebreakers": [
      {
        "text": "What's one specific thing — a word, an order, a habit — someone could do on a first date that's an instant, harmless dealbreaker for you?",
        "mechanics": ["specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's a \"rule\" you secretly hold friends to that you've never actually said out loud?",
        "mechanics": ["specific_instance", "vulnerability"],
        "tone": "playful"
      },
      {
        "text": "If you had to start a completely fake rumor and get everyone in your hometown to believe it, what rumor are you starting?",
        "mechanics": ["escapist_hypothetical", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "You're getting robbed on the street, but you suddenly realize you went to high school with the robber. How does that conversation go?",
        "mechanics": ["specific_instance", "escapist_hypothetical", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "If someone handed you the aux cord at a party right now, what song are you playing?",
        "mechanics": ["specific_instance"],
        "tone": "playful"
      },
      {
        "text": "What's the most ridiculous thing you've done just to get someone you had a crush on to notice you?",
        "mechanics": ["specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's a really popular movie or show that you just don't like?",
        "mechanics": ["specific_instance"],
        "tone": "playful"
      }
    ],
    "mostLikely": [
      {
        "text": "Who is most likely to defend their partner's terrible behavior just because they're too scared to be single?",
        "mechanics": ["social_ranking"],
        "tone": "playful"
      },
      {
        "text": "Who would fall for a pyramid scheme just because the person pitching it gave them a few compliments?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "Who is most likely to get into a screaming match with a stranger over a parking spot?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "Who is most likely to fake their own death just to avoid replying to a group chat?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "Who gives the most confident advice that would absolutely ruin your life if you actually followed it?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "Who is the biggest sore loser the second they get caught cheating at a game?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "Who is most likely to accidentally like their ex's photo from three years ago at 2 AM?",
        "mechanics": ["social_ranking", "specific_instance", "humor_forward"],
        "tone": "playful"
      }
    ],
    "whatIfs": [
      {
        "text": "You find a briefcase with $100,000, but keeping it means your best friend gets fired from their job. Are you taking the money?",
        "mechanics": ["real_stakes", "forced_choice"],
        "tone": "playful"
      },
      {
        "text": "You have to make one phone call from jail to get bailed out. Which friend are you calling, and how does that call go?",
        "mechanics": ["real_stakes", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "You have to permanently swap lives with a friend tomorrow. Who are you picking, and what's the first thing you change about their life?",
        "mechanics": ["escapist_hypothetical", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "Someone offers you a million dollars, but they get to project your entire search history onto a billboard. Are you taking the deal?",
        "mechanics": ["real_stakes", "forced_choice"],
        "tone": "chaotic"
      },
      {
        "text": "You're forced to live with the last person you texted for the rest of your life. How long until one of you snaps?",
        "mechanics": ["escapist_hypothetical", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "If we were all stranded on a deserted island together, who would naturally become the leader, and who would we sacrifice first?",
        "mechanics": ["social_ranking", "escapist_hypothetical"],
        "tone": "chaotic"
      },
      {
        "text": "If you could rewind and erase one conversation from the last year, which one are you erasing?",
        "mechanics": ["specific_instance", "vulnerability"],
        "tone": "heartfelt"
      }
    ],
    "nostalgia": [
      {
        "text": "What's a memory with a friend that still makes you laugh out loud, even alone?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "heartfelt"
      },
      {
        "text": "What was the wildest night out you've ever had where almost nothing went according to plan?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "chaotic"
      },
      {
        "text": "Which inside joke in your friend group has gone on for way too long but is still hilarious?",
        "mechanics": ["nostalgia_recall"],
        "tone": "playful"
      },
      {
        "text": "Looking back, what's a phase your friend group went through that makes zero sense now?",
        "mechanics": ["nostalgia_recall", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's a friendship from your past that faded away, but you still look back on fondly?",
        "mechanics": ["nostalgia_recall", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's the funniest piece of drama that happened in your high school or college friend group?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "chaotic"
      },
      {
        "text": "What was a seemingly boring, regular day with your friends that ended up being incredibly memorable?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "heartfelt"
      }
    ],
    "confessions": [
      {
        "text": "Whose life do you casually keep tabs on just because it makes you feel better about your own?",
        "mechanics": ["low_risk_confession", "vulnerability"],
        "tone": "playful"
      },
      {
        "text": "What's a wildly expensive purchase you made that you instantly regretted but pretended to love?",
        "mechanics": ["low_risk_confession", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "What's the most ridiculous, petty lie you've ever told just to get out of hanging out with someone?",
        "mechanics": ["low_risk_confession", "specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's the pettiest revenge you've ever taken on someone without them ever finding out?",
        "mechanics": ["low_risk_confession", "specific_instance", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "What's a relationship or friendship you stayed in way longer than you should have, just because it was comfortable?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "heartfelt"
      },
      {
        "text": "What's the most ridiculous, minor reason you've ever suddenly stopped talking to someone?",
        "mechanics": ["low_risk_confession", "specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's a secret you know about someone else that you genuinely wish you didn't know?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "heartfelt"
      }
    ],
    "deepTalk": [
      {
        "text": "What's a belief you held strongly a few years ago that you've quietly abandoned?",
        "mechanics": ["vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "Do you think you're actually a good friend, or do you just know how to say what people want to hear — or both?",
        "mechanics": ["forced_choice", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "When was the last time you felt incredibly proud of yourself for something nobody else noticed?",
        "mechanics": ["exact_moment", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a goal or dream you have right now that you're almost too scared to talk about?",
        "mechanics": ["vulnerability"],
        "tone": "vulnerable"
      },
      {
        "text": "If everyone you ever dated sat down together, what's the one complaint they'd all agree on?",
        "mechanics": ["social_ranking", "humor_forward", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a boundary you've set recently that's made a real difference for you?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "heartfelt"
      },
      {
        "text": "What's the most valuable lesson a past friendship or relationship has taught you about what you actually need?",
        "mechanics": ["vulnerability"],
        "tone": "heartfelt"
      }
    ]
  },
  "relationship": {
    "warmUp": [
      {
        "text": "What's a weird, highly specific habit of mine that you secretly love?",
        "mechanics": ["direct_address", "specific_instance"],
        "tone": "wholesome"
      },
      {
        "text": "If we could teleport to any restaurant right now, where are we eating?",
        "mechanics": ["escapist_hypothetical", "direct_address"],
        "tone": "playful"
      },
      {
        "text": "What's an outfit of mine that you love seeing me in?",
        "mechanics": ["direct_address", "specific_instance"],
        "tone": "wholesome"
      },
      {
        "text": "What's something I do innocently that you find really attractive?",
        "mechanics": ["direct_address", "specific_instance"],
        "tone": "wholesome"
      },
      {
        "text": "If you had to describe my 'vibe' to a stranger in three words, what are they?",
        "mechanics": ["direct_address", "forced_choice"],
        "tone": "playful"
      },
      {
        "text": "What's the most attractive thing I wear to bed?",
        "mechanics": ["direct_address", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "What's a small, everyday thing I do that makes you smile?",
        "mechanics": ["direct_address"],
        "tone": "wholesome"
      }
    ],
    "spicy": [
      {
        "text": "What was the exact moment you first felt physical tension between us?",
        "mechanics": ["exact_moment", "direct_address"],
        "tone": "spicy"
      },
      {
        "text": "What's a non-physical thing I do that turns you on?",
        "mechanics": ["direct_address", "specific_instance"],
        "tone": "spicy"
      },
      {
        "text": "Where's your favorite place to be touched or kissed?",
        "mechanics": ["direct_address"],
        "tone": "spicy"
      },
      {
        "text": "What's a fantasy or scenario you've thought about us but never brought up?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "spicy"
      },
      {
        "text": "What's the most inappropriately timed moment you've been turned on by me?",
        "mechanics": ["specific_instance", "direct_address", "humor_forward"],
        "tone": "spicy"
      },
      {
        "text": "What was your favorite physical moment from our first month together?",
        "mechanics": ["exact_moment", "direct_address"],
        "tone": "spicy"
      },
      {
        "text": "What's a boundary in the bedroom you've always been curious about pushing?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "spicy"
      }
    ],
    "whatIfs": [
      {
        "text": "If we had to fake our deaths and move to another country, what would our new jobs be?",
        "mechanics": ["escapist_hypothetical", "direct_address"],
        "tone": "playful"
      },
      {
        "text": "If we were dropped into a horror movie, how far do we make it, and who dies first?",
        "mechanics": ["social_ranking", "escapist_hypothetical", "direct_address"],
        "tone": "chaotic"
      },
      {
        "text": "If we had to drop everything and open a business together tomorrow, what would it be?",
        "mechanics": ["escapist_hypothetical", "direct_address"],
        "tone": "playful"
      },
      {
        "text": "If you woke up tomorrow in my body, what's the very first thing you'd do?",
        "mechanics": ["escapist_hypothetical", "direct_address", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "If we could erase one argument from our history, which one goes?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "If we had to survive a zombie apocalypse, what would be our biggest downfall as a team?",
        "mechanics": ["escapist_hypothetical", "direct_address", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "If we were forced to go on reality TV, which show would destroy our relationship the fastest?",
        "mechanics": ["escapist_hypothetical", "direct_address", "humor_forward"],
        "tone": "chaotic"
      }
    ],
    "nostalgia": [
      {
        "text": "What was your exact first thought the very first time you saw me?",
        "mechanics": ["exact_moment", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a small, random moment from early in our relationship that you still think about?",
        "mechanics": ["nostalgia_recall", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What was the most nerve-wracking part of our first few dates for you?",
        "mechanics": ["nostalgia_recall", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "At what exact moment did you realize you were falling in love with me?",
        "mechanics": ["exact_moment", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a photo of us that immediately brings back a wave of emotion?",
        "mechanics": ["nostalgia_recall", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What's the exact moment you realized I was genuinely interested in you?",
        "mechanics": ["exact_moment", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What's an assumption you made about me on our first date that turned out completely wrong?",
        "mechanics": ["nostalgia_recall", "direct_address", "humor_forward"],
        "tone": "playful"
      }
    ],
    "connection": [
      {
        "text": "What's one very specific way you think we balance each other out?",
        "mechanics": ["direct_address", "specific_instance"],
        "tone": "heartfelt"
      },
      {
        "text": "What's something I do to show love that you think I don't realize I'm doing?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "When do you feel the most secure and safe with me?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a trait of yours that you feel comes out best when you're with me?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a compliment you secretly crave from me but don't ask for?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "vulnerable"
      },
      {
        "text": "When was the exact moment you felt the most deeply understood by me?",
        "mechanics": ["exact_moment", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a part of my personality you feel like you get to see that no one else does?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      }
    ],
    "deepTalk": [
      {
        "text": "What's a fear you have about our future that you rarely say out loud?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "vulnerable"
      },
      {
        "text": "How has your definition of love changed since you met me?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's an insecurity of yours that you think affects our relationship the most?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "vulnerable"
      },
      {
        "text": "What's one way you think we need to grow the most as a couple?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's something you feel you compromise on, but have never complained about?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a sacrifice you feel you've made for this relationship that we don't talk about?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "vulnerable"
      },
      {
        "text": "Do you think we handle conflict in a healthy way, or do we just sweep things under the rug?",
        "mechanics": ["forced_choice", "direct_address"],
        "tone": "heartfelt"
      }
    ]
  },
  "family": {
    "icebreakers": [
      {
        "text": "If our family was a reality TV show, what would the title be?",
        "mechanics": ["direct_address", "forced_choice", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "Who in the family has the worst driving skills?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's a food that instantly tastes like 'home' to you?",
        "mechanics": ["specific_instance"],
        "tone": "wholesome"
      },
      {
        "text": "Which family member is the hardest to buy a gift for, and why?",
        "mechanics": ["social_ranking", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "If our family had a warning label, what would it say?",
        "mechanics": ["direct_address", "humor_forward", "forced_choice"],
        "tone": "playful"
      },
      {
        "text": "What's a family recipe that must be protected at all costs?",
        "mechanics": ["specific_instance"],
        "tone": "wholesome"
      },
      {
        "text": "Who takes the longest to get ready for a family event?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      }
    ],
    "mostLikely": [
      {
        "text": "Who is most likely to bring up a 10-year-old argument at Thanksgiving dinner?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "Who is most likely to keep a massive secret from everyone else?",
        "mechanics": ["social_ranking"],
        "tone": "playful"
      },
      {
        "text": "Who is most likely to give unsolicited but surprisingly accurate advice?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "Who is most likely to survive in the wilderness, and who dies day one?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "Who is most likely to accidentally ruin a surprise party?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "Who is most likely to successfully fake their way into a job they know nothing about?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "Who is most likely to become a hoarder in their old age?",
        "mechanics": ["social_ranking", "humor_forward"],
        "tone": "playful"
      }
    ],
    "whatIfs": [
      {
        "text": "If our family had to win a talent show to save the world, what's our act?",
        "mechanics": ["escapist_hypothetical", "direct_address", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "If money was no object, what kind of ridiculous family compound would we build?",
        "mechanics": ["escapist_hypothetical", "direct_address"],
        "tone": "playful"
      },
      {
        "text": "If you could witness any moment from family history before you were born, what would it be?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "If we had to move to a different country together, where do we go?",
        "mechanics": ["escapist_hypothetical", "direct_address"],
        "tone": "playful"
      },
      {
        "text": "If someone wrote a book about our family, what chapter would people skip?",
        "mechanics": ["vulnerability", "direct_address", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "If our family was forced to rob a bank, who's driving the getaway car?",
        "mechanics": ["escapist_hypothetical", "social_ranking", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "If everyone in the family swapped bodies for a day, who would ruin whose life the fastest?",
        "mechanics": ["escapist_hypothetical", "social_ranking", "humor_forward"],
        "tone": "chaotic"
      }
    ],
    "nostalgia": [
      {
        "text": "Which family vacation was a disaster at the time, but is hilarious now?",
        "mechanics": ["nostalgia_recall", "specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What was the strictest or weirdest rule we had in our house growing up?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "What's the most ridiculous thing you genuinely believed as a kid?",
        "mechanics": ["nostalgia_recall", "specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What's a weird tradition we have that you didn't realize was weird until you grew up?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "playful"
      },
      {
        "text": "What's your favorite memory of us just sitting around doing nothing?",
        "mechanics": ["nostalgia_recall", "direct_address"],
        "tone": "wholesome"
      },
      {
        "text": "What was the most iconic meltdown someone had during a holiday?",
        "mechanics": ["nostalgia_recall", "specific_instance", "humor_forward"],
        "tone": "chaotic"
      },
      {
        "text": "What's a home-cooked meal that instantly takes you back to childhood?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "wholesome"
      }
    ],
    "perspectives": [
      {
        "text": "What's a slang word or trend today that makes zero sense to you?",
        "mechanics": ["specific_instance", "humor_forward"],
        "tone": "playful"
      },
      {
        "text": "What did you get away with as a teen that teens today could never do?",
        "mechanics": ["specific_instance", "nostalgia_recall"],
        "tone": "playful"
      },
      {
        "text": "What's something you think the younger generation actually got right?",
        "mechanics": ["vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a parenting choice you experienced that you'd never repeat?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "vulnerable"
      },
      {
        "text": "What's the hardest part about the age you're at right now?",
        "mechanics": ["vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a piece of technology you genuinely miss using?",
        "mechanics": ["nostalgia_recall", "specific_instance"],
        "tone": "wholesome"
      },
      {
        "text": "What's something you think kids today are missing out on?",
        "mechanics": ["vulnerability"],
        "tone": "heartfelt"
      }
    ],
    "deepTalk": [
      {
        "text": "What's a life lesson you had to learn the hard way so I wouldn't have to?",
        "mechanics": ["vulnerability", "direct_address"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a piece of advice you ignored when you were younger, but now realize was right?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "heartfelt"
      },
      {
        "text": "What's something you wish you'd started doing much earlier in your life?",
        "mechanics": ["vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's an apology you feel you owe to a family member, but never gave?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "vulnerable"
      },
      {
        "text": "What do you hope this family is remembered for in 100 years?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "heartfelt"
      },
      {
        "text": "What's a generational curse in our family you hope stops with you?",
        "mechanics": ["direct_address", "vulnerability"],
        "tone": "vulnerable"
      },
      {
        "text": "What's something you never understood about your parents until you grew up?",
        "mechanics": ["vulnerability", "specific_instance"],
        "tone": "heartfelt"
      }
    ]
  }
};

const categoryMap = {
  icebreakers: "Icebreakers",
  mostLikely: "Most Likely",
  whatIfs: "What Ifs",
  nostalgia: "Nostalgia",
  confessions: "Confessions",
  deepTalk: "Deep Talk",
  warmUp: "Warm Up",
  spicy: "Spicy",
  connection: "Connection",
  perspectives: "Perspectives"
};

let output = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const calibrationPrompts = [
`;

for (const [gamemode, categories] of Object.entries(taggedData)) {
  for (const [catKey, questions] of Object.entries(categories)) {
    const categoryName = categoryMap[catKey];
    for (const q of questions) {
      output += `  { gamemode: "${gamemode}", category: "${categoryName}", text: ${JSON.stringify(q.text)}, mechanics: ${JSON.stringify(q.mechanics)}, tone: ${JSON.stringify(q.tone)} },\n`;
    }
  }
}

output += `];

async function main() {
  console.log('Seeding Question Prompts...');
  for (const prompt of calibrationPrompts) {
    await prisma.questionPrompt.create({
      data: prompt,
    });
  }
  console.log('Seeded Question Prompts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

fs.writeFileSync('c:/Code/hezi.ai/backend/src/prisma/seed.ts', output, 'utf-8');
console.log('Successfully wrote new seed.ts');

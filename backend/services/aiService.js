import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AiChat from '../models/AiChat.js';
import AIConfig from '../models/AIConfig.js';
import User from '../models/User.js';
import { findTravelCompanions } from './matchingService.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const useGoogle = !!GEMINI_KEY;

const openai = !useGoogle && OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
const genAI = useGoogle ? new GoogleGenerativeAI(GEMINI_KEY) : null;

export const getSystemPrompt = async () => {
  const config = await AIConfig.findOne({ key: 'system_prompt' });
  if (config) return config.value;

  return `You are the AI Assistant for the "Travel Companion and Finder System" (TCFS).
Your goal is to help users find travel buddies, provide safety tips, and answer platform questions.
You MUST be polite, friendly, and prioritize safety.
If a user asks for travel companions, ask for their destination and dates if not provided.
You support English and Urdu. Detect the language and reply in the same language.
NEVER provide illegal advice.
For location-based queries in Pakistan, suggest popular safe routes.`;
};

export const getSafetyGuidelines = async () => {
  const config = await AIConfig.findOne({ key: 'safety_guidelines' });
  return config ? config.value : "Always verify your travel companion's identity. Meet in public places first.";
};

function getWebsiteKnowledgeResponse(message, user) {
  const msg = String(message || '').toLowerCase();
  const userLocation = user?.location || 'your location';

  if (msg.includes('tcfs') || msg.includes('website') || msg.includes('platform') || msg.includes('what is this')) {
    return 'TCFS stands for Travel Companion and Finder System. The website helps users discover travel companions, explore trips, send requests, chat with other travelers, post to the travel feed, manage profiles, and use the AI Assistant for support.';
  }

  if (msg.includes('match') || msg.includes('matches page')) {
    return 'The Matches page shows compatible travelers based on interests, travel style, profile strength, and verification status. Users can filter matches, review compatibility cards, and connect directly from the page.';
  }

  if (msg.includes('feed') || msg.includes('travel feed')) {
    return 'The Travel Feed page lets users share travel stories and updates. People can create posts, browse other travelers\' posts, and interact through likes, comments, and sharing-style actions.';
  }

  if (msg.includes('chat') || msg.includes('message') || msg.includes('messages inbox')) {
    return 'The chat feature uses a WhatsApp-style layout with a contact list, direct conversation panel, message input, attachments, emojis, and a New button to start a chat with a contact.';
  }

  if (msg.includes('request') || msg.includes('join request')) {
    return 'Requests are used when someone wants to join a trip or connect with another traveler. Once accepted, they can continue coordination through chat or messaging.';
  }

  if (msg.includes('trip') || msg.includes('create trip')) {
    return 'TCFS supports trip discovery and trip creation. Users can create a trip with destination, dates, budget, description, and interests, then connect with suitable companions.';
  }

  if (msg.includes('search')) {
    return 'The Search page helps users find trips and travelers using filters such as destination, age, gender, and interests.';
  }

  if (msg.includes('profile') || msg.includes('edit profile')) {
    return 'Users can update their profile with bio, age, gender, interests, travel style, location, and profile picture. A stronger profile improves matching quality.';
  }

  if (msg.includes('verification') || msg.includes('verified')) {
    return 'TCFS includes user verification so travelers can identify trusted members more easily. Verified status is displayed across the platform, including matches and profile-related pages.';
  }

  if (msg.includes('ai assistant') || msg.includes('assistant')) {
    return 'The AI Assistant helps with travel planning, finding companions, safety guidance, and explaining TCFS website features such as matches, feed, trips, requests, and chat.';
  }

  if (msg.includes('dashboard') || msg.includes('home')) {
    return 'The dashboard acts as the user hub for discovering trips, checking matches, reviewing requests, messaging companions, and opening settings or profile tools.';
  }

  if (msg.includes('find companion') || msg.includes('find a companion') || msg.includes('travel buddy') || msg.includes('buddy')) {
    return `I can help find a companion. Tell me the destination and any preferences. For example: "Find a companion for Lahore" or "Find a verified travel buddy near ${userLocation}."`;
  }

  return null;
}

function getOfflineTravelAdvice(message) {
  const msg = String(message || '').toLowerCase();

  if (msg.includes('safety') || msg.includes('safe') || msg.includes('tips')) {
    return 'Offline support: Verify identity first, meet in public places, share trip details with someone you trust, avoid sending money early, and prefer verified travelers when possible.';
  }

  if (msg.includes('weather') || msg.includes('climate') || msg.includes('temperature')) {
    return 'Offline support: Northern Pakistan is usually best from May to October, while Lahore and Islamabad are more comfortable from November to February. Check a live weather app before packing.';
  }

  if (msg.includes('pack') || msg.includes('luggage') || msg.includes('bag')) {
    return 'Offline support: Carry ID, wallet, phone, power bank, medicines, comfortable shoes, layered clothing for the north, and light cotton clothes for warmer cities.';
  }

  if (msg.includes('budget') || msg.includes('cost') || msg.includes('price')) {
    return 'Offline support: Budget trips are usually the cheapest with hostels and local transport, mid-range trips include better hotels and more comfort, and group travel can reduce total cost.';
  }

  return null;
}

async function getSmartFallback(user, message) {
  const websiteAnswer = getWebsiteKnowledgeResponse(message, user);
  if (websiteAnswer) {
    return { response: websiteAnswer, data: null };
  }

  const travelAdvice = getOfflineTravelAdvice(message);
  if (travelAdvice) {
    return { response: travelAdvice, data: null };
  }

  const msg = String(message || '').toLowerCase();
  if (msg.includes('find') || msg.includes('search') || msg.includes('companion') || msg.includes('partner')) {
    const match = message.match(/\b(?:for|to|near)\s+([A-Za-z\s-]+)/i);
    const destination = match?.[1]?.trim();

    if (!destination) {
      return {
        response: 'To help find a companion, tell me the city or destination. Example: "Find a companion for Lahore".',
        data: null,
      };
    }

    const matches = await findTravelCompanions(user, { destination, genderPreference: 'Any' });
    if (matches.length > 0) {
      const lines = matches
        .map((item, index) => `${index + 1}. ${item.name} from ${item.location} (${item.compatibilityScore}% match)`)
        .join('\n');

      return {
        response: `I found these possible companions for ${destination}:\n${lines}`,
        data: matches,
      };
    }

    return {
      response: `I couldn't find strong companion matches for ${destination} right now. Try improving your profile interests or asking for another destination.`,
      data: null,
    };
  }

  return {
    response: 'I can answer TCFS website questions, explain features like matches, chat, trips, requests, and feed, and also help with safety tips or finding companions.',
    data: null,
  };
}

const retryWithBackoff = async (fn, retries = 3, delay = 2000) => {
  try {
    return await fn();
  } catch (err) {
    const text = String(err?.message || '');
    if (retries === 0 || (!text.includes('429') && !text.includes('503'))) throw err;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

async function processChatGoogle(user, userMessage, userLocation, conversationHistory, systemPrompt, safetyTips) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `${systemPrompt}\n\nSafety Guidelines: ${safetyTips}\n\nUser Context: Name=${user.name}, Age=${user.age}, Location=${userLocation || user.location || 'Unknown'}.`,
    tools: [
      {
        functionDeclarations: [
          {
            name: 'find_companions',
            description: 'Search for travel companions based on destination and gender preference.',
            parameters: {
              type: 'object',
              properties: {
                destination: { type: 'string', description: 'The city or route the user wants to travel to.' },
                genderPreference: { type: 'string', enum: ['Male', 'Female', 'Any'], description: 'Preferred gender of companion.' },
              },
              required: ['destination'],
            },
          },
        ],
      },
    ],
  });

  const history = conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });
  const result = await retryWithBackoff(() => chat.sendMessage(userMessage));
  const response = result.response;
  const functionCalls = response.functionCalls();

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    if (call.name === 'find_companions') {
      const args = call.args || {};
      const matches = await findTravelCompanions(user, args);
      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: 'find_companions',
            response: { name: 'find_companions', content: matches },
          },
        },
      ]);

      return {
        response: result2.response.text(),
        data: matches,
      };
    }
  }

  return {
    response: response.text(),
    data: null,
  };
}

export const processChat = async (userId, userMessage, userLocation) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const websiteAnswer = getWebsiteKnowledgeResponse(userMessage, user);
    if (websiteAnswer) {
      return { response: websiteAnswer, data: null };
    }

    const historyDocs = await AiChat.find({ userId }).sort({ timestamp: -1 }).limit(10).lean();
    const conversationHistory = historyDocs.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const systemPrompt = await getSystemPrompt();
    const safetyTips = await getSafetyGuidelines();

    if (!GEMINI_KEY && !OPENAI_KEY) {
      return await getSmartFallback(user, userMessage);
    }

    if (useGoogle) {
      try {
        return await processChatGoogle(
          user,
          userMessage,
          userLocation,
          conversationHistory,
          systemPrompt,
          safetyTips
        );
      } catch (err) {
        if (err && (err.status === 429 || String(err.message || '').includes('429'))) {
          const e = new Error('RATE_LIMIT');
          e.code = 429;
          throw e;
        }
        return await getSmartFallback(user, userMessage);
      }
    }

    if (!openai) {
      return await getSmartFallback(user, userMessage);
    }

    const systemMessage = {
      role: 'system',
      content: `${systemPrompt}\n\nSafety Guidelines: ${safetyTips}\n\nUser Context: Name=${user.name}, Age=${user.age}, Location=${userLocation || user.location || 'Unknown'}`,
    };

    const tools = [
      {
        type: 'function',
        function: {
          name: 'find_companions',
          description: 'Search for travel companions based on destination and gender preference.',
          parameters: {
            type: 'object',
            properties: {
              destination: { type: 'string', description: 'The city or route the user wants to travel to.' },
              genderPreference: { type: 'string', enum: ['Male', 'Female', 'Any'], description: 'Preferred gender of companion.' },
            },
            required: ['destination'],
          },
        },
      },
    ];

    const messages = [systemMessage, ...conversationHistory, { role: 'user', content: userMessage }];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = completion.choices[0].message;

    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'find_companions') {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        const matches = await findTravelCompanions(user, args);
        messages.push(responseMessage);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: 'find_companions',
          content: JSON.stringify(matches),
        });

        const secondCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
        });

        return {
          response: secondCompletion.choices[0].message.content,
          data: matches,
        };
      }
    }

    return {
      response: responseMessage.content,
      data: null,
    };
  } catch (error) {
    console.error('AI Processing Error:', error);
    const user = await User.findById(userId).lean().catch(() => null);
    return await getSmartFallback(user, userMessage);
  }
};

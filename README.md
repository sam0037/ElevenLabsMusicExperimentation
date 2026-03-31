# AI Chat & Music Generation App

An experimentation app for chatting with OpenAI's GPT models and generating music using Eleven Labs APIs.

## Features

- **Chat with ChatGPT**: Have conversations with OpenAI's language models
- **Composition Plans**: Create detailed music composition plans using AI
- **Music Generation**: Generate music from text prompts or composition plans
- **History Tracking**: View past conversations and generated music with detailed metadata
- **Local Storage**: All data persists in your browser's localStorage

## Getting Started

### 1. Configure API Keys

To use this app, you'll need API keys from OpenAI and/or Eleven Labs.

1. Open `/src/config/api-config.ts`
2. Add your API keys:

```typescript
export const API_CONFIG = {
  openai: {
    apiKey: "sk-your-openai-api-key-here", // Add your OpenAI API key
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  elevenLabs: {
    apiKey: "sk_your-elevenlabs-api-key-here", // Add your Eleven Labs API key
    baseUrl: "https://api.elevenlabs.io/v1",
    defaultModel: "music_v1",
  },
};
```

### 2. Get Your API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into the `openai.apiKey` field in `/src/config/api-config.ts`

#### Eleven Labs API Key
1. Go to [Eleven Labs](https://elevenlabs.io/)
2. Sign up or log in
3. Navigate to your profile/API settings
4. Copy your API key
5. Paste it into the `elevenLabs.apiKey` field in `/src/config/api-config.ts`

### 3. Start Using the App

Once you've added your API keys:

1. **Chat Page**: Click "New Chat" and start chatting with GPT models
2. **Music Page**: 
   - Create composition plans by describing the music you want
   - Generate music directly from prompts
   - Generate music from saved composition plans

## Features in Detail

### Chat Page
- Create multiple conversation threads
- Maintains conversation history for context
- Delete unwanted conversations
- Automatic conversation saving

### Music Generation Page

#### Create Composition Plan
- Describe the music you want to create
- AI generates a detailed composition plan
- Plans include style, tempo, instruments, and structure
- View input request and output response metadata

#### Generate Music
**From Prompt**: Generate music directly from a text description
**From Plan**: Select a saved composition plan to generate music

#### History
- View all generated composition plans and music
- Expandable details showing:
  - Input request parameters
  - Output response metadata
  - Processing time, file size, and other metrics
- Play generated audio directly in the browser

## Notes

- **This is a frontend-only app**: API calls are made directly from your browser
- **API Keys are stored in code**: Your API keys are in the source code. Do not deploy this publicly.
- **For personal experimentation only**: This setup is not secure for production use
- **API costs**: Using these APIs will incur costs based on usage

## Mock Data

The app includes mock data for demonstration purposes. When API keys are not configured, the app will:
- Show mock responses for chat messages
- Display sample composition plans
- Use sample audio files for music generation

## Troubleshooting

### "API key not configured" error
- Make sure you've added your API key in `/src/config/api-config.ts`
- Check that the key starts with the correct prefix (`sk-` for OpenAI, `sk_` for Eleven Labs)

### CORS errors
- OpenAI and Eleven Labs APIs support CORS for browser requests
- If you encounter CORS issues, check that your API keys are valid

### Audio playback issues
- Make sure your browser supports HTML5 audio
- Check browser console for any errors

## Development

This app is built with:
- React
- TypeScript
- Tailwind CSS
- React Router
- Lucide React (icons)

To modify the app, explore:
- `/src/app/components/ChatPage.tsx` - Chat interface
- `/src/app/components/MusicPage.tsx` - Music generation interface
- `/src/services/openai-service.ts` - OpenAI API integration
- `/src/services/elevenlabs-service.ts` - Eleven Labs API integration
- `/src/config/api-config.ts` - API configuration

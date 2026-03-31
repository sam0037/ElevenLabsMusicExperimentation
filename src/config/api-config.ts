// API Configuration
// Add your API keys here to enable real API calls

export const API_CONFIG = {
  // OpenAI API Configuration
  openai: {
    apiKey: "", // Add your OpenAI API key here: "sk-..."
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini", // or "gpt-4", "gpt-3.5-turbo", etc.
  },

  // Eleven Labs API Configuration
  elevenLabs: {
    apiKey: "", // Add your Eleven Labs API key here: "sk_..."
    baseUrl: "https://api.elevenlabs.io/v1",
    defaultModel: "music_v1",
  },
};

// Check if API keys are configured
export const isOpenAIConfigured = () => {
  return API_CONFIG.openai.apiKey && API_CONFIG.openai.apiKey.startsWith("sk-");
};

export const isElevenLabsConfigured = () => {
  return API_CONFIG.elevenLabs.apiKey && API_CONFIG.elevenLabs.apiKey.startsWith("sk_");
};

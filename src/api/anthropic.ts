/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.

Valid model names:
claude-sonnet-4-20250514
claude-3-7-sonnet-latest
claude-3-5-haiku-latest
*/

// Note: The Anthropic SDK cannot run in React Native (requires Node.js APIs)
// This is now a placeholder. To use Anthropic API, you need to:
// 1. Create a backend API endpoint that calls Anthropic
// 2. Update chat-service.ts to call your backend endpoint instead

export const getAnthropicClient = () => {
  throw new Error(
    "Anthropic SDK cannot run in React Native. Please implement a backend API endpoint to call Anthropic API."
  );
};

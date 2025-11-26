/*
IMPORTANT NOTICE: DO NOT REMOVE
./src/api/chat-service.ts
If the user wants to use AI to generate text, answer questions, or analyze images you can use the functions defined in this file to communicate with the OpenAI, Anthropic, and Grok APIs.
*/
import { AIMessage, AIRequestOptions, AIResponse } from "../types/ai";

/**
 * Get a text response from Anthropic
 * NOTE: Anthropic SDK cannot run in React Native (requires Node.js APIs)
 * To use Anthropic, implement a backend API endpoint instead
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getAnthropicTextResponse = async (
  messages: AIMessage[],
  options?: AIRequestOptions,
): Promise<AIResponse> => {
  throw new Error(
    "Anthropic SDK cannot run in React Native. Please implement a backend API endpoint to call Anthropic API, or use OpenAI or Grok instead."
  );
};

/**
 * Get a simple chat response from Anthropic
 * NOTE: Anthropic SDK cannot run in React Native (requires Node.js APIs)
 * To use Anthropic, implement a backend API endpoint instead
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getAnthropicChatResponse = async (prompt: string): Promise<AIResponse> => {
  throw new Error(
    "Anthropic SDK cannot run in React Native. Please implement a backend API endpoint to call Anthropic API, or use OpenAI or Grok instead."
  );
};

/**
 * Get a text response from OpenAI
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getOpenAITextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    console.log('[OpenAI] Making direct API call...');
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    const defaultModel = "gpt-4o"; //accepts images as well, use this for image analysis

    const requestBody = {
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    };

    console.log('[OpenAI] Sending request to OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OpenAI] Response status:', response.status);

    if (!response.ok) {
      let errorData = 'Unknown error';
      try {
        errorData = await response.text();
      } catch (e) {
        errorData = `Failed to read error response: ${e}`;
      }
      console.log('[OpenAI] API error response:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    let data;
    try {
      const responseText = await response.text();
      console.log('[OpenAI] Response received, length:', responseText.length);
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('[OpenAI] Failed to parse JSON response:', e);
      throw new Error(`Failed to parse OpenAI response: ${e}`);
    }

    console.log('[OpenAI] API call successful');

    return {
      content: data.choices?.[0]?.message?.content || "",
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.log("OpenAI API Error occurred");
    console.log("Error type:", typeof error);
    if (error && typeof error === 'object') {
      console.log("Error message:", 'message' in error ? error.message : 'No message');
    }
    throw error;
  }
};

/**
 * Get a simple chat response from OpenAI
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getOpenAIChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getOpenAITextResponse([{ role: "user", content: prompt }]);
};

/**
 * Get a text response from Grok
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getGrokTextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    console.log('[Grok] Making direct API call...');
    const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GROK_API_KEY;

    if (!apiKey) {
      throw new Error('Grok API key not found in environment variables');
    }

    const defaultModel = "grok-3-beta";

    const requestBody = {
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    };

    console.log('[Grok] Sending request to Grok API...');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log('[Grok] API error response:', errorData);
      throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    console.log('[Grok] API call successful');

    return {
      content: data.choices[0]?.message?.content || "",
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.log("Grok API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from Grok
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getGrokChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getGrokTextResponse([{ role: "user", content: prompt }]);
};

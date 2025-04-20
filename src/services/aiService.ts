import { LLMApiConfig } from "../types/article";
import axios, { AxiosError } from "axios"; // Import AxiosError
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export class AiService {
  private async handleOpenAICompatibleAPI(
    message: string,
    llmApiConfig: LLMApiConfig
  ): Promise<string> {
    const { model, url = "", apiKey } = llmApiConfig;

    const data = JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });sisuad/article-processor

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const responseData = response.data;
      return responseData.choices[0].message.content;
    } catch (error) {
      // Add specific error handling
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          `Error calling OpenAI Compatible API (${url}, model: ${model}): Status ${axiosError.response?.status}, Message: ${axiosError.message}`
        );
        throw new Error(
          `OpenAI Compatible API request failed: Status ${axiosError.response?.status}`
        );
      } else {
        console.error(
          `Unknown error calling OpenAI Compatible API (${url}, model: ${model}):`,
          error
        );
        throw new Error("Unknown error during OpenAI Compatible API request");
      }
    }
  }

  private async handleClaudeAPI(
    message: string,
    llmApiConfig: LLMApiConfig
  ): Promise<string> {
    const { model, url = "", apiKey } = llmApiConfig;

    const data = JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      });

      return response.data.content[0].text;
    } catch (error) {
      // Add specific error handling
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          `Error calling Claude API (${url}, model: ${model}): Status ${axiosError.response?.status}, Message: ${axiosError.message}`
        );
        throw new Error(
          `Claude API request failed: Status ${axiosError.response?.status}`
        );
      } else {
        console.error(
          `Unknown error calling Claude API (${url}, model: ${model}):`,
          error
        );
        throw new Error("Unknown error during Claude API request");
      }
    }
  }

  private async handleGeminiAPI(
    message: string,
    llmApiConfig: LLMApiConfig
  ): Promise<string> {
    const { apiKey, model } = llmApiConfig;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const data = JSON.stringify({
      contents: [
        {
          parts: [{ text: message }],
        },
      ],
    });

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Add safety check for response structure
      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0]
      ) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        console.error(
          `Unexpected response structure from Gemini API (${url}, model: ${model}):`,
          response.data
        );
        throw new Error("Unexpected response structure from Gemini API");
      }
    } catch (error) {
      // Add specific error handling
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          `Error calling Gemini API (${url}, model: ${model}): Status ${axiosError.response?.status}, Message: ${axiosError.message}`
        );
        // Log response data if available for debugging 503s or other errors
        if (axiosError.response?.data) {
          console.error("Gemini API Error Response Data:", axiosError.response.data);
        }
        throw new Error(
          `Gemini API request failed: Status ${axiosError.response?.status}`
        );
      } else {
        console.error(
          `Unknown error calling Gemini API (${url}, model: ${model}):`,
          error
        );
        throw new Error("Unknown error during Gemini API request");
      }
    }
  }

  private async handleGeminiSDK(
    message: string,
    llmApiConfig: LLMApiConfig
  ): Promise<string> {
    try {
      const { apiKey, model } = llmApiConfig;
      const genAI = new GoogleGenerativeAI(apiKey);
      const AIModel = genAI.getGenerativeModel({ model });

      const result = await AIModel.generateContent(message);

      return result.response.text();
    } catch (error) {
      console.error("Error processing Gemini chat:", error);
      throw new Error("Failed to process Gemini chat");
    }
  }

  private async handleOpenAISDK(
    message: string,
    llmApiConfig: LLMApiConfig
  ): Promise<string> {
    const { apiKey, model } = llmApiConfig;
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: message,
        },
      ],
      store: true,
    });

    return completion.choices[0].message.content || "";
  }

  async chat(message: string, llmApiConfig: LLMApiConfig): Promise<string> {
    // Keep the outer try-catch for general errors, but specific errors are now handled inside the handlers
    try {
      const { model, url } = llmApiConfig;

      if (url) {
        if (model.toLowerCase().includes("claude")) {
          return await this.handleClaudeAPI(message, llmApiConfig);
        } else {
          return await this.handleOpenAICompatibleAPI(message, llmApiConfig);
        }
      }

      if (model.toLowerCase().startsWith("gpt")) {
        return await this.handleOpenAISDK(message, llmApiConfig);
      } else if (model.toLowerCase().startsWith("gemini")) {
        // return await this.handleGeminiSDK(message, llmApiConfig);
        return await this.handleGeminiAPI(message, llmApiConfig);
      } else {
        console.error(`Invalid model specified: ${model}`);
        throw new Error(`Invalid model specified: ${model}`);
      }
    } catch (error) {
      // Log the error originating from the handlers or SDKs
      console.error("Error processing chat request:", error);
      // Re-throw a user-friendly error, the specific details are already logged
      throw new Error(
        `Failed to process chat: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

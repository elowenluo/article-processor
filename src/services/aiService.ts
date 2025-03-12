import { LLMApiConfig } from "../types/article";
import axios from "axios";
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
    });

    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const responseData = response.data;

    return responseData.choices[0].message.content;
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

    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    return response.data.content[0].text;
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
        return await this.handleGeminiSDK(message, llmApiConfig);
      } else {
        throw new Error("Invalid model");
      }
    } catch (error) {
      console.error("Error processing chat:", error);
      throw new Error("Failed to process chat");
    }
  }
}

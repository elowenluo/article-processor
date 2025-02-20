import { LLMApiConfig } from "../types/article";
import axios from "axios";

export class AiService {
  async chat(message: string, llmApiConfig: LLMApiConfig): Promise<string> {
    try {
      const { model, url, apiKey } = llmApiConfig;

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
    } catch (error) {
      console.error("Error processing chat:", error);
      throw new Error("Failed to process chat");
    }
  }
}

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

    // 记录发送给AI前的数据
    console.log("\n===发送给AI的请求数据(OpenAI Compatible)===");
    console.log("请求URL:", url);
    console.log("请求模型:", model);
    console.log("请求内容前100字符:", message.substring(0, 100));
    // 尝试提取中文标题示例
    const titleMatch = message.match(/标题.*?[\u4e00-\u9fa5]+/g);
    console.log("请求内容中文标题示例:", titleMatch);

    const data = JSON.stringify({
      model,
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
          Authorization: `Bearer ${apiKey}`,
        },
        responseType: "arraybuffer",
      });

      // 修复：直接使用response.data作为Buffer，不需要再次转换
      const buffer = response.data; // 这里response.data已经是Buffer类型
      const textContent = buffer.toString("utf-8");
      
      // 记录从AI接收到的响应数据
      console.log("\n===从AI接收的响应数据(OpenAI Compatible)===");
      console.log("原始响应数据前200字符:", textContent.substring(0, 200));
      
      const responseData = JSON.parse(textContent);
      const content = responseData.choices[0].message.content;
      console.log("解析后的内容前200字符:", content.substring(0, 200));
      
      // 检查是否包含乱码的特征
      if (/[\ufffd\ufffc]/.test(content) || /鏈�|鍙�|鐨�/.test(content)) {
        console.log("警告：检测到可能的乱码！");
      }

      return content;
    } catch (error) {
      // Add specific error handling
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(
          `Error calling OpenAI Compatible API (${url}, model: ${model}): Status ${axiosError.response?.status}, Message: ${axiosError.message}`
        );
        throw new Error(
          `OpenAI Compatible API request failed: Status ${axiosError.response?.status} , Message: ${axiosError.message}`
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

    // 记录发送给AI前的数据
    console.log("\n===发送给AI的请求数据(Claude)===");
    console.log("请求URL:", url);
    console.log("请求模型:", model);
    console.log("请求内容前100字符:", message.substring(0, 100));
    const titleMatch = message.match(/标题.*?[\u4e00-\u9fa5]+/g);
    console.log("请求内容中文标题示例:", titleMatch);

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
        responseType: "arraybuffer", // 添加responseType以确保一致的处理
      });

      // 确保正确处理响应数据
      let textContent, content;
      
      if (response.data instanceof Buffer) {
        textContent = response.data.toString('utf-8');
        const responseData = JSON.parse(textContent);
        content = responseData.content[0].text;
      } else {
        // 如果响应不是Buffer，记录原始类型
        textContent = JSON.stringify(response.data).substring(0, 200);
        content = response.data.content[0].text;
      }
      
      // 记录从AI接收到的响应数据
      console.log("\n===从AI接收的响应数据(Claude)===");
      console.log("原始响应数据前200字符:", textContent.substring(0, 200));
      console.log("解析后的内容前200字符:", content.substring(0, 200));
      
      // 检查是否包含乱码的特征
      if (/[\ufffd\ufffc]/.test(content) || /鏈�|鍙�|鐨�/.test(content)) {
        console.log("警告：检测到可能的乱码！");
      }

      return content;
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

    // 记录发送给AI前的数据
    console.log("\n===发送给AI的请求数据(Gemini)===");
    console.log("请求URL:", url);
    console.log("请求模型:", model);
    console.log("请求内容前100字符:", message.substring(0, 100));
    const titleMatch = message.match(/标题.*?[\u4e00-\u9fa5]+/g);
    console.log("请求内容中文标题示例:", titleMatch);

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
        responseType: "arraybuffer", // 添加responseType以确保一致的处理
      });

      // 确保正确处理响应数据
      let textContent, responseData;
      
      if (response.data instanceof Buffer) {
        textContent = response.data.toString('utf-8');
        responseData = JSON.parse(textContent);
      } else {
        // 如果响应不是Buffer，记录原始类型
        textContent = JSON.stringify(response.data).substring(0, 200);
        responseData = response.data;
      }
      
      // 记录从AI接收到的响应数据
      console.log("\n===从AI接收的响应数据(Gemini)===");
      console.log("原始响应数据前200字符:", textContent.substring(0, 200));

      // Add safety check for response structure
      if (
        responseData &&
        responseData.candidates &&
        responseData.candidates[0] &&
        responseData.candidates[0].content &&
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts[0]
      ) {
        const content = responseData.candidates[0].content.parts[0].text;
        console.log("解析后的内容前200字符:", content.substring(0, 200));
        
        // 检查是否包含乱码的特征
        if (/[\ufffd\ufffc]/.test(content) || /鏈�|鍙�|鐨�/.test(content)) {
          console.log("警告：检测到可能的乱码！");
        }
        
        return content;
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
          console.error(
            "Gemini API Error Response Data:",
            axiosError.response.data
          );
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
    
    // 记录发送给AI前的数据
    console.log("\n===发送给AI的请求数据(OpenAI SDK)===");
    console.log("请求模型:", model);
    console.log("请求内容前100字符:", message.substring(0, 100));
    const titleMatch = message.match(/标题.*?[\u4e00-\u9fa5]+/g);
    console.log("请求内容中文标题示例:", titleMatch);
    
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

    const content = completion.choices[0].message.content || "";
    
    // 记录从AI接收到的响应数据
    console.log("\n===从AI接收的响应数据(OpenAI SDK)===");
    console.log("解析后的内容前200字符:", content.substring(0, 200));
    
    // 检查是否包含乱码的特征
    if (/[\ufffd\ufffc]/.test(content) || /鏈�|鍙�|鐨�/.test(content)) {
      console.log("警告：检测到可能的乱码！");
    }
    
    return content;
  }

  async chat(message: string, llmApiConfig: LLMApiConfig): Promise<string> {
    // Keep the outer try-catch for general errors, but specific errors are now handled inside the handlers
    try {
      const { model, url } = llmApiConfig;
      
      // 确保消息是有效的UTF-8编码
      // 先检查消息是否包含乱码特征
      if (/[\ufffd\ufffc]/.test(message) || /鏈�|鍙�|鐨�/.test(message)) {
        console.warn("警告：检测到输入消息可能包含乱码！");
        
        // 尝试修复编码问题
        try {
          // 将消息转换为Buffer，然后重新以UTF-8解码
          const buffer = Buffer.from(message);
          message = buffer.toString('utf8');
          console.log("已尝试修复消息编码");
        } catch (encodeError) {
          console.error("修复消息编码失败:", encodeError);
        }
      }
      
      console.log(`准备调用AI模型: ${model}, URL: ${url || "使用SDK"}`);

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
        `Failed to process chat: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

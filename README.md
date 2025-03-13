# Article Processor

English | [简体中文](README_zh-CN.md)

Article Processor is a tool for article content reproduction and processing. It can automatically handles article formatting, localizes image resources, and use AI to generate summaries, categories and tags.

## Feature

### 📝 Content Processing

- Automatically extracts article title, content and source information
- Intelligently optimizes article formatting (including image centering, style standardization, and redundant tag cleanup)
- Standardizes article citations and attribution information

### 🖼️ Image Processing

- Downloads and localizes remote image resources
- Automatically converts WebP images to the widely-supported JPEG format
- Centers images for better presentation

### 🤖 AI Processing

- Automatically generates article abstracts
- Generates content summaries
- Creates relevant article tags

### 🧠 AI Model Support

- OpenAI
- Google AI Studio
- Custom API endpoints

## Technical Architecture

### API

| Endpoint                 | Method | Description                                              |
| ------------------------ | ------ | -------------------------------------------------------- |
| /process                 | POST   | Process an array of article URLs and return JSON results |
| /processStatus/:jobId    | GET    | Get job status and results                               |
| /downloadImage:imageName | GET    | Retrieve processed images                                |

## Quick Start

### Installation

```bash
git clone https://github.com/elowenluo/article-processor.git
cd article-processor
npm install
```

### Configuration

1. Copy the environment template file

```bash
cp .env.example .env
```

2. Configure required environment variables

```bash
# Server access address for generating image URLs
HOST=http://localhost

# Service port
PORT=3000

# Maximum number of concurrent processing tasks (within a job)
MAX_CONCURRENT_TASKS=3

# Maximum number of concurrent jobs (defaults to 1)
MAX_CONCURRENT_JOBS=1
```

### Running

```bash
# Development environment
npm run dev

# Production environment
npm run build
npm start
```

## API Usage Example

### Processing Articles

Send a POST request to the /process endpoint with an array of article URLs and AI configuration:

#### OpenAI

```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://news.mydrivers.com/1/1030/1030243.htm"
    ],
    "llmApiConfig": {
      "model": "gpt-3.5-turbo",
      "apiKey": "sk-XXX"
    }
  }'
```

#### Google AI Studio

```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://news.mydrivers.com/1/1030/1030243.htm"
    ],
    "llmApiConfig": {
      "model": "gemini-2.0-flash",
      "apiKey": "XXX"
    }
  }'
```

#### Custom API Endpoint

```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://news.mydrivers.com/1/1030/1030243.htm"
    ],
    "llmApiConfig": {
      "model": "gpt-3.5-turbo",
      "url": "https://api.openai.com/v1/chat/completions",
      "apiKey": "sk-XXX"
    }
  }'
```

#### Example response:

```json
{
  "jobId": "ae587e58-350f-4303-8c59-9c67b09ec189",
  "status": "processing",
  "message": "Processing started. Check status at the URL below.",
  "statusUrl": "/processStatus/ae587e58-350f-4303-8c59-9c67b09ec189"
}
```

### Getting Job Status and Results

Send a GET request to the /processStatus/:jobId endpoint to retrieve the job status and results:

```bash
curl -X GET http://localhost:3000/processStatus/ae587e58-350f-4303-8c59-9c67b09ec189
```

#### Processing Response Example:

```json
{
  "jobId": "ae587e58-350f-4303-8c59-9c67b09ec189",
  "status": "processing",
  "message": "Job is still processing",
  "createdAt": "2025-02-27T01:21:06.662Z",
  "updatedAt": "2025-02-27T01:21:06.662Z"
}
```

#### Completed Response Example:

```json
[
  {
    "title": "DeepSeek成最快突破3000万日活应用程序：手机终端厂商抢着接入DeepSeek",
    "content": "<article><p>近日消息，据报道，近期DeepSeek访问使用量急速上升，<span><strong>已经成为目前最快突破3000万日活跃用户量的应用程序。</strong></span></p><p>与此同时，<strong>三家基础电信企业已全面接入国产开源大模型DeepSeek，手机、PC等终端厂商也在积极拥抱DeepSeek，</strong>一些地方政府也开始在政务系统部署DeepSeek。</p><p>比如深圳龙岗区政务服务和数据管理局已经在上线了Deepseek-R1全尺寸模型，成为广东首个在政务信创环境下部署该模型的政府部门单位。</p><p>业内人士表示，DeepSeek的开源模式大幅降低了人工智能进入各行业的门槛，相关的政府和企业级应用有望出现裂变式增长。</p><p>截至目前，在国内市场，DeepSeek直接刷新了豆包、Kimi和文心一言等国内大模型的用户量榜单，2025年1月，DeepSeek月均活跃用户数跃居第一。</p><p>据了解，DeepSeek以3%的成本做出了接近ChatGPT o1水平的模型。低成本便可调校出足够好的AI模型，也让技术闭源的OpenAI和用昂贵算力及CUDA生态拉高壁垒的英伟达神话不攻自破，DeepSeek的成功，让硅谷高管对算力不计成本的投入，一度集体遭到了投资者的质疑。</p><p><figure style=\"text-align: center;\"><img alt=\"DeepSeek成最快突破3000万日活应用程序：手机终端厂商抢着接入DeepSeek\" src=\"https://img1.mydrivers.com/img/20250214/s_a7bd92821ee94f4b9a6abc750efc604f.jpg\"></figure></p>                        <footer>自 快科技</footer></article>",
    "summary": "据报道，DeepSeek成为2025年最快突破3000万日活跃用户的应用程序，并刷新了国内大模型用户量榜单，于2025年1月跃居月均活跃用户数第一。三家基础电信企业、手机及PC终端厂商均已接入DeepSeek。例如，深圳龙岗区政务服务和数据管理局已在政务系统上线Deepseek-R1全尺寸模型，成为广东首个部署该模型的政府部门。DeepSeek以3%的成本实现了接近ChatGPT o1水平的模型效果，其开源模式或将推动政府和企业级应用的增长。",
    "tags": ["DeepSeek", "开源大模型", "人工智能", "AI应用", "用户增长"],
    "categories": ["人工智能", "数据智能", "移动应用"]
  }
]
```

#### Failed Response Example:

```json
{
  "jobId": "ae587e58-350f-4303-8c59-9c67b09ec189",
  "status": "failed",
  "error": "Failed to process article: Invalid URL or unsupported website",
  "createdAt": "2025-02-27T01:21:06.662Z",
  "updatedAt": "2025-02-27T01:21:06.662Z"
}
```

## Todo

- [ ] Remove Google Ads
- [ ] Support more content source websites

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

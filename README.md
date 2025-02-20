# Article Processor

**[English](README.md)** | [简体中文](README_zh-CN.md)

Article Processor is a tool for article content reproduction and processing. It can automatically handles article formatting, localizes image resources, and use AI to generate summaries and tags.

## Feature

### 📝 Content Processing

* Automatically extracts article title, content and source information
* Intelligently optimizes article formatting (including image centering, style standardization, and redundant tag cleanup)
* Standardizes article citations and attribution information

### 🖼️ Image Processing

* Downloads and localizes remote image resources
* Automatically converts WebP images to the widely-supported JPEG format

### 🤖 AI Processing

* Automatically generates article abstracts
* Generates content summaries

## Technical Architecture

| Endpoint                 | Method | Description                                              |
| ------------------------ | ------ | -------------------------------------------------------- |
| /process                 | POST   | Process an array of article URLs and return JSON results |
| /downloadImage:imageName | GET    | Retrieve processed images                                |

### Supported Domains and Processors

| Domain             | Processor                 |
| ------------------ | ------------------------- |
| news.mydrivers.com | MyDriversArticleProcessor |
| www.cnbeta.com.tw  | CNBetaArticleProcessor    |

## Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Copy the environment template file

```bash
cp .env.example .env
```

2. Configure required environment variables 

```bash
# 服务器访问地址，用于生成图片URL
HOST=http://localhost

# 服务运行端口
PORT=3000
```

### Running

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## API Usage Example

### Processing Articles

Send a POST request to the /process endpoint with an array of article URLs and AI configuration:

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

Example response:

```json
[
  {
    "title": "DeepSeek成最快突破3000万日活应用程序：手机终端厂商抢着接入DeepSeek",
    "content": "<article><p>近日消息，据报道，近期DeepSeek访问使用量急速上升，<span><strong>已经成为目前最快突破3000万日活跃用户量的应用程序。</strong></span></p><p>与此同时，<strong>三家基础电信企业已全面接入国产开源大模型DeepSeek，手机、PC等终端厂商也在积极拥抱DeepSeek，</strong>一些地方政府也开始在政务系统部署DeepSeek。</p><p>比如深圳龙岗区政务服务和数据管理局已经在上线了Deepseek-R1全尺寸模型，成为广东首个在政务信创环境下部署该模型的政府部门单位。</p><p>业内人士表示，DeepSeek的开源模式大幅降低了人工智能进入各行业的门槛，相关的政府和企业级应用有望出现裂变式增长。</p><p>截至目前，在国内市场，DeepSeek直接刷新了豆包、Kimi和文心一言等国内大模型的用户量榜单，2025年1月，DeepSeek月均活跃用户数跃居第一。</p><p>据了解，DeepSeek以3%的成本做出了接近ChatGPT o1水平的模型。低成本便可调校出足够好的AI模型，也让技术闭源的OpenAI和用昂贵算力及CUDA生态拉高壁垒的英伟达神话不攻自破，DeepSeek的成功，让硅谷高管对算力不计成本的投入，一度集体遭到了投资者的质疑。</p>                        <footer>自 快科技</footer></article>",
    "summary": "最近，DeepSeek访问量急速增长，已成为日活跃用户最多的应用。三大电信企业和终端厂商纷纷接入DeepSeek，政府部门也开始部署。深圳龙岗区政务局率先上线DeepSeek-R1模型，成为广东首个政府单位采用该模型。DeepSeek的开源模式降低了AI应用门槛，预计政企级应用将大幅增长。在国内市场，DeepSeek已超越其他大模型，2025年1月成为月活跃用户最多的模型。其低成本和高性能令人印象深刻，挑战了传统AI公司的壁垒，引起了投资者的关注。",
    "tags": "DeepSeek、人工智能、开源模型、政务系统、用户量榜单、AI模型、技术闭源",
    "categories": []
  }
]
```

## Todo

- [ ] AI Categorization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
# Article Processor

[English](README.md) | 简体中文

Article Processor 是一个用于文章转载处理的工具，它能自动处理文章格式、本地化图片资源，并通过 AI 生成摘要、分类和标签。

## 功能特性

### 📝 内容处理

- 自动提取文章标题、正文和来源信息
- 智能优化文章格式（包括图片居中、样式规范化、清理冗余标签）
- 规范化处理文章引用和出处信息

### 🖼️ 图片处理

- 将远程图片资源下载并本地化存储
- 自动将 webp 格式图片转换为通用的 jpeg 格式
- 居中图片

### 🤖 AI 智能处理

- 自动生成文章摘要
- 生成内容总结
- 生成文章标签

### 🧠 AI 模型支持

- OpenAI
- Google AI Studio
- 支持自定义 API 端点

## 技术架构

### 接口

| 接口                     | 方法 | 描述                              |
| ------------------------ | ---- | --------------------------------- |
| /process                 | POST | 处理文章 URL 数组并返回 JSON 结果 |
| /processStatus/:jobId    | GET  | 获取任务处理状态和结果            |
| /downloadImage:imageName | GET  | 获取处理后的图片                  |

## 快速开始

### 安装

```bash
git clone https://github.com/elowenluo/article-processor.git
cd article-processor
npm install
```

### 配置

1. 复制环境变量模板文件

```bash
cp .env.example .env
```

2. 配置必要的环境变量

```bash
# 服务器访问地址，用于生成图片URL
HOST=http://localhost

# 服务运行端口
PORT=3000

# 最大同时处理子任务数量
MAX_CONCURRENT_TASKS=3

# 最大同时处理任务数量
MAX_CONCURRENT_JOBS=1
```

### 运行

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## API 使用实例

### 处理文章

发送 POST 请求到 /process 接口，传入要处理的文章 URL 数组和 AI 配置信息：

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

#### 自定义 API 端点

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

#### 响应示例：

```json
{
  "jobId": "ae587e58-350f-4303-8c59-9c67b09ec189",
  "status": "processing",
  "message": "Processing started. Check status at the URL below.",
  "statusUrl": "/processStatus/ae587e58-350f-4303-8c59-9c67b09ec189"
}
```

### 获取处理状态和结果

```bash
curl -X GET http://localhost:3000/processStatus/ae587e58-350f-4303-8c59-9c67b09ec189
```

#### 处理中响应示例：

```json
{
  "jobId": "ae587e58-350f-4303-8c59-9c67b09ec189",
  "status": "processing",
  "message": "Job is still processing",
  "createdAt": "2025-02-27T01:21:06.662Z",
  "updatedAt": "2025-02-27T01:21:06.662Z"
}
```

#### 已完成响应示例：

```json
[
  {
    "title": "DeepSeek成最快突破3000万日活应用程序：手机终端厂商抢着接入DeepSeek",
    "content": "<article><p>近日消息，据报道，近期DeepSeek访问使用量急速上升，<span><strong>已经成为目前最快突破3000万日活跃用户量的应用程序。</strong></span></p><p>与此同时，<strong>三家基础电信企业已全面接入国产开源大模型DeepSeek，手机、PC等终端厂商也在积极拥抱DeepSeek，</strong>一些地方政府也开始在政务系统部署DeepSeek。</p><p>比如深圳龙岗区政务服务和数据管理局已经在上线了Deepseek-R1全尺寸模型，成为广东首个在政务信创环境下部署该模型的政府部门单位。</p><p>业内人士表示，DeepSeek的开源模式大幅降低了人工智能进入各行业的门槛，相关的政府和企业级应用有望出现裂变式增长。</p><p>截至目前，在国内市场，DeepSeek直接刷新了豆包、Kimi和文心一言等国内大模型的用户量榜单，2025年1月，DeepSeek月均活跃用户数跃居第一。</p><p>据了解，DeepSeek以3%的成本做出了接近ChatGPT o1水平的模型。低成本便可调校出足够好的AI模型，也让技术闭源的OpenAI和用昂贵算力及CUDA生态拉高壁垒的英伟达神话不攻自破，DeepSeek的成功，让硅谷高管对算力不计成本的投入，一度集体遭到了投资者的质疑。</p><p><figure style=\"text-align: center;\"><img alt=\"DeepSeek成最快突破3000万日活应用程序：手机终端厂商抢着接入DeepSeek\" src=\"https://img1.mydrivers.com/img/20250214/s_a7bd92821ee94f4b9a6abc750efc604f.jpg\"></figure></p>                        <footer>自 快科技</footer></article>",
    "summary": "据报道，DeepSeek成为2025年最快突破3000万日活跃用户的应用程序，并刷新了国内大模型用户量榜单，于2025年1月跃居月均活跃用户数第一。三家基础电信企业、手机及PC终端厂商均已接入DeepSeek。例如，深圳龙岗区政务服务和数据管理局已在政务系统上线Deepseek-R1全尺寸模型，成为广东首个部署该模型的政府部门。DeepSeek以3%的成本实现了接近ChatGPT o1水平的模型效果，其开源模式或将推动政府和企业级应用的增长。",
    "tags": "DeepSeek、开源大模型、人工智能、AI应用、用户增长",
    "categories": ["人工智能", "数据智能", "移动应用"]
  }
]
```

#### 失败响应示例：

```json
{
  "jobId": "ae587e58-350f-4303-8c59-9c67b09ec189",
  "status": "failed",
  "error": "Failed to process article: Invalid URL or unsupported website",
  "createdAt": "2025-02-27T01:21:06.662Z",
  "updatedAt": "2025-02-27T01:21:06.662Z"
}
```

## 待完成功能

- [ ] 去除 Google 广告
- [ ] 支持更多内容源网站

## 开源协议

本项目基于 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解更多细节。

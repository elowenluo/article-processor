import path from "path";
import { Category } from "../types/article";

interface CategoryNode {
  name: string;
  path: string[];
  isLeaf: boolean;
}

export const INSTITUTION_PATTERNS = {
  IDC: /\bIDC\b|国际数据公司|\bInternational Data Corporation\b/,
  "Strategy Analytics": /\bStrategy Analytics\b/,
  TrendForce: /\bTrendForce\b|集邦咨询/,
  Counterpoint: /\bCounterpoint\b|\bCounterpoint Research\b/,
  Canalys: /\bCanalys\b/,
  CNNIC: /\bCNNIC\b|中国互联网络信息中心/,

  Android: /\bAndroid\b/,
  iPhone: /\biPhone\b/,
  iPad: /\biPad\b/,
  Kindle: /\bKindle\b/,
  "App Store": /\bApp Store\b/,
  "Google Play": /\bGoogle Play\b/,
  IaaS: /\bIaaS\b/,
  PaaS: /\bPaaS\b/,
  SaaS: /\bSaaS\b/,
  Chrome: /\bChrome\b/,
  Firefox: /\bFirefox\b/,
  Opera: /\bOpera\b/,
  Flickr: /\bFlickr\b/,
  Pinterest: /\bPinterest\b/,
};

export const CATEGORIES: Category[] = [
  {
    name: "生活数据",
    children: [
      {
        name: "影视票房数据",
        children: [],
      },
      {
        name: "智能家居",
        children: [],
      },
    ],
  },
  {
    name: "网络营销",
    children: [],
  },
  {
    name: "移动互联网",
    children: [
      {
        name: "移动设备",
        children: [
          {
            name: "平板电脑",
            children: [],
          },
          {
            name: "智能手机",
            children: [],
          },
        ],
      },
      {
        name: "移动应用",
        children: [],
      },
      {
        name: "智能硬件",
        children: [
          {
            name: "无人机",
            children: [],
          },
          {
            name: "智能手环",
            children: [],
          },
          {
            name: "智能手表",
            children: [],
          },
          {
            name: "虚拟现实（VR）",
            children: [],
          },
        ],
      },
    ],
  },
  {
    name: "战略新兴产业",
    children: [
      {
        name: "汽车行业",
        children: [],
      },
      {
        name: "新能源汽车产业",
        children: [],
      },
      {
        name: "智能汽车",
        children: [],
      },
      {
        name: "人工智能",
        children: [
          {
            name: "VR",
            children: [],
          },
          {
            name: "数据智能",
            children: [],
          },
          {
            name: "机器学习",
            children: [],
          },
        ],
      },
      {
        name: "芯片传感器",
        children: [],
      },
    ],
  },
  {
    name: "用户研究",
    children: [
      {
        name: "互联网用户",
        children: [],
      },
      {
        name: "手机网民",
        children: [],
      },
      {
        name: "消费者研究",
        children: [],
      },
    ],
  },
  {
    name: "投资&经济",
    children: [
      {
        name: "中国经济",
        children: [],
      },
      {
        name: "企业财务报告",
        children: [],
      },
      {
        name: "全球经济",
        children: [],
      },
      {
        name: "旅游经济",
        children: [
          {
            name: "航空数据",
            children: [],
          },
        ],
      },
    ],
  },
  {
    name: "电子商务",
    children: [
      {
        name: "B2B",
        children: [],
      },
      {
        name: "B2C",
        children: [],
      },
      {
        name: "团购",
        children: [],
      },
      {
        name: "旅行预订",
        children: [],
      },
      {
        name: "海淘",
        children: [],
      },
      {
        name: "物流",
        children: [],
      },
      {
        name: "移动电子商务",
        children: [],
      },
      {
        name: "网上支付",
        children: [],
      },
      {
        name: "网络购物",
        children: [
          {
            name: "中国市场",
            children: [],
          },
          {
            name: "日本市场",
            children: [],
          },
          {
            name: "欧洲",
            children: [],
          },
          {
            name: "美国市场",
            children: [],
          },
        ],
      },
    ],
  },
  {
    name: "社交网络",
    children: [
      {
        name: "SNS",
        children: [
          {
            name: "国内SNS",
            children: [],
          },
          {
            name: "日韩SNS市场",
            children: [],
          },
          {
            name: "美国SNS市场",
            children: [],
          },
        ],
      },
      {
        name: "即时通讯",
        children: [],
      },
      {
        name: "图片分享",
        children: [],
      },
      {
        name: "微博",
        children: [
          {
            name: "中国微博服务",
            children: [],
          },
          {
            name: "海外微博",
            children: [
              {
                name: "Twitter",
                children: [],
              },
            ],
          },
        ],
      },
      {
        name: "移动社区",
        children: [],
      },
      {
        name: "网络交友",
        children: [],
      },
      {
        name: "问答类网站",
        children: [],
      },
    ],
  },
  {
    name: "网络服务",
    children: [
      {
        name: "云计算",
        children: [],
      },
      {
        name: "硬件设备业",
        children: [
          {
            name: "BYOD",
            children: [],
          },
          {
            name: "MacBook",
            children: [],
          },
          {
            name: "PC",
            children: [],
          },
        ],
      },
      {
        name: "网络安全",
        children: [],
      },
      {
        name: "网络软件",
        children: [
          {
            name: "浏览器",
            children: [],
          },
        ],
      },
      {
        name: "电信产业",
        children: [],
      },
    ],
  },
  {
    name: "网络娱乐",
    children: [
      {
        name: "网络游戏",
        children: [
          {
            name: "社交游戏",
            children: [],
          },
          {
            name: "网页游戏",
            children: [],
          },
        ],
      },
      {
        name: "网络视频",
        children: [
          {
            name: "短视频",
            children: [],
          },
        ],
      },
      {
        name: "移动游戏",
        children: [],
      },
      {
        name: "互联网电视",
        children: [],
      },
    ],
  },
];

function flattenCategories(
  categories: Category[],
  parentPath: string[] = []
): CategoryNode[] {
  let result: CategoryNode[] = [];

  categories.forEach(category => {
    const currentPath = [...parentPath, category.name];
    if (category.children.length === 0) {
      result.push({
        name: category.name,
        path: currentPath,
        isLeaf: true,
      });
    } else {
      result.push({
        name: category.name,
        path: currentPath,
        isLeaf: false,
      });
      result = result.concat(flattenCategories(category.children, currentPath));
    }
  });

  return result;
}

export function categoriesToString(categories: Category[]): string {
  const result = JSON.stringify(flattenCategories(categories));
  return result;
}

import path from "path";
import fs from "fs";
import { Category, CategoryPattern } from "../types/article";
import dotenv from "dotenv";

dotenv.config();

// Get configuration path from environment variables or use default
const CONFIG_PATH =
  process.env.CATEGORY_CONFIG_PATH || path.join(process.cwd(), "config");

// Interface for category ID mapping from JSON file
interface CategoryIdMapping {
  category: string;
  id: number;
  class: string;
}

// Load files with error handling
function safeLoadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.warn(`Failed to load file ${filePath}:`, error);
  }
  return defaultValue;
}

// Default configurations if user doesn't provide them
const DEFAULT_PATTERNS: Record<string, RegExp> = {
  AI: /\bAI\b|\bML\b|人工智能|机器学习|深度学习|神经网络/,
  "Cloud Computing": /云计算|\bIaaS\b|\bPaaS\b|\bSaaS\b|云服务|云平台|云架构/,
  Mobile: /移动互联网|智能手机|\biPhone\b|\bAndroid\b|手机应用|移动应用/,
  "E-commerce": /电子商务|网上购物|电商平台|网购|在线零售|跨境电商/,
};

// Load category mappings
export function loadCategoryMappings(): Map<string, number> {
  const mappingFilePath = path.join(CONFIG_PATH, "category_mapping.json");
  const mappings = safeLoadJsonFile<CategoryIdMapping[]>(mappingFilePath, []);

  const categoryNameToIdMap = new Map<string, number>();
  mappings.forEach((mapping) => {
    categoryNameToIdMap.set(mapping.category, mapping.id);
  });

  return categoryNameToIdMap;
}

// Load regex patterns
export function loadCategoryPatterns(): Record<string, RegExp> {
  const patternsFilePath = path.join(CONFIG_PATH, "category_patterns.json");
  const patterns = safeLoadJsonFile<Record<string, string>>(
    patternsFilePath,
    {}
  );

  // Convert string patterns to RegExp objects
  const regexPatterns: Record<string, RegExp> = {};

  if (Object.keys(patterns).length > 0) {
    for (const [category, pattern] of Object.entries(patterns)) {
      try {
        regexPatterns[category] = new RegExp(pattern, "i");
      } catch (error) {
        console.warn(`Invalid regex pattern for category ${category}:`, error);
      }
    }
    return regexPatterns;
  }

  // Return default patterns if none provided
  return DEFAULT_PATTERNS;
}

// Load category hierarchy for AI-based categorization
export function loadCategoryHierarchy(): Category[] {
  const hierarchyFilePath = path.join(CONFIG_PATH, "category_hierarchy.json");
  return safeLoadJsonFile<Category[]>(hierarchyFilePath, []);
}

// Function to get category ID by name
export function getCategoryIdByName(categoryName: string): number | undefined {
  const mappings = loadCategoryMappings();
  return mappings.get(categoryName);
}

// Function to map category names to IDs
export function mapCategoriesToIds(categoryNames: string[]): number[] {
  const mappings = loadCategoryMappings();
  return categoryNames
    .map((name) => mappings.get(name))
    .filter((id): id is number => id !== undefined);
}

// Flatten categories for AI prompt
export function categoriesToString(categories: Category[]): string {
  function flattenCategories(
    categories: Category[],
    parentPath: string[] = []
  ): Array<{ name: string; path: string[]; isLeaf: boolean }> {
    let result: Array<{ name: string; path: string[]; isLeaf: boolean }> = [];

    categories.forEach((category) => {
      const currentPath = [...parentPath, category.name];
      if (!category.children || category.children.length === 0) {
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
        result = result.concat(
          flattenCategories(category.children, currentPath)
        );
      }
    });

    return result;
  }

  return JSON.stringify(flattenCategories(categories));
}

// Function to find categories by regex patterns
export function findCategoriesByPattern(text: string): string[] {
  const patterns = loadCategoryPatterns();
  const matchedCategories: string[] = [];

  for (const [category, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      matchedCategories.push(category);
    }
  }

  return matchedCategories;
}

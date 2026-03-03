const NOTION_API_KEY = import.meta.env.NOTION_API_KEY || process.env.NOTION_API_KEY;
const DATABASE_ID = "30ecde14-915c-81fd-a81a-e8d3b16aabc4";
const NOTION_VERSION = "2022-06-28";

if (!NOTION_API_KEY) {
  throw new Error("NOTION_API_KEY is not defined");
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedDate: string;
  imageUrl: string | null;
  status: string;
}

export interface BlogPostWithContent extends BlogPost {
  content: string;
}

interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

async function notionFetch(endpoint: string, body?: object) {
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getTextProperty(page: NotionPage, property: string): string {
  const prop = page.properties[property];
  if (prop?.type === "title") {
    return prop.title.map((t: any) => t.plain_text).join("") || "";
  }
  if (prop?.type === "rich_text") {
    return prop.rich_text.map((t: any) => t.plain_text).join("") || "";
  }
  return "";
}

function getSelectProperty(page: NotionPage, property: string): string {
  const prop = page.properties[property];
  if (prop?.type === "select" && prop.select) {
    return prop.select.name;
  }
  return "";
}

function getMultiSelectProperty(page: NotionPage, property: string): string[] {
  const prop = page.properties[property];
  if (prop?.type === "multi_select") {
    return prop.multi_select.map((s: any) => s.name);
  }
  return [];
}

function getDateProperty(page: NotionPage, property: string): string {
  const prop = page.properties[property];
  if (prop?.type === "date" && prop.date) {
    return prop.date.start;
  }
  return "";
}

function getUrlProperty(page: NotionPage, property: string): string | null {
  const prop = page.properties[property];
  if (prop?.type === "url") {
    return prop.url;
  }
  return null;
}

function pageToPost(page: NotionPage): BlogPost {
  return {
    id: page.id,
    title: getTextProperty(page, "Title"),
    slug: getTextProperty(page, "Slug"),
    excerpt: getTextProperty(page, "Excerpt"),
    category: getSelectProperty(page, "Category"),
    tags: getMultiSelectProperty(page, "Tags"),
    author: getSelectProperty(page, "Author"),
    publishedDate: getDateProperty(page, "Published Date"),
    imageUrl: getUrlProperty(page, "Image URL"),
    status: getSelectProperty(page, "Status"),
  };
}

function richTextToMarkdown(richText: any[]): string {
  return richText.map((text: any) => {
    let content = text.plain_text;
    if (text.annotations.bold) content = `**${content}**`;
    if (text.annotations.italic) content = `*${content}*`;
    if (text.annotations.code) content = `\`${content}\``;
    if (text.annotations.strikethrough) content = `~~${content}~~`;
    if (text.href) content = `[${content}](${text.href})`;
    return content;
  }).join("");
}

function blockToMarkdown(block: NotionBlock): string {
  const type = block.type;
  const data = block[type];

  switch (type) {
    case "paragraph":
      return richTextToMarkdown(data.rich_text) + "\n\n";
    case "heading_1":
      return `# ${richTextToMarkdown(data.rich_text)}\n\n`;
    case "heading_2":
      return `## ${richTextToMarkdown(data.rich_text)}\n\n`;
    case "heading_3":
      return `### ${richTextToMarkdown(data.rich_text)}\n\n`;
    case "bulleted_list_item":
      return `- ${richTextToMarkdown(data.rich_text)}\n`;
    case "numbered_list_item":
      return `1. ${richTextToMarkdown(data.rich_text)}\n`;
    case "quote":
      return `> ${richTextToMarkdown(data.rich_text)}\n\n`;
    case "code":
      return `\`\`\`${data.language || ""}\n${richTextToMarkdown(data.rich_text)}\n\`\`\`\n\n`;
    case "divider":
      return "---\n\n";
    case "image":
      const url = data.type === "external" ? data.external.url : data.file.url;
      const caption = data.caption?.length ? richTextToMarkdown(data.caption) : "";
      return `![${caption}](${url})\n\n`;
    default:
      return "";
  }
}

async function getPageBlocks(pageId: string): Promise<string> {
  const response = await notionFetch(`/blocks/${pageId}/children`);
  const blocks: NotionBlock[] = response.results;
  return blocks.map(blockToMarkdown).join("");
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const response = await notionFetch(`/databases/${DATABASE_ID}/query`, {
    filter: {
      property: "Status",
      select: {
        equals: "Published",
      },
    },
    sorts: [
      {
        property: "Published Date",
        direction: "descending",
      },
    ],
  });

  return response.results.map(pageToPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPostWithContent | null> {
  const response = await notionFetch(`/databases/${DATABASE_ID}/query`, {
    filter: {
      and: [
        {
          property: "Slug",
          rich_text: {
            equals: slug,
          },
        },
        {
          property: "Status",
          select: {
            equals: "Published",
          },
        },
      ],
    },
  });

  const page = response.results[0];
  if (!page) {
    return null;
  }

  const post = pageToPost(page);
  const content = await getPageBlocks(page.id);

  return {
    ...post,
    content,
  };
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts();
  return posts.map((post) => post.slug).filter(Boolean);
}

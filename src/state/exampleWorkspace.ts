import { createWorkspaceData } from "./workspaces";
import { createId } from "./storage";
import type { AppLanguage, WorkspaceData } from "../types";

export const EXAMPLE_DESKTOP_TEXT = {
  zh: { title: "看看示例桌面", description: "载入一个示例工作空间，看看图片、快捷按钮和提醒如何一起使用。所有内容都可以编辑或删除。", load: "载入示例桌面", skip: "从空白开始", workspace: "示例桌面", notes: "随手记录，慢慢整理。" },
  en: { title: "Explore an example desk", description: "Load an example workspace to see images, quick actions, and reminders together. You can edit or delete everything.", load: "Load example desk", skip: "Start with a blank desk", workspace: "Example desk", notes: "Capture ideas now, organize them later." },
} as const;

function screenshot(title: string, subtitle: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" rx="20" fill="${color}"/><rect x="52" y="42" width="536" height="316" rx="14" fill="#fff"/><circle cx="78" cy="68" r="5" fill="#e7aaa0"/><circle cx="96" cy="68" r="5" fill="#e7d29c"/><circle cx="114" cy="68" r="5" fill="#a9cbb2"/><rect x="80" y="104" width="110" height="9" rx="4" fill="#d8ddd9"/><text x="80" y="170" font-family="sans-serif" font-size="29" fill="#31443b">${title}</text><text x="80" y="204" font-family="sans-serif" font-size="16" fill="#84958b">${subtitle}</text><rect x="80" y="246" width="180" height="48" rx="8" fill="${color}"/><rect x="276" y="246" width="180" height="48" rx="8" fill="#f1f3ef"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createExampleWorkspace(language: AppLanguage): WorkspaceData {
  const zh = language === "zh";
  const workspace = createWorkspaceData(EXAMPLE_DESKTOP_TEXT[language].workspace, "", Date.now(), undefined, language);
  workspace.images = [
    screenshot("Ideas in progress", "A little space to think", "#e9eee7"),
    screenshot("A good day", "Make room for what matters", "#f3eae2"),
    screenshot("Reading list", "Keep the useful things close", "#e8edf1"),
  ].map((src) => ({ id: createId(), src, createdAt: Date.now() }));
  workspace.quickButtons = [
    { id: createId(), title: zh ? "搜索网页" : "Search the web", value: "https://www.google.com", type: "link", hidden: false },
    { id: createId(), title: zh ? "常用回复" : "Quick reply", value: zh ? "收到，谢谢！" : "Got it, thank you!", type: "text", hidden: false },
    { id: createId(), title: zh ? "维基百科" : "Wikipedia", value: "https://www.wikipedia.org", type: "link", hidden: false },
  ];
  const items = zh ? ["整理今天的想法", "回复一条消息", "留一点时间休息"] : ["Organize today's ideas", "Reply to a message", "Make time for a break"];
  workspace.todos[workspace.todoLists[0].id] = items.map((text) => ({ id: createId(), text, done: false }));
  workspace.spaces[0].lines = [{ text: EXAMPLE_DESKTOP_TEXT[language].notes, indent: 0 }];
  workspace.workspaceLines = workspace.spaces[0].lines.map((line) => ({ ...line }));
  return workspace;
}

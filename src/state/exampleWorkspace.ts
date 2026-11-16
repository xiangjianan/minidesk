import { createWorkspaceData } from "./workspaces";
import { createId } from "./storage";
import { DEFAULT_QUICK_LIST_ID } from "./quickLists";
import type { AppLanguage, LineItem, WorkspaceData } from "../types";
import seasidePhoto from "../example-seaside.jpg?inline";

import { EXAMPLE_DESKTOP_TEXT } from "./exampleDesktopText";

// Small, self-contained clippings stay available offline and are stored alongside
// ordinary pasted images; none of the example payloads enter localStorage.
function clipping(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function exampleClippings(zh: boolean): string[] {
  const map = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#e9eee6"/><path d="M410 0h230v420H330c52-65 31-99 68-142 47-55 22-103 12-147z" fill="#bdd9dd"/><path d="M0 115C120 90 182 158 285 132S414 92 456 55M0 307c110-48 165-20 251-69s135-50 202-16M158 0c10 80 44 112 24 183s-7 144 52 237" fill="none" stroke="#fff" stroke-width="12"/><path d="M43 246c94-15 150-78 213-72s84 44 138 16" fill="none" stroke="#d0ad72" stroke-width="5" stroke-dasharray="10 8"/><circle cx="389" cy="189" r="12" fill="#b65f4c" stroke="#fff" stroke-width="5"/><rect x="26" y="26" width="204" height="47" rx="10" fill="#fff"/><text x="44" y="56" font-family="sans-serif" font-size="18" fill="#43534b">${zh ? "选题素材 · 海边路线" : "Story research · coast"}</text><text x="397" y="221" font-family="sans-serif" font-size="17" fill="#506a68">${zh ? "海边咖啡馆" : "seaside café"}</text><text x="35" y="391" font-family="sans-serif" font-size="14" fill="#71817a">${zh ? "路线参考 · 待核对开放时间" : "Route reference · hours to verify"}</text></svg>`;
  const note = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#eee9e0"/><rect x="43" y="35" width="554" height="330" rx="4" fill="#fffcf6"/><text x="80" y="92" font-family="sans-serif" font-size="15" fill="#a17763" letter-spacing="3">WEEKEND NOTES / 01</text><text x="80" y="150" font-family="sans-serif" font-size="28" fill="#3e4840">${zh ? "海边周末指南：选题灵感" : "Coastal weekend guide: notes"}</text><path d="M80 176h480M80 229h480M80 282h480" stroke="#e6e5dc"/><text x="80" y="215" font-family="sans-serif" font-size="17" fill="#69766a">${zh ? "路线要轻松，地点不要太多" : "Keep the route easy and unhurried"}</text><text x="80" y="269" font-family="sans-serif" font-size="17" fill="#69766a">${zh ? "补充交通方式与营业时间" : "Add transport details and opening hours"}</text><text x="80" y="326" font-family="sans-serif" font-size="14" fill="#a17763">${zh ? "文章素材 · 待整理" : "Research clip · to be organized"}</text></svg>`;
  return [seasidePhoto, clipping(map), clipping(note)];
}

export function createExampleWorkspace(language: AppLanguage): WorkspaceData {
  const zh = language === "zh";
  const workspace = createWorkspaceData(EXAMPLE_DESKTOP_TEXT[language].workspace, "", Date.now(), undefined, language);
  workspace.isExample = true;
  workspace.images = exampleClippings(zh).map((src) => ({ id: createId(), src, createdAt: Date.now() }));
  const projectTagId = createId();
  workspace.quickTags.push({ id: projectTagId, title: zh ? "写作与发布" : "Writing & publishing", collapsed: false, column: 0 });
  workspace.quickButtons = [
    { id: createId(), title: zh ? "邮箱" : "Email", value: zh ? "https://mail.qq.com/" : "https://mail.google.com/", type: "link", tagId: DEFAULT_QUICK_LIST_ID, hidden: false },
    { id: createId(), title: zh ? "在线文档" : "Documents", value: zh ? "https://docs.qq.com/" : "https://docs.google.com/", type: "link", tagId: projectTagId, hidden: false },
    { id: createId(), title: zh ? "地图查地点" : "Find places", value: zh ? "https://map.baidu.com/" : "https://maps.google.com/", type: "link", tagId: projectTagId, hidden: false },
    { id: createId(), title: zh ? "约稿回复" : "Draft reply", value: zh ? "收到，我会先整理一版内容，完成后发你确认。" : "Thanks! I’ll put together a draft and send it over for your review.", type: "text", tagId: projectTagId, hidden: false },
    { id: createId(), title: zh ? "发布检查清单" : "Publishing checklist", value: zh ? "核对地点和营业时间 / 检查图片授权 / 补充来源 / 预览排版" : "Verify locations and hours / Check image rights / Add sources / Preview layout", type: "text", tagId: projectTagId, hidden: false },
  ];
  const today = zh ? ["完成海边周末指南的初稿", "给小林发路线，请她帮忙看看", "核对文中咖啡馆的营业时间"] : ["Finish the coastal weekend guide draft", "Send Sam the route for a second look", "Check the café’s opening hours"];
  const later = zh ? ["挑选封面图并标注图片来源", "发布后整理读者反馈"] : ["Choose a cover image and credit the source", "Collect reader feedback after publishing"];
  workspace.todoLists = [
    { ...workspace.todoLists[0], title: zh ? "今天" : "Today" },
    { id: createId(), title: zh ? "有空再做" : "Later", collapsed: false, compact: false, column: 0 },
  ];
  const reminderDate = (days: number, hour: number): number => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date.getTime();
  };
  workspace.todos = Object.fromEntries([today, later].map((items, listIndex) => [workspace.todoLists[listIndex].id, items.map((text, itemIndex) => ({
    id: createId(), text, done: false,
    ...(listIndex === 0 && itemIndex === 0 ? { notifyAt: reminderDate(3, 10) } : {}),
    ...(listIndex === 1 && itemIndex === 1 ? { notifyAt: reminderDate(14, 15) } : {}),
    ...(listIndex === 0 && itemIndex === 0 ? { starred: true } : {}),
  }))]));
  workspace.spaces[0].title = zh ? "文章草稿" : "Article draft";
  const noteLines = (zh ? [
    "选题：一份不赶路的海边周末指南", "",
    "读者：想短暂离开城市、又不想做太多攻略的人。",
    "路线：车站 → 海边步道 → 咖啡馆 → 看日落。", "",
    "待确认：交通时间、店铺营业时间和图片来源。",
    "开头思路：从车窗里第一次看到海写起。",
  ] : [
    "Story: a slow weekend by the sea", "",
    "For readers who want a short escape without the planning.",
    "Route: station → coastal walk → café → sunset.", "",
    "To verify: travel times, opening hours, and image credits.",
    "Opening idea: the first glimpse of the sea from the train.",
  ]).map((text): LineItem => ({ text, indent: 0 }));
  for (const [index, phrase, color] of (zh
    ? [[0, "不赶路的海边周末指南", "amber"], [5, "交通时间、店铺营业时间和图片来源", "green"]]
    : [[0, "a slow weekend by the sea", "amber"], [5, "travel times, opening hours, and image credits", "green"]]) as [number, string, "amber" | "green"][]) {
    const line = noteLines[index];
    const start = line.text.indexOf(phrase);
    if (start >= 0) line.marks = [{ type: "highlight", start, end: start + phrase.length, color }];
  }
  workspace.spaces[0].lines = noteLines;
  workspace.workspaceLines = noteLines.map((line) => ({ ...line, ...(line.marks ? { marks: line.marks.map((mark) => ({ ...mark })) } : {}) }));
  return workspace;
}

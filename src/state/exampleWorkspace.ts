import { createWorkspaceData } from "./workspaces";
import { createId } from "./storage";
import { DEFAULT_QUICK_LIST_ID } from "./quickLists";
import type { AppLanguage, WorkspaceData } from "../types";
import seasidePhoto from "../example-seaside.jpg?inline";

import { EXAMPLE_DESKTOP_TEXT } from "./exampleDesktopText";

// Small, self-contained clippings stay available offline and are stored alongside
// ordinary pasted images; none of the example payloads enter localStorage.
function clipping(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function exampleClippings(zh: boolean): string[] {
  const map = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#e9eee6"/><path d="M410 0h230v420H330c52-65 31-99 68-142 47-55 22-103 12-147z" fill="#bdd9dd"/><path d="M0 115C120 90 182 158 285 132S414 92 456 55M0 307c110-48 165-20 251-69s135-50 202-16M158 0c10 80 44 112 24 183s-7 144 52 237" fill="none" stroke="#fff" stroke-width="12"/><path d="M43 246c94-15 150-78 213-72s84 44 138 16" fill="none" stroke="#d0ad72" stroke-width="5" stroke-dasharray="10 8"/><circle cx="389" cy="189" r="12" fill="#b65f4c" stroke="#fff" stroke-width="5"/><rect x="26" y="26" width="204" height="47" rx="10" fill="#fff"/><text x="44" y="56" font-family="sans-serif" font-size="18" fill="#43534b">${zh ? "周末 · 海边路线" : "Weekend · coast route"}</text><text x="397" y="221" font-family="sans-serif" font-size="17" fill="#506a68">${zh ? "海边咖啡馆" : "seaside café"}</text><text x="35" y="391" font-family="sans-serif" font-size="14" fill="#71817a">${zh ? "收藏的路线 · 等天气好就出发" : "Saved route · waiting for good weather"}</text></svg>`;
  const note = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#eee9e0"/><rect x="43" y="35" width="554" height="330" rx="4" fill="#fffcf6"/><text x="80" y="92" font-family="sans-serif" font-size="15" fill="#a17763" letter-spacing="3">WEEKEND NOTES / 01</text><text x="80" y="150" font-family="sans-serif" font-size="28" fill="#3e4840">${zh ? "想在海边待一下午" : "An afternoon by the sea"}</text><path d="M80 176h480M80 229h480M80 282h480" stroke="#e6e5dc"/><text x="80" y="215" font-family="sans-serif" font-size="17" fill="#69766a">${zh ? "找一家有窗边座位的小店" : "Find a café with a window seat"}</text><text x="80" y="269" font-family="sans-serif" font-size="17" fill="#69766a">${zh ? "带相机，慢慢走，不赶行程" : "Bring the camera. Take the slow road."}</text><text x="80" y="326" font-family="sans-serif" font-size="14" fill="#a17763">${zh ? "灵感摘录 · 留给周末" : "A small idea for the weekend"}</text></svg>`;
  return [seasidePhoto, clipping(map), clipping(note)];
}

export function createExampleWorkspace(language: AppLanguage): WorkspaceData {
  const zh = language === "zh";
  const workspace = createWorkspaceData(EXAMPLE_DESKTOP_TEXT[language].workspace, "", Date.now(), undefined, language);
  workspace.isExample = true;
  workspace.images = exampleClippings(zh).map((src) => ({ id: createId(), src, createdAt: Date.now() }));
  const tripTagId = createId();
  workspace.quickTags.push({ id: tripTagId, title: zh ? "周末出走" : "Weekend away", collapsed: false, column: 0 });
  workspace.quickButtons = [
    { id: createId(), title: zh ? "邮箱" : "Email", value: "https://mail.google.com/", type: "link", tagId: DEFAULT_QUICK_LIST_ID, hidden: false },
    { id: createId(), title: zh ? "日历" : "Calendar", value: "https://calendar.google.com/", type: "link", tagId: DEFAULT_QUICK_LIST_ID, hidden: false },
    { id: createId(), title: zh ? "地图" : "Maps", value: zh ? "https://map.baidu.com/" : "https://maps.google.com/", type: "link", tagId: tripTagId, hidden: false },
    { id: createId(), title: zh ? "查车票" : "Train tickets", value: zh ? "https://www.12306.cn/" : "https://www.thetrainline.com/", type: "link", tagId: tripTagId, hidden: false },
    { id: createId(), title: zh ? "出门清单" : "Packing list", value: zh ? "相机、电池、充电线、防晒、耳机" : "Camera, batteries, charger, sunscreen, headphones", type: "text", tagId: tripTagId, hidden: false },
  ];
  const today = zh ? ["把周末的车票订了", "回复小林：周五前确认时间", "下班路上买咖啡豆"] : ["Book the train for the weekend", "Reply to Sam about Friday", "Pick up coffee beans on the way home"];
  const later = zh ? ["看看海边那家咖啡馆的营业时间", "整理相机里的照片"] : ["Check the seaside café's opening hours", "Sort through the photos on my camera"];
  workspace.todoLists = [
    { ...workspace.todoLists[0], title: zh ? "今天" : "Today" },
    { id: createId(), title: zh ? "有空再做" : "Later", collapsed: false, compact: false, column: 0 },
  ];
  workspace.todos = Object.fromEntries([today, later].map((items, index) => [workspace.todoLists[index].id, items.map((text) => ({ id: createId(), text, done: false }))]));
  workspace.spaces[0].title = zh ? "周末计划" : "Weekend plans";
  workspace.spaces[0].lines = (zh ? ["想去海边待两天，不把行程排太满。", "", "周六：早一点出发，找家小店吃午饭。", "下午沿海边走走，天气好就看日落。", "", "还没定：住一晚还是当天回来？", "问问小林有没有想去的地方。"] : ["Two days by the sea, with plenty of room to wander.", "", "Saturday: leave early and find a small place for lunch.", "Walk along the coast; catch the sunset if it's clear.", "", "Still deciding: stay overnight or come home?", "Ask Sam if there's anywhere they'd like to go."]).map((text) => ({ text, indent: 0 }));
  workspace.workspaceLines = workspace.spaces[0].lines.map((line) => ({ ...line }));
  return workspace;
}

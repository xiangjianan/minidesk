/**
 * Hand-curated release notes, newest version first.
 *
 * Curation policy — only significant, user-facing updates are recorded:
 * new features, and major changes/optimizations users will clearly notice.
 * Tiny changes (small style tweaks, minor fixes) are intentionally omitted.
 * Prefix each note with its change type: 新增 / 优化 / 修复 (New / Improved / Fixed).
 * Keep each bullet short; adjacent minor releases are merged into their
 * newest version's entry. The newest entry's version must always equal the
 * current app version — a release with nothing significant to record merges
 * into the top entry and bumps its version label.
 *
 * Older history is consolidated: releases from the same era are folded into
 * one entry labeled with that era's newest version, holding a few summary
 * bullets instead of per-release detail. Fold entries upward the same way
 * whenever this list grows unwieldy again.
 *
 * The release skill appends a new entry at the top of `CHANGELOG` for each
 * release that carries significant changes (and skips trivial ones).
 *
 * `date` is the release date in ISO `YYYY-MM-DD`. `notes` carries per-language
 * bullet points; pick the list for the active language at render time.
 */

export interface ChangelogEntryNotes {
  zh: string[];
  en: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: ChangelogEntryNotes;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1.29",
    date: "2026-11-06",
    notes: {
      zh: [
        "新增：导出工作空间时可选择需要的区域，导入同名空间时可合并现有内容",
        "优化：重新整理发版记录，呈现 Mini Desk 的主要功能与发展历程",
      ],
      en: [
        "New: Choose which areas to export and merge imports into an existing workspace",
        "Improved: Reorganized release history to highlight Mini Desk's major features and evolution",
      ],
    },
  },
  {
    version: "1.1.28",
    date: "2026-11-05",
    notes: {
      zh: [
        "优化：快捷动作升级为可自定义颜色的持久分组，支持跨组拖拽整理",
        "优化：完善提醒、贴图与快捷动作的拖拽排序、粘贴和菜单操作",
      ],
      en: [
        "Improved: Quick actions now live in persistent, customizable color groups and can be dragged between groups",
        "Improved: Refined sorting, pasting, and menus for reminders, images, and quick actions",
      ],
    },
  },
  {
    version: "1.1.12",
    date: "2026-10-23",
    notes: {
      zh: [
        "新增：可一键清理所有列表的已完成提醒，快捷动作支持按类型复制内容",
        "新增：拖拽排序显示实时落位预览，也可以拖入折叠的分组",
      ],
      en: [
        "New: Clear completed reminders across all lists at once and copy quick-action details by type",
        "New: See a live drop preview while sorting and drop items into collapsed groups",
      ],
    },
  },
  {
    version: "1.1.8",
    date: "2026-10-15",
    notes: {
      zh: [
        "新增：提醒可以拖入快捷动作或记事本，快捷动作显示使用次数",
        "新增：顶栏可快速切换浅色、深色与跟随系统外观",
      ],
      en: [
        "New: Drag reminders into quick actions or the notebook; quick actions show usage counts",
        "New: Switch between light, dark, and system appearance from the header",
      ],
    },
  },
  {
    version: "1.0.209",
    date: "2026-10-11",
    notes: {
      zh: [
        "优化：提醒列表支持多列布局，工作台各区宽度可按工作空间调整",
      ],
      en: [
        "Improved: Arrange reminder lists in columns and adjust panel widths per workspace",
      ],
    },
  },
  {
    version: "1.0.200",
    date: "2026-10-02",
    notes: {
      zh: [
        "新增：「现在做这个」专注模式，围绕单条提醒计时、记事和添加贴图",
        "优化：智能粘贴和手机速记可识别时间，生成定时提醒",
      ],
      en: [
        "New: Do it now focus mode with a timer, notes, and images for an individual reminder",
        "Improved: Smart paste and mobile capture can recognize times and create scheduled reminders",
      ],
    },
  },
  {
    version: "1.0.190",
    date: "2026-09-24",
    notes: {
      zh: [
        "新增：记事本支持高亮、文字颜色、下划线和删除线等标注",
        "优化：智能粘贴扩展到快捷动作，AI 润色支持多种表达风格",
        "优化：快捷动作支持紧凑显示与分组布局，提醒可拖入记事本",
      ],
      en: [
        "New: Mark up notebook text with highlights, colors, underlines, and strikethrough",
        "Improved: Smart paste expanded to quick actions, with multiple AI polishing styles",
        "Improved: Quick actions gained compact and grouped layouts; reminders can be dragged into the notebook",
      ],
    },
  },
  {
    version: "1.0.162",
    date: "2026-08-31",
    notes: {
      zh: [
        "新增：智能粘贴和 AI 润色，帮助整理便签与提醒内容",
      ],
      en: [
        "New: smart paste and AI polishing to help organize notes and reminders",
      ],
    },
  },
  {
    version: "1.0.156",
    date: "2026-08-29",
    notes: {
      zh: [
        "新增：手机速记支持扫码配对，将临时想法发送到电脑的提醒或便签",
        "新增：工作台可安装并离线使用；工作空间之间可以移动内容",
      ],
      en: [
        "New: Pair a phone by QR code to send quick captures to desktop reminders or notes",
        "New: Install the workbench for offline use and move content between workspaces",
      ],
    },
  },
  {
    version: "1.0.120",
    date: "2026-08-10",
    notes: {
      zh: [
        "新增：快捷动作支持打开本地应用，提醒提供快捷时间预设",
        "新增：每个工作空间可自定义显示区域，并支持导入和导出",
      ],
      en: [
        "New: Quick actions can open local apps, and reminders offer time presets",
        "New: Customize visible areas per workspace and import or export workspaces",
      ],
    },
  },
  {
    version: "1.0.103",
    date: "2026-08-02",
    notes: {
      zh: [
        "新增：多个独立工作空间，按不同场景组织内容",
        "新增：全局搜索，快速查找工作台中的内容",
      ],
      en: [
        "New: independent workspaces to organize content for different contexts",
        "New: global search to find content across the workbench",
      ],
    },
  },
  {
    version: "1.0.70",
    date: "2026-06-13",
    notes: {
      zh: [
        "新增：图片编辑和预览工具、快捷动作标签管理及实用工具面板",
        "新增：多标签页写入保护，减少同时打开工作台造成的数据冲突",
      ],
      en: [
        "New: image editing and preview tools, quick-action tag management, and utilities",
        "New: protection against conflicting saves across browser tabs",
      ],
    },
  },
  {
    version: "1.0.45",
    date: "2026-06-06",
    notes: {
      zh: [
        "新增：Mini Desk 从待办看板成长为桌面工作台，集贴图、记事、快捷动作与提醒于一处",
        "新增：支持自定义提醒列表、截止时间与通知，还有可切换主题的陪伴 GIF",
      ],
      en: [
        "New: Mini Desk grew from a to-do board into a workbench for images, notes, quick actions, and reminders",
        "New: customizable reminder lists, deadlines and notifications, and companion GIF themes",
      ],
    },
  },
];

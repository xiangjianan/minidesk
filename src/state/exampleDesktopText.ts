export const EXAMPLE_DESKTOP_TEXT = {
  zh: { title: "看看示例桌面", description: "载入一个示例工作空间，看看图片、快捷按钮和提醒如何一起使用。所有内容都可以编辑或删除。", load: "载入示例桌面", skip: "从空白开始", workspace: "示例桌面", repeatTitle: "再载入一份示例桌面？", repeatDescription: "你已经载入过示例桌面。再次载入会新建一份，原来的内容不会改变。", repeatConfirm: "载入新示例" },
  en: { title: "Explore an example desk", description: "Load an example workspace to see images, quick actions, and reminders together. You can edit or delete everything.", load: "Load example desk", skip: "Start with a blank desk", workspace: "Example desk", repeatTitle: "Load another example desk?", repeatDescription: "You already have an example desk. Loading another creates a new workspace and keeps the existing one unchanged.", repeatConfirm: "Load new example" },
} as const;

/** Recognize examples cleared by older versions that discarded their marker. */
export function hasExampleWorkspace(workspaces: Array<{ isExample?: true; customTitles: Record<string, string> }>): boolean {
  return workspaces.some((workspace) => {
    if (workspace.isExample) return true;
    const title = workspace.customTitles["board-title"]?.trim();
    return Object.values(EXAMPLE_DESKTOP_TEXT).some(({ workspace: name }) =>
      title === name || Boolean(title?.startsWith(`${name} `) && /^[2-9]\d*$|^1\d+$/.test(title.slice(name.length + 1))),
    );
  });
}

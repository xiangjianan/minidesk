import { describe, expect, it } from "vitest";
import { createExampleWorkspace } from "../state/exampleWorkspace";
import { hasExampleWorkspace } from "../state/exampleDesktopText";
import { buildVisibleQuickButtonGroups } from "../state/quickButtons";
import { defaultWorkspace } from "../state/defaults";
import { getSerializableWorkspace, normalizeWorkspaceData } from "../state/storage";

describe("example workspace", () => {
  it("recognizes marked and previously cleared examples in either language", () => {
    const named = (title: string) => ({ ...defaultWorkspace(), customTitles: { "board-title": title } });
    expect(hasExampleWorkspace([{ ...named("Renamed"), isExample: true }])).toBe(true);
    expect(hasExampleWorkspace([named("示例桌面"), named("Example desk 12")])).toBe(true);
    expect(hasExampleWorkspace([named("Example desk 2")])).toBe(true);
    expect(hasExampleWorkspace([named("示例桌面 1")])).toBe(false);
    expect(hasExampleWorkspace([named("My desk")])).toBe(false);
  });

  it.each(["zh", "en"] as const)("creates editable example content in %s", (language) => {
    const workspace = createExampleWorkspace(language);
    expect(workspace.isExample).toBe(true);
    expect(normalizeWorkspaceData(getSerializableWorkspace({ ...workspace, customTitles: { "board-title": "Renamed" } })).isExample).toBe(true);
    expect(normalizeWorkspaceData({ ...workspace, isExample: "true" }).isExample).toBeUndefined();
    expect(workspace.images).toHaveLength(3);
    expect(workspace.images.every((image) => image.src?.startsWith("data:image/"))).toBe(true);
    expect(workspace.quickButtons).toHaveLength(5);
    expect(workspace.quickButtons.filter((button) => button.type === "link")).toHaveLength(3);
    expect(workspace.quickButtons.filter((button) => button.type === "text")).toHaveLength(2);
    const groups = buildVisibleQuickButtonGroups(workspace.quickButtons, workspace.quickTags, false, "General", false);
    expect(groups).toHaveLength(2);
    expect(groups.flatMap((group) => group.buttons)).toHaveLength(5);
    const todos = Object.values(workspace.todos).flat();
    expect(todos).toHaveLength(5);
    const timed = todos.filter((todo) => todo.notifyAt && todo.notifyAt > Date.now());
    expect(timed).toHaveLength(2);
    expect(timed[1].notifyAt! - timed[0].notifyAt!).toBeGreaterThan(9 * 24 * 60 * 60 * 1000);
    expect(todos.some((todo) => todo.starred && todo.notifyAt)).toBe(true);
    const marks = workspace.spaces[0].lines.flatMap((line) => (line.marks ?? []).map((mark) => ({ line, mark })));
    expect(marks).toHaveLength(2);
    expect(marks.every(({ line, mark }) => mark.type === "highlight" && mark.start >= 0 && mark.end <= line.text.length && mark.end > mark.start)).toBe(true);
    expect(normalizeWorkspaceData(getSerializableWorkspace(workspace), language).spaces[0].lines).toEqual(workspace.spaces[0].lines);
    expect(workspace.spaces[0].lines).toEqual(workspace.workspaceLines);
    expect(getSerializableWorkspace(workspace).images.every((image) => !image.src)).toBe(true);
    const blank = defaultWorkspace(undefined, language);
    expect(blank.images).toHaveLength(0);
    expect(blank.quickButtons).toHaveLength(0);
    expect(Object.values(blank.todos).flat()).toHaveLength(0);
  });
});

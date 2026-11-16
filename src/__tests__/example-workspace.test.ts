import { describe, expect, it } from "vitest";
import { createExampleWorkspace } from "../state/exampleWorkspace";
import { buildVisibleQuickButtonGroups } from "../state/quickButtons";
import { defaultWorkspace } from "../state/defaults";
import { getSerializableWorkspace, normalizeWorkspaceData } from "../state/storage";

describe("example workspace", () => {
  it.each(["zh", "en"] as const)("creates editable example content in %s", (language) => {
    const workspace = createExampleWorkspace(language);
    expect(workspace.isExample).toBe(true);
    expect(normalizeWorkspaceData(getSerializableWorkspace({ ...workspace, customTitles: { "board-title": "Renamed" } })).isExample).toBe(true);
    expect(normalizeWorkspaceData({ ...workspace, isExample: "true" }).isExample).toBeUndefined();
    expect(workspace.images).toHaveLength(3);
    expect(workspace.images.every((image) => image.src?.startsWith("data:image/"))).toBe(true);
    expect(workspace.quickButtons).toHaveLength(5);
    const groups = buildVisibleQuickButtonGroups(workspace.quickButtons, workspace.quickTags, false, "General", false);
    expect(groups).toHaveLength(2);
    expect(groups.flatMap((group) => group.buttons)).toHaveLength(5);
    expect(Object.values(workspace.todos).flat()).toHaveLength(5);
    expect(workspace.spaces[0].lines).toEqual(workspace.workspaceLines);
    expect(getSerializableWorkspace(workspace).images.every((image) => !image.src)).toBe(true);
    const blank = defaultWorkspace(undefined, language);
    expect(blank.images).toHaveLength(0);
    expect(blank.quickButtons).toHaveLength(0);
    expect(Object.values(blank.todos).flat()).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { createExampleWorkspace } from "../state/exampleWorkspace";
import { defaultWorkspace } from "../state/defaults";
import { getSerializableWorkspace } from "../state/storage";

describe("example workspace", () => {
  it.each(["zh", "en"] as const)("creates editable example content in %s", (language) => {
    const workspace = createExampleWorkspace(language);
    expect(workspace.images).toHaveLength(3);
    expect(workspace.images.every((image) => image.src?.startsWith("data:image/svg+xml"))).toBe(true);
    expect(workspace.quickButtons).toHaveLength(3);
    expect(Object.values(workspace.todos).flat()).toHaveLength(3);
    expect(workspace.spaces[0].lines).toEqual(workspace.workspaceLines);
    expect(getSerializableWorkspace(workspace).images.every((image) => !image.src)).toBe(true);
    const blank = defaultWorkspace(undefined, language);
    expect(blank.images).toHaveLength(0);
    expect(blank.quickButtons).toHaveLength(0);
    expect(Object.values(blank.todos).flat()).toHaveLength(0);
  });
});

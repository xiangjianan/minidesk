import { describe, expect, it } from "vitest";
import type { TodoMap } from "../types";
import { getTodoReorderTarget, getTodoDropMoveTarget, moveTodo } from "../state/todos";

describe("getTodoReorderTarget — Ctrl+Up/Down 换算为 moveTodo 落位目标", () => {
  const todos = [
    { id: "a", text: "a", done: false },
    { id: "b", text: "b", done: false },
    { id: "c", text: "c", done: false },
  ];

  it("上移：目标是上一个同组成员（插到它前面 = 交换）", () => {
    expect(getTodoReorderTarget(todos, "b", -1)).toEqual({ targetId: "a" });
  });

  it("下移：目标是下一个同组成员（moveTodo 落在其原索引之后）", () => {
    expect(getTodoReorderTarget(todos, "a", 1)).toEqual({ targetId: "b" });
  });

  it("下移到组内末尾：返回 null", () => {
    expect(getTodoReorderTarget(todos, "c", 1)).toBeNull();
  });

  it("组边界返回 null（无操作）", () => {
    expect(getTodoReorderTarget(todos, "a", -1)).toBeNull();
    expect(getTodoReorderTarget(todos, "missing", 1)).toBeNull();
  });

  it("不跨越 完成/星标 分组边界", () => {
    const mixed = [
      { id: "s", text: "s", done: false, starred: true },
      { id: "o", text: "o", done: false },
      { id: "d", text: "d", done: true },
    ];
    expect(getTodoReorderTarget(mixed, "s", 1)).toBeNull();
    expect(getTodoReorderTarget(mixed, "d", -1)).toBeNull();
    expect(getTodoReorderTarget(mixed, "o", -1)).toBeNull();
  });

  it("星标组内同样可移动", () => {
    const starred = [
      { id: "s1", text: "s1", done: false, starred: true },
      { id: "s2", text: "s2", done: false, starred: true },
      { id: "o1", text: "o1", done: false },
    ];
    expect(getTodoReorderTarget(starred, "s1", 1)).toStrictEqual({ targetId: "s2" });
  });
});

describe("drag insertion boundaries", () => {
  const todos: TodoMap = { morning: ["1", "2", "3", "4", "5"].map(id => ({ id, text: id, done: false })), noon: [] };
  it.each([
    ["1", "5", "23415"], // Below fourth, above fifth.
    ["1", "4", "23145"], // Above fourth.
    ["1", "2", "12345"], // Adjacent boundary is a no-op.
    ["1", undefined, "23451"], // Below the last item.
    ["5", "2", "15234"], // Moving upward.
    ["3", "3", "12345"], // Dropping onto itself.
  ])("moves %s before %s without skipping an item", (id, beforeId, expected) => {
    const target = getTodoDropMoveTarget(todos, "morning", id, "morning", beforeId);
    expect(moveTodo(todos, "morning", id, "morning", target).morning.map(todo => todo.id).join("")).toBe(expected);
  });
  it("keeps the insertion anchor when moving between lists", () => {
    const lists = { ...todos, noon: [{ id: "x", text: "x", done: false }] };
    const target = getTodoDropMoveTarget(lists, "morning", "1", "noon", "x");
    expect(moveTodo(lists, "morning", "1", "noon", target).noon.map(todo => todo.id)).toEqual(["1", "x"]);
  });
});

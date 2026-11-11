import { describe, expect, it } from 'vitest';
import { guardSelectionOrigin } from '../utils/selectionOrigin';

describe('selection drag origin', () => {
  it('limits selection to the panel where a primary mouse drag begins and resets afterward', () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = '<main class="workbench-shell"><div class="quick"></div><section class="text-panel"><textarea class="text-editor-textarea"></textarea></section><section class="todo-panel"><header class="heading"><h2>提醒事项</h2></header><input class="todo-input"></section></main>';
    guardSelectionOrigin(doc);
    const down = (selector: string) => doc.querySelector(selector)!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    down('.quick');
    expect(doc.documentElement.classList.contains('selection-outside-notes')).toBe(true);
    expect(doc.documentElement.classList.contains('selection-outside-todos')).toBe(true);
    const selection = new Event('selectstart', { bubbles: true, cancelable: true });
    expect(doc.querySelector('.quick')!.dispatchEvent(selection)).toBe(false);
    doc.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(doc.documentElement.className).toBe('');
    down('textarea');
    expect(doc.documentElement.classList.contains('selection-outside-notes')).toBe(false);
    expect(doc.documentElement.classList.contains('selection-outside-todos')).toBe(true);
    expect(doc.querySelector('textarea')!.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true }))).toBe(true);
    down('.heading');
    expect(doc.documentElement.classList.contains('selection-outside-notes')).toBe(true);
    expect(doc.documentElement.classList.contains('selection-outside-todos')).toBe(true);
    expect(doc.querySelector('.heading')!.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true }))).toBe(false);
    down('.todo-input');
    expect(doc.documentElement.classList.contains('selection-outside-notes')).toBe(true);
    expect(doc.documentElement.classList.contains('selection-outside-todos')).toBe(false);
  });
});

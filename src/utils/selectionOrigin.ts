/** Keep a mouse drag from selecting editor text in a panel it did not start in. */
export function guardSelectionOrigin(doc: Document): void {
  const root = doc.documentElement;
  let blockBlankSelection = false;
  const clear = () => {
    root.classList.remove('selection-outside-notes', 'selection-outside-todos');
    blockBlankSelection = false;
  };
  doc.addEventListener('mousedown', (event) => {
    clear();
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (!event.target.closest('.text-editor-textarea')) root.classList.add('selection-outside-notes');
    if (!event.target.closest('.todo-input, .today-focus-input')) root.classList.add('selection-outside-todos');
    const target = event.target;
    const editable = target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])');
    const hasDirectText = Array.from(target.childNodes).some(node => node.nodeType === 3 && node.textContent?.trim());
    blockBlankSelection = Boolean(target.closest('.workbench-shell') && !editable && !hasDirectText);
    const active = doc.activeElement;
    if (blockBlankSelection && !target.closest('button, a, [role="button"], [role="menu"], [role="menuitem"]') &&
        (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) &&
        active.matches('.text-editor-textarea, .todo-input, .today-focus-input') &&
        active.selectionStart !== active.selectionEnd) {
      const caret = active.selectionStart ?? 0;
      active.setSelectionRange(caret, caret);
      active.dispatchEvent(new Event('select', { bubbles: true }));
    }
  }, true);
  doc.addEventListener('selectstart', (event) => {
    if (blockBlankSelection) event.preventDefault();
  }, true);
  doc.addEventListener('mouseup', clear, true);
  doc.defaultView?.addEventListener('blur', clear);
  doc.addEventListener('dragend', clear, true);
}

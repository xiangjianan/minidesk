import { onBeforeUnmount, ref } from "vue";

export function useStyledConfirm() {
  const confirmVisible = ref(false);
  let pending: ((accepted: boolean) => void) | undefined;
  function resolveConfirm(accepted: boolean): void {
    confirmVisible.value = false;
    const resolve = pending;
    pending = undefined;
    resolve?.(accepted);
  }
  function requestConfirm(): Promise<boolean> {
    if (pending) return Promise.resolve(false);
    confirmVisible.value = true;
    return new Promise((resolve) => { pending = resolve; });
  }
  onBeforeUnmount(() => resolveConfirm(false));
  return { confirmVisible, requestConfirm, resolveConfirm };
}

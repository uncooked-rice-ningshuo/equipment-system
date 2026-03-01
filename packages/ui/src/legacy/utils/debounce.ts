export type DebouncedFunction<TArgs extends any[]> = ((
  ...args: TArgs
) => void) & {
  cancel: () => void;
};

export function debounce<TArgs extends any[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  wait: number,
): DebouncedFunction<TArgs> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void fn(...args);
    }, wait);
  }) as DebouncedFunction<TArgs>;

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}

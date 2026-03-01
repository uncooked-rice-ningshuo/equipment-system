import { createContext, ReactNode, useContext } from 'react';

type NavigateFn = (path: string) => void;

const LegacyRouterContext = createContext<NavigateFn | null>(null);

export function LegacyRouterProvider({
  navigate,
  children,
}: {
  navigate: NavigateFn;
  children: ReactNode;
}) {
  return (
    <LegacyRouterContext.Provider value={navigate}>
      {children}
    </LegacyRouterContext.Provider>
  );
}

export function useLegacyNavigate() {
  const navigate = useContext(LegacyRouterContext);
  if (!navigate) {
    throw new Error(
      'useLegacyNavigate must be used within LegacyRouterProvider',
    );
  }
  return navigate;
}

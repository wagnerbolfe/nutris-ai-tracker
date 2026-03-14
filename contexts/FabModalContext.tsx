import React, { createContext, useContext, useRef } from 'react';

type FabModalContextType = {
  openFabModal: () => void;
  registerOpen: (fn: () => void) => void;
};

const FabModalContext = createContext<FabModalContextType>({
  openFabModal: () => {},
  registerOpen: () => {},
});

export function FabModalProvider({ children }: { children: React.ReactNode }) {
  const openFnRef = useRef<(() => void) | null>(null);

  const registerOpen = (fn: () => void) => {
    openFnRef.current = fn;
  };

  const openFabModal = () => {
    openFnRef.current?.();
  };

  return (
    <FabModalContext.Provider value={{ openFabModal, registerOpen }}>
      {children}
    </FabModalContext.Provider>
  );
}

export function useFabModal() {
  return useContext(FabModalContext);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const PromoContext = createContext();

export function PromoProvider({ children }) {
  const [promoEnabled, setPromoEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("promoEnabled").then((val) => {
        console.log(val)
      if (val !== null) setPromoEnabled(val === "true");
    });
  }, []);

  function togglePromo() {
    setPromoEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem("promoEnabled", String(next));
      return next;
    });
  }

  return (
    <PromoContext.Provider value={{ promoEnabled, togglePromo }}>
      {children}
    </PromoContext.Provider>
  );
}

export function usePromo() {
  return useContext(PromoContext);
}

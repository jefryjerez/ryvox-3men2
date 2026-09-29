"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";

/** Vacía el carrito al llegar a la confirmación (también tras la redirección de Stripe). */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

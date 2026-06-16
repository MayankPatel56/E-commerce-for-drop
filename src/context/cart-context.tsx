"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  variantDescription: string; // e.g. "Size: M, Color: Black"
  price: number;
  quantity: number;
  imageUrl: string;
  stockAvailable: number;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { variantId: number } }
  | { type: "UPDATE_QUANTITY"; payload: { variantId: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartItem[] };

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  cartTotal: number;
}

// ─── Context ────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "indicore_cart";

// ─── Reducer ────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingIndex = state.items.findIndex(
        (i) => i.variantId === action.payload.variantId
      );
      if (existingIndex >= 0) {
        const existing = state.items[existingIndex];
        const newQuantity = Math.min(
          existing.quantity + action.payload.quantity,
          existing.stockAvailable
        );
        const newItems = [...state.items];
        newItems[existingIndex] = { ...existing, quantity: newQuantity };
        return { ...state, items: newItems };
      }
      const cappedItem = {
        ...action.payload,
        quantity: Math.min(action.payload.quantity, action.payload.stockAvailable),
      };
      return { ...state, items: [...state.items, cappedItem] };
    }

    case "REMOVE_ITEM": {
      return { ...state, items: state.items.filter((i) => i.variantId !== action.payload.variantId) };
    }

    case "UPDATE_QUANTITY": {
      return {
        ...state,
        items: state.items.map((i) =>
          i.variantId === action.payload.variantId
            ? {
                ...i,
                quantity: Math.max(0, Math.min(action.payload.quantity, i.stockAvailable)),
              }
            : i
        ),
      };
    }

    case "CLEAR_CART": {
      return { ...state, items: [] };
    }

    case "HYDRATE": {
      return { items: action.payload, hydrated: true };
    }

    default:
      return state;
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false });
  const persistRef = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        dispatch({ type: "HYDRATE", payload: items });
      } else {
        dispatch({ type: "HYDRATE", payload: [] });
      }
    } catch {
      dispatch({ type: "HYDRATE", payload: [] });
    }
    // Mark persistence as active after first hydration
    persistRef.current = true;
  }, []);

  // Persist to localStorage on every change (after hydration)
  const prevItemsRef = useRef(state.items);
  useEffect(() => {
    if (!persistRef.current) return;
    // Only persist if items actually changed (not during hydration)
    if (prevItemsRef.current !== state.items) {
      prevItemsRef.current = state.items;
      if (state.items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      }
    }
  });

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const removeItem = useCallback((variantId: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { variantId } });
  }, []);

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { variantId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.hydrated ? state.items : [],
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
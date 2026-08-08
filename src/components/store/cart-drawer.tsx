"use client";

import { ShoppingCart, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Heart, Truck, Shield, X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart, type CartItem } from "@/context/cart-context";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

const FREE_SHIPPING_THRESHOLD = 499;

export function CartDrawer({ open, onOpenChange, onNavigate }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, cartTotal } = useCart();

  const handleContinueShopping = () => {
    onOpenChange(false);
    onNavigate("shop");
  };

  const handleCheckout = () => {
    onOpenChange(false);
    onNavigate("checkout");
  };

  const shippingProgress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const total = cartTotal;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:w-[420px] w-full flex flex-col p-0 bg-gradient-to-b from-background to-muted/5"
      >
        <SheetHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/5 to-transparent border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="relative">
                <ShoppingCart className="size-6 text-primary" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </div>
              Your Cart
            </SheetTitle>
            <SheetClose className="rounded-full p-2 hover:bg-muted transition-colors">
              <X className="size-4" />
            </SheetClose>
          </div>
          {totalItems > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
              <ShoppingCart className="size-20 text-muted-foreground/30 relative" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground">
                Your cart is empty
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Looks like you haven't added any items yet. Start shopping to fill your cart!
              </p>
            </div>
            <Button
              variant="default"
              className="min-h-[48px] px-8 rounded-full shadow-lg shadow-primary/20"
              onClick={handleContinueShopping}
            >
              <ShoppingBag className="size-4 mr-2" />
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div
                    key={item.variantId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group"
                  >
                    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-all duration-200">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          width={72}
                          height={72}
                          className="size-18 rounded-xl object-cover border shadow-sm group-hover:shadow-md transition-shadow"
                        />
                        {item.quantity > 1 && (
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                            {item.quantity}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-sm leading-tight line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.variantDescription}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.stockAvailable <= 5 && (
                          <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                            Only {item.stockAvailable} left
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 min-w-[28px] min-h-[28px] rounded-full hover:bg-background"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 min-w-[28px] min-h-[28px] rounded-full hover:bg-background"
                            disabled={item.quantity >= item.stockAvailable}
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 min-w-[28px] min-h-[28px] rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => removeItem(item.variantId)}
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    {index < items.length - 1 && (
                      <Separator className="my-2 opacity-50" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-auto border-t bg-gradient-to-t from-background to-transparent px-6 pt-6 pb-8">
              {/* Custom progress bar - no Progress import needed */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Truck className="size-4" />
                    {isFreeShipping ? (
                      <span className="text-green-600 font-medium">✨ Free Shipping</span>
                    ) : (
                      <span>Add {formatPrice(FREE_SHIPPING_THRESHOLD - cartTotal)} more for free shipping</span>
                    )}
                  </span>
                  <span className="font-medium">{Math.round(shippingProgress)}%</span>
                </div>
                {/* Custom progress bar */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(shippingProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full min-h-[52px] rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    className="min-h-[44px] text-sm text-muted-foreground hover:text-foreground"
                    onClick={handleContinueShopping}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-[44px] text-sm text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your cart?")) {
                        clearCart();
                      }
                    }}
                  >
                    Clear Cart
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-6 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="size-3.5" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Heart className="size-3.5" />
                    <span>100% Safe</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="size-3.5" />
                    <span>Free Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
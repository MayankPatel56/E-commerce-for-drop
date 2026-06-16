"use client";

import { ShoppingCart, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:w-[400px] w-full flex flex-col p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="size-5" />
            Shopping Cart
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-1">
                {totalItems}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
            <ShoppingCart className="size-16 text-muted-foreground/50" />
            <p className="text-muted-foreground text-lg font-medium">
              Your cart is empty
            </p>
            <Button
              variant="outline"
              className="min-h-[44px] mt-2"
              onClick={handleContinueShopping}
            >
              <ShoppingBag className="size-4" />
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable items list */}
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-4 py-2">
              {items.map((item, index) => (
                <div key={item.variantId}>
                  <div className="flex items-start gap-3 py-3">
                    {/* Thumbnail */}
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="size-16 shrink-0 rounded-md object-cover"
                    />

                    {/* Middle: name, variant, price */}
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <p className="font-medium leading-tight line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.variantDescription}
                      </p>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Right: quantity + remove */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 min-w-[32px] min-h-[32px]"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 min-w-[32px] min-h-[32px]"
                          disabled={item.quantity >= item.stockAvailable}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 min-w-[32px] min-h-[32px] text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.variantId)}
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {index < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>

            {/* Cart summary - fixed at bottom */}
            <div className="mt-auto border-t bg-background px-4 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>

              <Button
                className="w-full min-h-[44px] mb-2"
                onClick={handleCheckout}
              >
                Proceed to Checkout
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="link"
                className="w-full min-h-[44px] text-muted-foreground"
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
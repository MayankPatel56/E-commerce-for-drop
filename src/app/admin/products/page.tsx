import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";
import { Product } from "@/lib/product-types";

export default async function AdminProducts() {
  const { error } = await requireAdmin();
  if (error) return error;

  const navigate = useStoreNavigate();

  // Fetch all products
  const products = await db.product.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    include: {
      category: { select: { name: true, slug: true } },
      variants: {
        select: { id: true, sku: true, variantValue: true, price: true, isOutOfStock: true, stockQuantity: true },
      },
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Products Management</h1>

      <Table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const firstVariant = product.variants[0];
            return (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{firstVariant?.sku ?? "N/A"}</td>
                <td>₹{firstVariant?.price?.toString() ?? "0"}</td>
                <td>
                  {firstVariant?.isOutOfStock
                    ? "Out of stock"
                    : firstVariant?.stockQuantity > 0
                    ? "In stock"
                    : "Out of stock"}
                </td>
                <td>{product.category?.name ?? "Uncategorized"}</td>
                <td>
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
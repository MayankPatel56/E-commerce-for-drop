import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function AdminOrders() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  // Fetch all orders
  const orders = await db.order.findMany({
    where: { status: "delivered" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      customer: { select: { name: true, email: true } },
      orderItems: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Orders Management</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">No orders found</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const totalItems = order.orderItems.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name ?? "Guest"}</td>
                  <td>{totalItems} items</td>
                  <td>₹{order.cartTotal?.toString() ?? "0"}</td>
                  <td>{order.status}</td>
                  <td>
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="destructive" size="sm">Refund</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

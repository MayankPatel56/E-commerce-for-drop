import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

async function getAdminDashboard() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  // Fetch products count
  const productsCount = await db.product.count({ where: { isPublished: true } });

  // Fetch recent orders
  const recentOrders = await db.order.findMany({
    where: { status: "delivered" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      customer: { select: { name: true, email: true } },
      orderItems: {
        include: { variant: { include: { product: true } } },
      },
    },
  });

  return { productsCount, recentOrders };
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  if (!data) {
    return null; // Error handled by layout redirect
  }

  const { productsCount, recentOrders } = data;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded border">
          <div className="text-3xl font-bold">{productsCount}</div>
          <div className="text-sm text-muted-foreground">Total Products</div>
        </div>
        {/* Add more stats cards as needed */}
      </div>

      <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
      {recentOrders.length === 0 ? (
        <p className="text-muted-foreground">No orders found</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer?.name ?? "Guest"}</td>
                <td>{order.status}</td>
                <td>₹{order.cartTotal?.toString() ?? "0"}</td>
                <td>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

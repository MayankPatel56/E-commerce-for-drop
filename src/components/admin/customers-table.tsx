"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isRegistered: boolean;
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return <Badge variant="destructive">{role}</Badge>;
    case "customer":
      return <Badge variant="secondary">{role}</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function getRegisteredBadge(isRegistered: boolean) {
  return isRegistered ? (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 border-transparent">
      Yes
    </Badge>
  ) : (
    <Badge variant="secondary">No</Badge>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function CustomersTable() {
  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(PAGE_LIMIT));

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch customers");

      const data: CustomersResponse = await res.json();
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Computed ─────────────────────────────────────────────────────────────

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd = Math.min(page * PAGE_LIMIT, total);

  const emptyMessage = search
    ? `No customers matching "${search}" found.`
    : "No customers yet. Customers will appear here once they place their first order.";

  // ── Skeleton ─────────────────────────────────────────────────────────────

  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 flex-1 max-w-[180px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-5 w-[70px]" />
          <Skeleton className="h-5 w-[50px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[90px]" />
        </div>
      ))}
    </div>
  );

  const CardSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-4 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // ── Mobile Card ──────────────────────────────────────────────────────────

  const MobileCard = ({ customer }: { customer: Customer }) => (
    <Card className="transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm truncate max-w-[200px]">
            {customer.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {getRoleBadge(customer.role)}
            {getRegisteredBadge(customer.isRegistered)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {customer._count.orders} order{customer._count.orders !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(customer.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Customers</h2>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading customers…
            </span>
          ) : (
            `${total} customer${total !== 1 ? "s" : ""} total`
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, email, or phone…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 min-h-[44px]"
          aria-label="Search customers"
        />
      </div>

      {/* Error State */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Failed to load customers
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 min-h-[44px]"
              onClick={() => fetchCustomers()}
            >
              <Loader2 className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State – Mobile Cards */}
      {isLoading && <div className="md:hidden">{CardSkeleton()}</div>}

      {/* Loading State – Desktop Table */}
      {isLoading && <div className="hidden md:block">{TableSkeleton()}</div>}

      {/* Empty State */}
      {!isLoading && !error && customers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No customers found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {emptyMessage}
          </p>
        </div>
      )}

      {/* Mobile Cards */}
      {!isLoading && !error && customers.length > 0 && (
        <div className="space-y-3 md:hidden">
          {customers.map((customer) => (
            <MobileCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && !error && customers.length > 0 && (
        <div className="hidden md:block">
          <div className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-md border scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[130px]">Phone</TableHead>
                  <TableHead className="min-w-[90px]">
                    <span className="sr-only">Role</span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Role
                    </span>
                  </TableHead>
                  <TableHead className="min-w-[100px]">Registered</TableHead>
                  <TableHead className="min-w-[90px]">Orders</TableHead>
                  <TableHead className="min-w-[120px]">Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <span className="text-sm font-medium truncate block max-w-[200px]">
                        {customer.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate max-w-[200px]">
                          {customer.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(customer.role)}</TableCell>
                    <TableCell>{getRegisteredBadge(customer.isRegistered)}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {customer._count.orders}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{rangeStart}</span>
            {"–"}
            <span className="font-medium text-foreground">{rangeEnd}</span>
            {" of "}
            <span className="font-medium text-foreground">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sm:sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="min-h-[44px] min-w-[44px]"
              aria-label="Next page"
            >
              <span className="sm:sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

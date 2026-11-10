import { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderConfirmationWrapper } from "@/components/store/order-confirmation-wrapper";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

interface OrderConfirmationPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({
  params,
}: OrderConfirmationPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber} Confirmed — Indicore Originals`,
    description: `Your order ${orderNumber} has been confirmed. Thank you for shopping with Indicore Originals.`,
    openGraph: {
      title: `Order ${orderNumber} Confirmed — Indicore Originals`,
      description: `Your order ${orderNumber} has been confirmed. Thank you for shopping with Indicore Originals.`,
      url: `${SITE_URL}/order-confirmation/${orderNumber}`,
      siteName: "Indicore Originals",
      type: "website",
    },
  };
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { orderNumber } = await params;

  if (!orderNumber) {
    notFound();
  }

  return <OrderConfirmationWrapper orderNumber={orderNumber} />;
}
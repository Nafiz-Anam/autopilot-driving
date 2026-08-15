import { formatPrice, paidAmount } from "@/lib/utils";

export function BookingAmount({
  totalAmount,
  discountAmount,
}: {
  totalAmount: number;
  discountAmount?: number | null;
}) {
  const discount = discountAmount ?? 0;
  if (discount <= 0) {
    return <span className="font-semibold">{formatPrice(totalAmount)}</span>;
  }
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-semibold">{formatPrice(paidAmount(totalAmount, discount))}</span>
      <span className="text-brand-muted line-through text-xs">{formatPrice(totalAmount)}</span>
    </span>
  );
}

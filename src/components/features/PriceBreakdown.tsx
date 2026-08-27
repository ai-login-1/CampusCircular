interface PriceBreakdownProps {
  dailyRate: number;
  hourlyRate?: number;
  securityDeposit: number;
  days?: number;
}

export default function PriceBreakdown({ dailyRate, hourlyRate, securityDeposit, days = 1 }: PriceBreakdownProps) {
  const subtotal = dailyRate * days;
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;

  return (
    <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
      <h3 className="font-semibold text-gray-900 text-sm">Price Breakdown</h3>

      <div className="space-y-2">
        {hourlyRate && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Hourly rate</span>
            <span className="font-medium text-gray-700">₹{hourlyRate}/hr</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">₹{dailyRate}/day × {days} day{days !== 1 ? "s" : ""}</span>
          <span className="font-medium text-gray-700">₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Platform fee (5%)</span>
          <span className="font-medium text-gray-700">₹{platformFee}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold">
          <span className="text-gray-800">Subtotal</span>
          <span className="text-gray-900">₹{total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Refundable deposit</span>
          <span className="font-medium text-violet-600">₹{securityDeposit}</span>
        </div>
      </div>

      <div className="bg-violet-600 rounded-xl p-3 flex justify-between items-center">
        <span className="text-white text-sm font-medium">Total to pay now</span>
        <span className="text-white font-bold text-lg">₹{total + securityDeposit}</span>
      </div>
      <p className="text-[11px] text-gray-400 text-center">Deposit fully refunded upon timely return in original condition</p>
    </div>
  );
}

"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useT } from "@/i18n/client";

export default function VisitsChart({ series }: { series: { date: string; visits: number }[] }) {
  const { t, shortDate } = useT();
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#d6d6d6" strokeDasharray="0" />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8a8a" }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8a8a" }} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "#000", strokeWidth: 1 }}
            contentStyle={{ borderRadius: 12, border: "1px solid #d6d6d6", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(0,0,0,.3)" }}
            formatter={(v) => [v, t.dash.analytics.visits]}
            labelFormatter={(v) => (typeof v === "string" ? shortDate(v) : v)}
            labelStyle={{ color: "#8a8a8a" }}
          />
          <Area type="monotone" dataKey="visits" stroke="#000000" strokeWidth={2} fill="url(#fillVisits)" dot={false} activeDot={{ r: 4, fill: "#000" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

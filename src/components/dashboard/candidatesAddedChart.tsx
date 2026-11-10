"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { SectionCard } from "../shared/primitives";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

export default function CandidatesAddedChart() {
  const weeklyConfig = {
    count: { label: "Candidates added", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  const weekly = [
    { label: "Oct 2", count: 0 },
    { label: "Oct 9", count: 1 },
    { label: "Oct 16", count: 1 },
    { label: "Oct 23", count: 2 },
    { label: "Oct 30", count: 3 },
    { label: "Nov 6", count: 5 },
  ];

  return (
    <SectionCard title="Candidates added" description="Last 6 weeks">
      <ChartContainer config={weeklyConfig} className="h-56 w-full">
        <BarChart data={weekly} margin={{ left: -20, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </SectionCard>
  );
}

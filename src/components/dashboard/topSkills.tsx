"use client";

import { SectionCard } from "../shared/primitives";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export default function TopSkills() {
  const skillsConfig = {
    count: { label: "Candidates", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  const topSkills = [
    {
      skill: "React",
      count: 11,
    },
    {
      skill: "Node.js",
      count: 8,
    },
    {
      skill: "TypeScript",
      count: 7,
    },
    {
      skill: "Python",
      count: 3,
    },
    {
      skill: "Docker",
      count: 1,
    },
    {
      skill: "AWS",
      count: 1,
    },
  ];

  return (
    <SectionCard
      title="Top skills in your pool"
      description="Number of candidates listing each skill"
    >
      {topSkills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skills yet.</p>
      ) : (
        <ChartContainer config={skillsConfig} className="h-56 w-full">
          <BarChart
            data={topSkills}
            layout="vertical"
            margin={{ left: 10, right: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="skill"
              tickLine={false}
              axisLine={false}
              width={84}
              fontSize={12}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </SectionCard>
  );
}

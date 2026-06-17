import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Jan", applications: Math.floor(Math.random() * 50) + 10 },
  { name: "Feb", applications: Math.floor(Math.random() * 50) + 10 },
  { name: "Mar", applications: Math.floor(Math.random() * 50) + 10 },
  { name: "Apr", applications: Math.floor(Math.random() * 50) + 10 },
  { name: "May", applications: Math.floor(Math.random() * 50) + 10 },
  { name: "Jun", applications: Math.floor(Math.random() * 50) + 10 },
]

export function CoordinatorOverview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Bar
          dataKey="applications"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

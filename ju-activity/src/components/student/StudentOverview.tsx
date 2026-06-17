import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  { name: "Sep", activities: Math.floor(Math.random() * 5) + 1 },
  { name: "Oct", activities: Math.floor(Math.random() * 5) + 1 },
  { name: "Nov", activities: Math.floor(Math.random() * 5) + 1 },
  { name: "Dec", activities: Math.floor(Math.random() * 5) + 1 },
  { name: "Jan", activities: Math.floor(Math.random() * 5) + 1 },
  { name: "Feb", activities: Math.floor(Math.random() * 5) + 1 },
]

export function StudentOverview() {
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
          dataKey="activities"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

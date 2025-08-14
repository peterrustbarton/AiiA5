
'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart
} from 'recharts'
import { ChartData } from '@/lib/types'
import { formatPrice, formatDate } from '@/lib/utils'

interface PriceChartProps {
  data: ChartData[]
  symbol: string
  type?: 'line' | 'area'
  height?: number
}

export function PriceChart({ data, symbol, type = 'area', height = 300 }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: new Date(item.timestamp).toLocaleDateString(),
      price: item.close
    }))
  }, [data])

  const isPositive = useMemo(() => {
    if (chartData.length < 2) return true
    const first = chartData[0].price
    const last = chartData[chartData.length - 1].price
    return last >= first
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No chart data available for {symbol}
      </div>
    )
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="date"
            tickLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            axisLine={false}
          />
          <YAxis
            domain={['dataMin - 5', 'dataMax + 5']}
            tickLine={false}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-primary font-semibold">
                      {formatPrice(payload[0].value as number)}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          {type === 'area' ? (
            <>
              <defs>
                <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                strokeWidth={2}
                fill={`url(#gradient-${symbol})`}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
              strokeWidth={2}
              dot={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

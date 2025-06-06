"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PerformanceMetric {
  timestamp: number
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  memoryUsage: number | null
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      setSupported(false)
      return
    }

    const metricsHistory: PerformanceMetric[] = []

    // Create a base metric entry
    const createBaseMetric = (): PerformanceMetric => ({
      timestamp: Date.now(),
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      memoryUsage: null,
    })

    // Add memory usage if available
    const updateMemoryUsage = () => {
      // @ts-ignore - TypeScript doesn't know about memory property
      if (window.performance && window.performance.memory) {
        const latestMetric = metricsHistory[metricsHistory.length - 1] || createBaseMetric()
        // @ts-ignore
        latestMetric.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))

        if (metricsHistory.length === 0) {
          metricsHistory.push(latestMetric)
        }

        setMetrics([...metricsHistory])
      }
    }

    // Observe First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          const latestMetric = metricsHistory[metricsHistory.length - 1] || createBaseMetric()
          latestMetric.fcp = Math.round(entries[0].startTime)

          if (metricsHistory.length === 0) {
            metricsHistory.push(latestMetric)
          }

          setMetrics([...metricsHistory])
        }
      })
      fcpObserver.observe({ type: "paint", buffered: true })
    } catch (e) {
      console.error("FCP observation not supported", e)
    }

    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          const latestMetric = metricsHistory[metricsHistory.length - 1] || createBaseMetric()
          latestMetric.lcp = Math.round(entries[entries.length - 1].startTime)

          if (metricsHistory.length === 0) {
            metricsHistory.push(latestMetric)
          }

          setMetrics([...metricsHistory])
        }
      })
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
    } catch (e) {
      console.error("LCP observation not supported", e)
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        if (entries.length > 0) {
          const latestMetric = metricsHistory[metricsHistory.length - 1] || createBaseMetric()
          latestMetric.fid = Math.round(entries[0].processingStart - entries[0].startTime)

          if (metricsHistory.length === 0) {
            metricsHistory.push(latestMetric)
          }

          setMetrics([...metricsHistory])
        }
      })
      fidObserver.observe({ type: "first-input", buffered: true })
    } catch (e) {
      console.error("FID observation not supported", e)
    }

    // Observe Cumulative Layout Shift
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            // @ts-ignore - value property exists on CLS entries
            clsValue += entry.value
          }
        }

        const latestMetric = metricsHistory[metricsHistory.length - 1] || createBaseMetric()
        latestMetric.cls = Number.parseFloat(clsValue.toFixed(3))

        if (metricsHistory.length === 0) {
          metricsHistory.push(latestMetric)
        }

        setMetrics([...metricsHistory])
      })
      clsObserver.observe({ type: "layout-shift", buffered: true })
    } catch (e) {
      console.error("CLS observation not supported", e)
    }

    // Observe Time to First Byte
    try {
      const navigationEntries = performance.getEntriesByType("navigation")
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming
        const latestMetric = metricsHistory[metricsHistory.length - 1] || createBaseMetric()
        latestMetric.ttfb = Math.round(navEntry.responseStart)

        if (metricsHistory.length === 0) {
          metricsHistory.push(latestMetric)
        }

        setMetrics([...metricsHistory])
      }
    } catch (e) {
      console.error("TTFB measurement not supported", e)
    }

    // Initial memory reading
    updateMemoryUsage()

    // Periodic memory updates
    const memoryInterval = setInterval(() => {
      const newMetric = createBaseMetric()
      updateMemoryUsage()
      metricsHistory.push(newMetric)

      // Keep only the last 20 readings
      if (metricsHistory.length > 20) {
        metricsHistory.shift()
      }

      setMetrics([...metricsHistory])
    }, 10000)

    return () => {
      clearInterval(memoryInterval)
    }
  }, [])

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
          <CardDescription>Performance metrics are not supported in this browser.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Format metrics for chart
  const chartData = metrics.map((metric) => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    fcp: metric.fcp,
    lcp: metric.lcp,
    fid: metric.fid,
    cls: metric.cls ? metric.cls * 1000 : null, // Scale CLS for visibility
    ttfb: metric.ttfb,
    memory: metric.memoryUsage,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Monitoring</CardTitle>
        <CardDescription>Real-time web performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-medium mb-2">Core Web Vitals</h3>
            <ChartContainer
              config={{
                fcp: {
                  label: "FCP (ms)",
                  color: "hsl(var(--chart-1))",
                },
                lcp: {
                  label: "LCP (ms)",
                  color: "hsl(var(--chart-2))",
                },
                fid: {
                  label: "FID (ms)",
                  color: "hsl(var(--chart-3))",
                },
                cls: {
                  label: "CLS (x1000)",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="fcp" stroke="var(--color-fcp)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lcp" stroke="var(--color-lcp)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fid" stroke="var(--color-fid)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cls" stroke="var(--color-cls)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Memory Usage (MB)</h3>
            <ChartContainer
              config={{
                memory: {
                  label: "Memory (MB)",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="memory" stroke="var(--color-memory)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="FCP"
              value={metrics.length > 0 && metrics[0].fcp !== null ? `${metrics[0].fcp} ms` : "N/A"}
              description="First Contentful Paint"
              status={getMetricStatus("fcp", metrics.length > 0 ? metrics[0].fcp : null)}
            />
            <MetricCard
              title="LCP"
              value={metrics.length > 0 && metrics[0].lcp !== null ? `${metrics[0].lcp} ms` : "N/A"}
              description="Largest Contentful Paint"
              status={getMetricStatus("lcp", metrics.length > 0 ? metrics[0].lcp : null)}
            />
            <MetricCard
              title="FID"
              value={metrics.length > 0 && metrics[0].fid !== null ? `${metrics[0].fid} ms` : "N/A"}
              description="First Input Delay"
              status={getMetricStatus("fid", metrics.length > 0 ? metrics[0].fid : null)}
            />
            <MetricCard
              title="CLS"
              value={metrics.length > 0 && metrics[0].cls !== null ? metrics[0].cls.toFixed(3) : "N/A"}
              description="Cumulative Layout Shift"
              status={getMetricStatus("cls", metrics.length > 0 ? metrics[0].cls : null)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  title,
  value,
  description,
  status,
}: {
  title: string
  value: string
  description: string
  status: "good" | "needs-improvement" | "poor" | "unknown"
}) {
  const statusColors = {
    good: "bg-green-500",
    "needs-improvement": "bg-yellow-500",
    poor: "bg-red-500",
    unknown: "bg-gray-300",
  }

  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{title}</span>
        <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  )
}

function getMetricStatus(
  metric: "fcp" | "lcp" | "fid" | "cls",
  value: number | null,
): "good" | "needs-improvement" | "poor" | "unknown" {
  if (value === null) return "unknown"

  switch (metric) {
    case "fcp":
      return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor"
    case "lcp":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor"
    case "fid":
      return value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor"
    case "cls":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor"
    default:
      return "unknown"
  }
}

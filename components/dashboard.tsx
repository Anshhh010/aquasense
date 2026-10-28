"use client"

import { useEffect, useState } from "react"
import { SensorCard } from "./sensor-card"
import { PredictionCard } from "./prediction-card"
import { Droplets, Thermometer, Activity, Beaker, RefreshCw, Settings, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SensorData {
  pH: number
  tds: number
  turbidity: number
  temperature: number
  prediction: "SAFE" | "UNSAFE" | "UNKNOWN"
  confidence?: number
}

const DEFAULT_ESP32_URL = "http://192.168.1.100/api/sensors"
const AWS_API_URL = "https://xkf4jza5ob.execute-api.ap-south-1.amazonaws.com"

type DataSource = "demo" | "aws" | "esp32"

function determineMetricHealthStatus(type: string, value: number): "safe" | "warning" | "danger" {
  switch (type) {
    case "pH":
      if (value >= 6.5 && value <= 8.5) return "safe"
      if ((value >= 6.0 && value < 6.5) || (value > 8.5 && value <= 9.0)) return "warning"
      return "danger"
    case "tds":
      if (value <= 300) return "safe"
      if (value <= 500) return "warning"
      return "danger"
    case "turbidity":
      if (value <= 5) return "safe"
      if (value <= 10) return "warning"
      return "danger"
    case "temperature":
      if (value >= 10 && value <= 30) return "safe"
      if ((value >= 5 && value < 10) || (value > 30 && value <= 35)) return "warning"
      return "danger"
    default:
      return "safe"
  }
}

export function Dashboard() {
  const [data, setData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [esp32Url, setEsp32Url] = useState(DEFAULT_ESP32_URL)
  const [showConfig, setShowConfig] = useState(false)
  const [dataSource, setDataSource] = useState<DataSource>("demo")

  const fetchLatestWaterData = async () => {
    try {
      if (dataSource === "demo") {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const demoData: SensorData = {
          pH: 7.25 + (Math.random() - 0.5) * 0.2,
          tds: 245 + Math.floor((Math.random() - 0.5) * 20),
          turbidity: 2.3 + (Math.random() - 0.5) * 0.5,
          temperature: 22.5 + (Math.random() - 0.5) * 1,
          prediction: "SAFE",
          confidence: 94,
        }
        setData(demoData)
      } else if (dataSource === "aws") {
        const response = await fetch(AWS_API_URL)
        
        if (!response.ok) {
          let errorMsg = `AWS API error: ${response.status}`
          try {
            const errData = await response.json()
            if (errData.message) {
              errorMsg = `AWS Cloud: ${errData.message}`
            }
          } catch (_) {
            // Ignore if not JSON
          }
          throw new Error(errorMsg)
        }
        
        const rawData = await response.json()
        const phVal = rawData.pH !== undefined ? rawData.pH : rawData.ph
        
        setData({
          pH: phVal,
          tds: rawData.tds,
          turbidity: rawData.turbidity,
          temperature: rawData.temperature,
          prediction: rawData.prediction ? (rawData.prediction.toUpperCase() as any) : "UNKNOWN",
          confidence: rawData.confidence || 98
        })
      } else {
        const response = await fetch(esp32Url, {
          method: "GET",
          headers: { Accept: "application/json" },
        })

        if (!response.ok) {
          throw new Error(`Local ESP32 error: ${response.status}`)
        }

        const sensorData: SensorData = await response.json()
        setData(sensorData)
      }
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(`Fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`)
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestWaterData()
    const interval = setInterval(fetchLatestWaterData, 5000)
    return () => clearInterval(interval)
  }, [esp32Url, dataSource])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading sensor data...</p>
        </div>
      </div>
    )
  }

  const getDataSourceIndicatorColor = () => {
    switch (dataSource) {
      case "aws": return "bg-blue-500"
      case "esp32": return "bg-green-500"
      default: return "bg-yellow-500"
    }
  }

  const getDataSourceBadgeLabel = () => {
    switch (dataSource) {
      case "aws": return "AWS Cloud"
      case "esp32": return "Live ESP32"
      default: return "Demo Mode"
    }
  }

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`h-3 w-3 rounded-full ${getDataSourceIndicatorColor()} animate-pulse-dot`}></div>
            <div className={`absolute inset-0 h-3 w-3 rounded-full ${getDataSourceIndicatorColor()} animate-ripple`}></div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{getDataSourceBadgeLabel()}</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</p>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowConfig(!showConfig)}>
            <Settings className="h-4 w-4 mr-1" />
            Config
          </Button>
        </div>
      </div>

      {showConfig && (
        <div className="p-4 rounded-lg bg-card border border-border space-y-4 shadow-sm">
          <h3 className="font-semibold text-sm">Data Source Configuration</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant={dataSource === "demo" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setDataSource("demo")}
            >
              Demo Mode
            </Button>
            <Button 
              variant={dataSource === "aws" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setDataSource("aws")}
              className="gap-2"
            >
              <Cloud className="h-3.5 w-3.5" />
              AWS Cloud
            </Button>
            <Button 
              variant={dataSource === "esp32" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setDataSource("esp32")}
            >
              Live ESP32
            </Button>
          </div>
          
          {dataSource === "esp32" && (
            <div className="space-y-2 pt-2 border-t mt-2">
              <Label htmlFor="esp32-url" className="text-xs">Local ESP32 API Endpoint</Label>
              <div className="flex gap-2">
                <Input
                  id="esp32-url"
                  value={esp32Url}
                  onChange={(e) => setEsp32Url(e.target.value)}
                  placeholder="http://192.168.1.100/api/sensors"
                  className="font-mono text-xs h-8"
                />
                <Button size="sm" onClick={fetchLatestWaterData}>Test</Button>
              </div>
            </div>
          )}

          {dataSource === "aws" && (
            <div className="space-y-1 pt-2 border-t mt-2">
              <Label className="text-xs">AWS Cloud Endpoint</Label>
              <div className="text-[10px] font-mono p-2 bg-muted rounded truncate">
                {AWS_API_URL}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ML Prediction */}
      <PredictionCard prediction={data?.prediction || "UNKNOWN"} confidence={data?.confidence} />

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SensorCard
          title="pH Level"
          value={data?.pH !== undefined ? data.pH.toFixed(2) : "--"}
          unit="pH"
          icon={<Beaker className="h-6 w-6" />}
          status={data ? determineMetricHealthStatus("pH", data.pH) : "neutral"}
          range="6.5-8.5 Safe"
        />
        <SensorCard
          title="Total Dissolved Solids"
          value={data?.tds !== undefined ? data.tds : "--"}
          unit="ppm"
          icon={<Activity className="h-6 w-6" />}
          status={data ? determineMetricHealthStatus("tds", data.tds) : "neutral"}
          range="0-500 Good"
        />
        <SensorCard
          title="Turbidity"
          value={data?.turbidity !== undefined ? data.turbidity.toFixed(1) : "--"}
          unit="NTU"
          icon={<Droplets className="h-6 w-6" />}
          status={data ? determineMetricHealthStatus("turbidity", data.turbidity) : "neutral"}
          range="0-5 Clear"
        />
        <SensorCard
          title="Temperature"
          value={data?.temperature !== undefined ? data.temperature.toFixed(1) : "--"}
          unit="°C"
          icon={<Thermometer className="h-6 w-6" />}
          status={data ? determineMetricHealthStatus("temperature", data.temperature) : "neutral"}
          range="10-30 Ideal"
        />
      </div>

      {/* Setup Component */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
        <h3 className="font-semibold text-sm">System Integration</h3>
        <div className="grid md:grid-cols-2 gap-6 text-xs text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">AWS Cloud API</p>
            <p>Data is pushed from IoT devices to AWS TimescaleDB/DynamoDB and served via API Gateway.</p>
            <div className="p-2 bg-background rounded border border-border">
              <code>GET {AWS_API_URL}</code>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Local Hardware Setup</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload Arduino sketch to ESP32</li>
              <li>Connect sensors to specified GPIOs</li>
              <li>Enter ESP32 IP in Config above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

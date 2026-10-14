// ─── Chart Component Contracts ────────────────────────────────────────────────
// All Recharts wrapper components must accept these typed props.
// This ensures data is always normalized before reaching the chart layer.

export interface ChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number; // allow extra series
}

export interface RadarDataPoint {
  metric: string;
  value: number;
  fullMark: number;
}

export interface TimeSeriesPoint {
  date: string; // ISO 8601
  value: number;
}

export interface BaseChartProps {
  data: ChartDataPoint[] | RadarDataPoint[] | TimeSeriesPoint[];
  width?: number | string;
  height?: number;
  className?: string;
}

export interface BarChartProps extends BaseChartProps {
  data: ChartDataPoint[];
  xKey?: string;
  yKey?: string;
  color?: string;
}

export interface RadarChartProps extends BaseChartProps {
  data: RadarDataPoint[];
  color?: string;
  fillOpacity?: number;
}

export interface LineChartProps extends BaseChartProps {
  data: TimeSeriesPoint[];
  color?: string;
  showDots?: boolean;
}

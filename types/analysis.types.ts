export interface DataSource {
  type: 'web' | 'database' | 'duckdb' | 'file';
  url?: string;
  query?: string;
  filePath?: string;
  headers?: Record<string, string>;
}

export interface ProcessingStep {
  type: 'filter' | 'transform' | 'aggregate' | 'sort' | 'join' | 'calculate';
  operation: string;
  parameters?: Record<string, any>;
}

export interface VisualizationConfig {
  type: 'scatter' | 'line' | 'bar' | 'pie' | 'histogram' | 'heatmap';
  xAxis?: string;
  yAxis?: string;
  title?: string;
  showRegression?: boolean;
  regressionStyle?: 'solid' | 'dashed' | 'dotted';
  regressionColor?: string;
  width?: number;
  height?: number;
  format?: 'png' | 'webp' | 'jpeg';
}

export interface AnalysisQuestion {
  text: string;
  type: 'count' | 'calculation' | 'correlation' | 'visualization' | 'comparison' | 'text' | 'date';
  visualization?: VisualizationConfig;
  expectedFormat?: 'number' | 'string' | 'boolean' | 'array' | 'object' | 'base64_image';
}

export interface AnalysisTask {
  type: 'web_scraping' | 'database_query' | 'data_analysis' | 'mixed';
  dataSource?: DataSource;
  processing?: ProcessingStep[];
  questions: AnalysisQuestion[];
  outputFormat: 'json_array' | 'json_object' | 'text';
  context?: string;
}

export interface AnalysisResult {
  success: boolean;
  data: any;
  metadata: {
    taskType: string;
    dataSource: string;
    questionsAnswered: number;
    processingSteps: number;
  };
  error?: string;
}

export interface ScrapedData {
  url: string;
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  tables?: TableData[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface DatabaseQueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export interface VisualizationResult {
  type: 'base64_image';
  data: string;
  format: string;
}
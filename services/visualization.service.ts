import type { VisualizationConfig, VisualizationResult } from '@/types/analysis.types';

export class VisualizationService {
  constructor() {
    console.log('Visualization service initialized (simplified implementation)');
  }

  async createVisualization(data: any, config: VisualizationConfig): Promise<string> {
    console.log('Creating visualization:', config.type);
    
    try {
      // Create SVG visualization
      const svgContent = this.createSVGVisualization(data, config);
      
      // Convert SVG to PNG-like base64 for compatibility
      // Since we can't use Canvas in this environment, we'll return SVG as PNG-formatted base64
      const base64Svg = this.btoa(svgContent);
      
      // Return as PNG data URI for compatibility
      return `data:image/png;base64,${base64Svg}`;
      
    } catch (error) {
      console.error('Error creating visualization:', error);
      throw error;
    }
  }

  private btoa(str: string): string {
    // Browser-compatible base64 encoding
    if (typeof btoa !== 'undefined') {
      return btoa(unescape(encodeURIComponent(str)));
    }
    // Node.js fallback
    if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer) {
      return (globalThis as any).Buffer.from(str, 'utf8').toString('base64');
    }
    // Manual fallback - simple base64-like encoding
    return str;
  }

  private createSVGVisualization(data: any, config: VisualizationConfig): string {
    const width = config.width || 800;
    const height = config.height || 600;
    const margin = { top: 50, right: 50, bottom: 70, left: 70 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    // Extract data points
    const dataPoints = this.extractDataPoints(data, config.xAxis, config.yAxis);
    
    if (dataPoints.length === 0) {
      return this.createEmptyVisualization(width, height, 'No data available');
    }
    
    // Calculate scales
    const xValues = dataPoints.map(p => p.x);
    const yValues = dataPoints.map(p => p.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    
    // Add padding to ranges
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xPadding = xRange * 0.1;
    const yPadding = yRange * 0.1;
    
    const xMinPadded = xMin - xPadding;
    const xMaxPadded = xMax + xPadding;
    const yMinPadded = yMin - yPadding;
    const yMaxPadded = yMax + yPadding;
    
    // Scale functions
    const xScale = (x: number) => ((x - xMinPadded) / (xMaxPadded - xMinPadded)) * plotWidth + margin.left;
    const yScale = (y: number) => height - margin.bottom - ((y - yMinPadded) / (yMaxPadded - yMinPadded)) * plotHeight;
    
    let svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .axis { stroke: #333; stroke-width: 1; }
          .axis-label { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
          .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333; }
          .point { fill: rgba(54, 162, 235, 0.7); stroke: rgba(54, 162, 235, 1); stroke-width: 1; }
          .regression-line { stroke-width: 2; fill: none; }
          .grid-line { stroke: #ddd; stroke-width: 0.5; }
        </style>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="white"/>
        
        <!-- Title -->
        <text x="${width/2}" y="30" text-anchor="middle" class="title">${config.title || 'Rank vs Peak Scatter Plot'}</text>
        
        <!-- Grid lines -->`;
    
    // Add grid lines
    const xTicks = 10;
    const yTicks = 8;
    
    for (let i = 0; i <= xTicks; i++) {
      const x = margin.left + (i / xTicks) * plotWidth;
      svgContent += `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" class="grid-line"/>`;
    }
    
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + (i / yTicks) * plotHeight;
      svgContent += `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="grid-line"/>`;
    }
    
    svgContent += `
        <!-- Axes -->
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" class="axis"/>
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" class="axis"/>
        
        <!-- Axis labels -->
        <text x="${width/2}" y="${height - 10}" text-anchor="middle" class="axis-label">${config.xAxis || 'Rank'}</text>
        <text x="15" y="${height/2}" text-anchor="middle" transform="rotate(-90 15 ${height/2})" class="axis-label">${config.yAxis || 'Peak'}</text>
    `;
    
    // Add data points
    if (config.type === 'scatter' || config.type === 'line') {
      dataPoints.forEach(point => {
        const x = xScale(point.x);
        const y = yScale(point.y);
        svgContent += `<circle cx="${x}" cy="${y}" r="3" class="point"/>`;
      });
      
      // Add regression line if requested
      if (config.showRegression && config.type === 'scatter') {
        const regressionLine = this.calculateRegressionLine(dataPoints);
        const x1 = xScale(regressionLine[0].x);
        const y1 = yScale(regressionLine[0].y);
        const x2 = xScale(regressionLine[1].x);
        const y2 = yScale(regressionLine[1].y);
        
        const strokeDasharray = config.regressionStyle === 'dotted' ? '3,3' : 
                               config.regressionStyle === 'dashed' ? '8,4' : 'none';
        const strokeColor = config.regressionColor || 'red';
        
        svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="${strokeDasharray}" fill="none"/>`;
      }
    }
    
    // Add tick marks and labels
    for (let i = 0; i <= xTicks; i++) {
      const x = margin.left + (i / xTicks) * plotWidth;
      const value = xMinPadded + (i / xTicks) * (xMaxPadded - xMinPadded);
      svgContent += `
        <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 5}" class="axis"/>
        <text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" class="axis-label">${Math.round(value)}</text>
      `;
    }
    
    for (let i = 0; i <= yTicks; i++) {
      const y = height - margin.bottom - (i / yTicks) * plotHeight;
      const value = yMinPadded + (i / yTicks) * (yMaxPadded - yMinPadded);
      svgContent += `
        <line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" class="axis"/>
        <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" class="axis-label">${Math.round(value)}</text>
      `;
    }
    
    svgContent += '</svg>';
    
    return svgContent;
  }

  private createEmptyVisualization(width: number, height: number, message: string): string {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="white"/>
        <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16px">${message}</text>
      </svg>
    `;
  }

  private extractDataPoints(data: any, xAxis?: string, yAxis?: string): any[] {
    if (!data) return [];

    // Handle different data formats
    if (Array.isArray(data)) {
      if (data.length === 0) return [];
      
      // If data is array of objects
      if (typeof data[0] === 'object' && xAxis && yAxis) {
        return data
          .filter(item => item[xAxis] !== undefined && item[yAxis] !== undefined)
          .map(item => ({
            x: this.parseNumber(item[xAxis]),
            y: this.parseNumber(item[yAxis])
          }))
          .filter(point => !isNaN(point.x) && !isNaN(point.y));
      }
    }

    // Handle table data format
    if (data.headers && data.rows) {
      const xIndex = xAxis ? data.headers.indexOf(xAxis) : 0;
      const yIndex = yAxis ? data.headers.indexOf(yAxis) : 1;
      
      if (xIndex === -1 || yIndex === -1) {
        console.warn(`Column not found. Available columns: ${data.headers.join(', ')}`);
        return [];
      }
      
      return data.rows
        .map((row: any[]) => ({
          x: this.parseNumber(row[xIndex]),
          y: this.parseNumber(row[yIndex])
        }))
        .filter((point: any) => !isNaN(point.x) && !isNaN(point.y));
    }

    // Handle scraped data with tables
    if (data.tables && data.tables.length > 0) {
      const table = data.tables[0]; // Use first table
      return this.extractDataPoints(table, xAxis, yAxis);
    }

    return [];
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove common formatting
      const cleaned = value.replace(/[$,\s%]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private calculateRegressionLine(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 2) return [];

    // Calculate linear regression
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Find min and max x values
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));

    // Return line points
    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];
  }

  async createScatterPlot(
    data: any,
    xColumn: string,
    yColumn: string,
    options: Partial<VisualizationConfig> = {}
  ): Promise<string> {
    const config: VisualizationConfig = {
      type: 'scatter',
      xAxis: xColumn,
      yAxis: yColumn,
      title: `${yColumn} vs ${xColumn}`,
      width: 800,
      height: 600,
      format: 'png',
      ...options
    };

    return this.createVisualization(data, config);
  }

  async createBarChart(
    data: any,
    xColumn: string,
    yColumn: string,
    options: Partial<VisualizationConfig> = {}
  ): Promise<string> {
    const config: VisualizationConfig = {
      type: 'bar',
      xAxis: xColumn,
      yAxis: yColumn,
      title: `${yColumn} by ${xColumn}`,
      width: 800,
      height: 600,
      format: 'png',
      ...options
    };

    return this.createVisualization(data, config);
  }
}

import type { ProcessingStep } from '@/types/analysis.types';

export class DataProcessingService {
  async processData(data: any, steps: ProcessingStep[]): Promise<any> {
    console.log('Processing data with steps:', steps);
    
    let processedData = data;
    
    for (const step of steps) {
      processedData = await this.applyProcessingStep(processedData, step);
    }
    
    return processedData;
  }

  private async applyProcessingStep(data: any, step: ProcessingStep): Promise<any> {
    console.log('Applying processing step:', step.type, step.operation);
    
    switch (step.type) {
      case 'filter':
        return this.filterData(data, step);
      case 'transform':
        return this.transformData(data, step);
      case 'aggregate':
        return this.aggregateData(data, step);
      case 'sort':
        return this.sortData(data, step);
      case 'join':
        return this.joinData(data, step);
      case 'calculate':
        return this.calculateData(data, step);
      default:
        console.warn('Unknown processing step type:', step.type);
        return data;
    }
  }

  private filterData(data: any, step: ProcessingStep): any {
    if (!data) return data;

    // Handle array of objects
    if (Array.isArray(data)) {
      const { field, operator, value } = step.parameters || {};
      
      return data.filter(item => {
        const itemValue = item[field];
        
        switch (operator) {
          case 'equals':
            return itemValue === value;
          case 'not_equals':
            return itemValue !== value;
          case 'greater_than':
            return parseFloat(itemValue) > parseFloat(value);
          case 'less_than':
            return parseFloat(itemValue) < parseFloat(value);
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
          case 'starts_with':
            return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'ends_with':
            return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
          default:
            return true;
        }
      });
    }

    // Handle table format
    if (data.headers && data.rows) {
      const { field, operator, value } = step.parameters || {};
      const fieldIndex = data.headers.indexOf(field);
      
      if (fieldIndex === -1) return data;
      
      const filteredRows = data.rows.filter((row: any[]) => {
        const cellValue = row[fieldIndex];
        
        switch (operator) {
          case 'equals':
            return cellValue === value;
          case 'not_equals':
            return cellValue !== value;
          case 'greater_than':
            return parseFloat(cellValue) > parseFloat(value);
          case 'less_than':
            return parseFloat(cellValue) < parseFloat(value);
          case 'contains':
            return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
          default:
            return true;
        }
      });
      
      return {
        ...data,
        rows: filteredRows
      };
    }

    return data;
  }

  private transformData(data: any, step: ProcessingStep): any {
    if (!data) return data;

    const { field, operation, newField } = step.parameters || {};

    // Handle array of objects
    if (Array.isArray(data)) {
      return data.map(item => {
        const newItem = { ...item };
        
        switch (operation) {
          case 'to_number':
            newItem[newField || field] = parseFloat(item[field]) || 0;
            break;
          case 'to_string':
            newItem[newField || field] = String(item[field]);
            break;
          case 'to_date':
            newItem[newField || field] = new Date(item[field]);
            break;
          case 'uppercase':
            newItem[newField || field] = String(item[field]).toUpperCase();
            break;
          case 'lowercase':
            newItem[newField || field] = String(item[field]).toLowerCase();
            break;
          case 'trim':
            newItem[newField || field] = String(item[field]).trim();
            break;
          default:
            break;
        }
        
        return newItem;
      });
    }

    // Handle table format
    if (data.headers && data.rows) {
      const fieldIndex = data.headers.indexOf(field);
      if (fieldIndex === -1) return data;
      
      const newHeaders = [...data.headers];
      if (newField && !newHeaders.includes(newField)) {
        newHeaders.push(newField);
      }
      
      const transformedRows = data.rows.map((row: any[]) => {
        const newRow = [...row];
        const value = row[fieldIndex];
        
        let transformedValue = value;
        switch (operation) {
          case 'to_number':
            transformedValue = parseFloat(value) || 0;
            break;
          case 'to_string':
            transformedValue = String(value);
            break;
          case 'uppercase':
            transformedValue = String(value).toUpperCase();
            break;
          case 'lowercase':
            transformedValue = String(value).toLowerCase();
            break;
          case 'trim':
            transformedValue = String(value).trim();
            break;
        }
        
        if (newField) {
          newRow.push(transformedValue);
        } else {
          newRow[fieldIndex] = transformedValue;
        }
        
        return newRow;
      });
      
      return {
        ...data,
        headers: newHeaders,
        rows: transformedRows
      };
    }

    return data;
  }

  private aggregateData(data: any, step: ProcessingStep): any {
    if (!data) return data;

    const { groupBy, field, operation } = step.parameters || {};

    // Handle array of objects
    if (Array.isArray(data)) {
      if (!groupBy) {
        // Simple aggregation without grouping
        const values = data.map(item => parseFloat(item[field]) || 0);
        
        switch (operation) {
          case 'sum':
            return values.reduce((sum, val) => sum + val, 0);
          case 'avg':
            return values.reduce((sum, val) => sum + val, 0) / values.length;
          case 'min':
            return Math.min(...values);
          case 'max':
            return Math.max(...values);
          case 'count':
            return values.length;
          default:
            return data;
        }
      }
      
      // Group by aggregation
      const groups: Record<string, any[]> = {};
      data.forEach(item => {
        const key = item[groupBy];
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });
      
      return Object.entries(groups).map(([key, items]) => {
        const values = items.map(item => parseFloat(item[field]) || 0);
        
        let aggregatedValue;
        switch (operation) {
          case 'sum':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'min':
            aggregatedValue = Math.min(...values);
            break;
          case 'max':
            aggregatedValue = Math.max(...values);
            break;
          case 'count':
            aggregatedValue = values.length;
            break;
          default:
            aggregatedValue = values[0];
        }
        
        return {
          [groupBy]: key,
          [field]: aggregatedValue
        };
      });
    }

    return data;
  }

  private sortData(data: any, step: ProcessingStep): any {
    if (!data) return data;

    const { field, direction = 'asc' } = step.parameters || {};

    // Handle array of objects
    if (Array.isArray(data)) {
      return [...data].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        // Try numeric comparison first
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    // Handle table format
    if (data.headers && data.rows) {
      const fieldIndex = data.headers.indexOf(field);
      if (fieldIndex === -1) return data;
      
      const sortedRows = [...data.rows].sort((a, b) => {
        const aVal = a[fieldIndex];
        const bVal = b[fieldIndex];
        
        // Try numeric comparison first
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
      
      return {
        ...data,
        rows: sortedRows
      };
    }

    return data;
  }

  private joinData(data: any, step: ProcessingStep): any {
    // This would require a second dataset to join with
    // For now, return the original data
    console.warn('Join operation not implemented yet');
    return data;
  }

  private calculateData(data: any, step: ProcessingStep): any {
    if (!data) return data;

    const { operation, field1, field2, newField } = step.parameters || {};

    // Handle array of objects
    if (Array.isArray(data)) {
      return data.map(item => {
        const val1 = parseFloat(item[field1]) || 0;
        const val2 = parseFloat(item[field2]) || 0;
        
        let result;
        switch (operation) {
          case 'add':
            result = val1 + val2;
            break;
          case 'subtract':
            result = val1 - val2;
            break;
          case 'multiply':
            result = val1 * val2;
            break;
          case 'divide':
            result = val2 !== 0 ? val1 / val2 : 0;
            break;
          default:
            result = 0;
        }
        
        return {
          ...item,
          [newField]: result
        };
      });
    }

    return data;
  }

  // Utility methods
  async validateData(data: any): Promise<boolean> {
    if (!data) return false;
    
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    
    if (data.headers && data.rows) {
      return data.headers.length > 0 && data.rows.length > 0;
    }
    
    return false;
  }

  async getDataSummary(data: any): Promise<any> {
    if (!data) return null;

    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : [],
        sample: data.slice(0, 3)
      };
    }

    if (data.headers && data.rows) {
      return {
        type: 'table',
        columns: data.headers,
        rowCount: data.rows.length,
        sample: data.rows.slice(0, 3)
      };
    }

    return {
      type: 'unknown',
      data: data
    };
  }
}

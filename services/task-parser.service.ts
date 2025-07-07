import { AIAnalysisService } from './ai-analysis.service';
import type { AnalysisTask, DataSource, AnalysisQuestion, ProcessingStep } from '@/types/analysis.types';

export class TaskParser {
  private aiAnalysis: AIAnalysisService;

  constructor() {
    this.aiAnalysis = new AIAnalysisService();
  }

  async parseTask(taskDescription: string): Promise<AnalysisTask> {
    console.log('Parsing task description:', taskDescription);
    
    // Use AI to parse the task description
    const parsePrompt = `
Analyze this data analysis task and extract the structured information:

Task: ${taskDescription}

Extract and return a JSON object with the following structure:
{
  "type": "web_scraping" | "database_query" | "data_analysis" | "mixed",
  "dataSource": {
    "type": "web" | "database" | "duckdb" | "file",
    "url": "string if web scraping",
    "query": "string if database query",
    "filePath": "string if file"
  },
  "processing": [
    {
      "type": "filter" | "transform" | "aggregate" | "sort" | "join" | "calculate",
      "operation": "description of operation",
      "parameters": {}
    }
  ],
  "questions": [
    {
      "text": "exact question text",
      "type": "count" | "calculation" | "correlation" | "visualization" | "comparison" | "text" | "date",
      "visualization": {
        "type": "scatter" | "line" | "bar" | "pie" | "histogram" | "heatmap",
        "xAxis": "column name",
        "yAxis": "column name",
        "title": "chart title",
        "showRegression": true/false,
        "regressionStyle": "solid" | "dashed" | "dotted",
        "regressionColor": "color name",
        "width": number,
        "height": number,
        "format": "png" | "webp" | "jpeg"
      },
      "expectedFormat": "number" | "string" | "boolean" | "array" | "object" | "base64_image"
    }
  ],
  "outputFormat": "json_array" | "json_object" | "text",
  "context": "any additional context"
}

Focus on:
1. Identifying data sources (URLs, database queries, files)
2. Extracting specific questions to answer
3. Detecting visualization requirements (charts, plots, etc.)
4. Understanding data processing needs
5. Determining output format requirements

Return only the JSON object, no additional text.
`;

    try {
      const parseResult = await this.aiAnalysis.generateResponse(parsePrompt);
      
      // Try to parse the AI response as JSON
      let parsedTask: AnalysisTask;
      try {
        parsedTask = JSON.parse(parseResult);
      } catch (error) {
        console.error('Failed to parse AI response as JSON:', error);
        // Fallback to manual parsing
        parsedTask = await this.fallbackTaskParsing(taskDescription);
      }
      
      // Validate and enhance the parsed task
      parsedTask = this.validateAndEnhanceTask(parsedTask, taskDescription);
      
      return parsedTask;
    } catch (error) {
      console.error('Error in parseTask:', error);
      // Fallback to manual parsing
      return await this.fallbackTaskParsing(taskDescription);
    }
  }

  private async fallbackTaskParsing(taskDescription: string): Promise<AnalysisTask> {
    console.log('Using fallback task parsing');
    
    const task: AnalysisTask = {
      type: 'mixed',
      questions: [],
      outputFormat: 'json_array',
      context: taskDescription
    };

    // Extract URLs
    const urlMatch = taskDescription.match(/https?:\/\/[^\s]+/g);
    if (urlMatch) {
      task.dataSource = {
        type: 'web',
        url: urlMatch[0]
      };
      task.type = 'web_scraping';
    }

    // Extract DuckDB queries
    const duckdbMatch = taskDescription.match(/SELECT[\s\S]*?FROM[\s\S]*?;/i);
    if (duckdbMatch) {
      task.dataSource = {
        type: 'duckdb',
        query: duckdbMatch[0]
      };
      task.type = 'database_query';
    }

    // Extract questions - improved pattern to handle multi-line questions
    const questionMatches = taskDescription.match(/\d+\.\s+([^]*?)(?=\n\d+\.|$)/g);
    if (questionMatches) {
      task.questions = questionMatches.map(q => {
        const text = q.replace(/^\d+\.\s+/, '').trim();
        return {
          text,
          type: this.determineQuestionType(text),
          expectedFormat: this.determineExpectedFormat(text)
        };
      });
    } else {
      // If no numbered questions, treat entire description as one question
      task.questions = [{
        text: taskDescription,
        type: 'text',
        expectedFormat: 'string'
      }];
    }

    // Check for visualization requirements
    const visualizationKeywords = ['plot', 'chart', 'graph', 'scatterplot', 'scatter plot', 'visualization', 'draw'];
    task.questions.forEach(question => {
      if (visualizationKeywords.some(keyword => question.text.toLowerCase().includes(keyword))) {
        question.type = 'visualization';
        question.expectedFormat = 'base64_image';
        question.visualization = this.parseVisualizationConfig(question.text);
      }
    });

    // Determine output format
    if (taskDescription.includes('JSON array')) {
      task.outputFormat = 'json_array';
    } else if (taskDescription.includes('JSON object')) {
      task.outputFormat = 'json_object';
    }

    return task;
  }

  private determineQuestionType(questionText: string): AnalysisQuestion['type'] {
    const text = questionText.toLowerCase();
    
    if (text.includes('how many') || text.includes('count') || text.includes('number of')) {
      return 'count';
    }
    if (text.includes('correlation') || text.includes('relationship')) {
      return 'correlation';
    }
    if (text.includes('plot') || text.includes('chart') || text.includes('graph') || text.includes('visualization')) {
      return 'visualization';
    }
    if (text.includes('calculate') || text.includes('compute') || text.includes('average') || text.includes('sum')) {
      return 'calculation';
    }
    if (text.includes('compare') || text.includes('versus') || text.includes('vs')) {
      return 'comparison';
    }
    if (text.includes('date') || text.includes('time') || text.includes('when') || text.includes('earliest') || text.includes('latest')) {
      return 'date';
    }
    
    return 'text';
  }

  private determineExpectedFormat(questionText: string): AnalysisQuestion['expectedFormat'] {
    const text = questionText.toLowerCase();
    
    if (text.includes('base64') || text.includes('base-64') || text.includes('data:image') || text.includes('visualization') || text.includes('plot') || text.includes('chart')) {
      return 'base64_image';
    }
    if (text.includes('how many') || text.includes('count') || text.includes('number') || text.includes('correlation')) {
      return 'number';
    }
    if (text.includes('list') || text.includes('array')) {
      return 'array';
    }
    if (text.includes('true') || text.includes('false') || text.includes('yes') || text.includes('no')) {
      return 'boolean';
    }
    
    return 'string';
  }

  private parseVisualizationConfig(questionText: string): any {
    const text = questionText.toLowerCase();
    
    const config: any = {
      type: 'scatter',
      width: 800,
      height: 600,
      format: 'png'
    };

    // Determine chart type
    if (text.includes('scatterplot') || text.includes('scatter plot')) {
      config.type = 'scatter';
    } else if (text.includes('line') || text.includes('trend')) {
      config.type = 'line';
    } else if (text.includes('bar') || text.includes('column')) {
      config.type = 'bar';
    } else if (text.includes('pie')) {
      config.type = 'pie';
    } else if (text.includes('histogram')) {
      config.type = 'histogram';
    }

    // Check for regression line
    if (text.includes('regression')) {
      config.showRegression = true;
      
      if (text.includes('dotted')) {
        config.regressionStyle = 'dotted';
      } else if (text.includes('dashed')) {
        config.regressionStyle = 'dashed';
      } else {
        config.regressionStyle = 'solid';
      }
      
      // Extract color
      const colorMatch = text.match(/(\w+)\s+regression/);
      if (colorMatch) {
        config.regressionColor = colorMatch[1];
      }
    }

    // Extract axis information
    const axisMatch = text.match(/(\w+)\s+and\s+(\w+)/);
    if (axisMatch) {
      config.xAxis = axisMatch[1];
      config.yAxis = axisMatch[2];
    }

    return config;
  }

  private validateAndEnhanceTask(task: AnalysisTask, originalDescription: string): AnalysisTask {
    // Ensure required fields exist
    if (!task.questions || task.questions.length === 0) {
      task.questions = [{
        text: originalDescription,
        type: 'text',
        expectedFormat: 'string'
      }];
    }

    if (!task.outputFormat) {
      task.outputFormat = 'json_array';
    }

    if (!task.type) {
      task.type = 'mixed';
    }

    // Add context if not present
    if (!task.context) {
      task.context = originalDescription;
    }

    // Validate visualization configs
    task.questions.forEach(question => {
      if (question.type === 'visualization' && !question.visualization) {
        question.visualization = this.parseVisualizationConfig(question.text);
      }
    });

    return task;
  }
}
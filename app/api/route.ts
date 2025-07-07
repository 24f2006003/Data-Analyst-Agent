import { NextRequest, NextResponse } from 'next/server';
import { DataAnalystService } from '@/services/data-analyst.service';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const analysisRequestSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  timeout: z.number().optional().default(180000), // 3 minutes default
});

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Parse request body
    let body: { task: string; timeout?: number };
    
    try {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const taskFile = formData.get('task') as File;
        const taskText = formData.get('taskText') as string;
        
        if (taskFile) {
          body = { task: await taskFile.text() };
        } else if (taskText) {
          body = { task: taskText };
        } else {
          throw new Error('No task provided in form data');
        }
      } else {
        // Try to parse as plain text
        const text = await request.text();
        body = { task: text };
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Validate request
    const validationResult = analysisRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    let { task, timeout } = validationResult.data;

    // Handle file:// references from promptfoo
    if (task.startsWith('file://')) {
      try {
        const fileName = task.replace('file://', '');
        const filePath = path.resolve(process.cwd(), fileName);
        task = fs.readFileSync(filePath, 'utf8');
      } catch (error) {
        console.error('Error reading file:', error);
        return NextResponse.json(
          { error: 'Could not read specified file' },
          { status: 400 }
        );
      }
    }

    // Create data analyst service
    const dataAnalyst = new DataAnalystService();

    // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout')), timeout);
    });

    // Execute analysis
    const analysisPromise = dataAnalyst.analyzeTask(task);

    try {
      const result = await Promise.race([analysisPromise, timeoutPromise]) as any;
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Return the result data directly for evaluation compatibility
      if (result && result.data !== undefined) {
        return NextResponse.json(result.data);
      } else {
        return NextResponse.json(result);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error instanceof Error && error.message === 'Analysis timeout') {
        return NextResponse.json(
          { 
            error: 'Analysis timeout - task took longer than expected',
            processingTime: `${timeout}ms`
          },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Analysis failed', 
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Data Analyst Agent API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
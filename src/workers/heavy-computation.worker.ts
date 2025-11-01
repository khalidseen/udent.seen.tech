// Web Worker for heavy computations
// This runs in a separate thread and doesn't block the UI

interface WorkerMessage {
  type: 'PROCESS_DATA' | 'GENERATE_REPORT' | 'CALCULATE_STATS';
  payload: any;
}

interface WorkerResponse {
  type: 'SUCCESS' | 'ERROR';
  data?: any;
  error?: string;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  try {
    let result;

    switch (type) {
      case 'PROCESS_DATA':
        result = processLargeDataset(payload);
        break;

      case 'GENERATE_REPORT':
        result = await generateReport(payload);
        break;

      case 'CALCULATE_STATS':
        result = calculateStatistics(payload);
        break;

      default:
        throw new Error(`Unknown worker task: ${type}`);
    }

    const response: WorkerResponse = {
      type: 'SUCCESS',
      data: result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
};

// Heavy computation functions
function processLargeDataset(data: any[]) {
  // Process large arrays without blocking UI
  return data.map((item) => ({
    ...item,
    processed: true,
    timestamp: Date.now(),
  }));
}

async function generateReport(data: any) {
  // Simulate heavy report generation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: 'Report generated',
        timestamp: Date.now(),
        data,
      });
    }, 100);
  });
}

function calculateStatistics(data: any[]) {
  // Heavy statistical calculations
  const sum = data.reduce((acc, item) => acc + (item.value || 0), 0);
  const avg = data.length > 0 ? sum / data.length : 0;
  const max = Math.max(...data.map((item) => item.value || 0));
  const min = Math.min(...data.map((item) => item.value || 0));

  return { sum, avg, max, min, count: data.length };
}

export {};

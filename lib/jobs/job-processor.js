// Simple job processor for AI automation tasks
const { getAutomationJobs } = require('./ai-automation-jobs');

async function runJobProcessor() {
  console.log('Starting AI automation job processor...');
  
  const jobs = getAutomationJobs();
  
  // Run jobs every 5 minutes
  setInterval(async () => {
    try {
      console.log('Running automated jobs...');
      await jobs.runAllJobs();
      console.log('Automated jobs completed successfully');
    } catch (error) {
      console.error('Error running automated jobs:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('Shutting down job processor...');
    process.exit(0);
  });
  
  console.log('Job processor is running. Press Ctrl+C to stop.');
}

// Only run if this file is executed directly
if (require.main === module) {
  runJobProcessor().catch(console.error);
}

module.exports = { runJobProcessor };
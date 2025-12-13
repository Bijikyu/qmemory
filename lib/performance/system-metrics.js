/**
 * System Resource Monitoring
 * 
 * Comprehensive system resource tracking including memory usage patterns, CPU utilization,
 * and process health metrics. This class provides early warning capabilities for resource
 * exhaustion scenarios and supports capacity planning decisions.
 */

class SystemMetrics {
    constructor(options = {}) {
        // Configuration with production-appropriate defaults
        this.collectionInterval = options.collectionInterval || 30000; // 30 seconds default
        this.maxHistoryPoints = options.maxHistoryPoints || 2880; // 24 hours at 30s intervals
        
        // Historical data storage with bounded memory usage
        this.memoryHistory = [];        // chronological memory usage snapshots
        this.cpuHistory = [];           // chronological CPU utilization measurements
        
        // CPU calculation state for accurate percentage calculations
        this.lastCpuUsage = process.cpuUsage();  // baseline for relative CPU measurement
        this.startTime = process.hrtime();       // high-resolution time reference
        
        console.log(`SystemMetrics initialized with ${this.collectionInterval}ms collection interval`);
        
        // Start automated metrics collection for continuous monitoring
        this.collectionTimer = setInterval(() => this.collectMetrics(), this.collectionInterval);
    }

    /**
     * Collects current system resource metrics and updates historical data
     */
    collectMetrics() {
        console.log('SystemMetrics collecting current resource measurements');
        
        // Capture current memory utilization from Node.js process
        const memory = process.memoryUsage();
        
        // Calculate CPU utilization since last measurement
        const cpuUsage = process.cpuUsage(this.lastCpuUsage);
        const elapsed = process.hrtime(this.startTime);
        const elapsedMS = elapsed[0] * 1000 + elapsed[1] / 1000000;
        
        // Convert CPU microseconds to percentage over elapsed time
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / elapsedMS * 100;
        
        // Store memory snapshot with temporal context
        this.memoryHistory.push({
            timestamp: Date.now(),                  // temporal reference for trend analysis
            rss: memory.rss,                        // total process memory allocation
            heapUsed: memory.heapUsed,              // active JavaScript heap consumption
            heapTotal: memory.heapTotal,            // total heap space allocated
            external: memory.external               // C++ object memory binding
        });
        
        // Store CPU measurement with temporal context
        this.cpuHistory.push({
            timestamp: Date.now(),                  // temporal reference for trend analysis
            percent: cpuPercent                     // CPU utilization percentage
        });
        
        // Maintain bounded historical data to prevent unlimited memory growth
        if (this.memoryHistory.length > this.maxHistoryPoints) {
            this.memoryHistory.shift(); // Remove oldest memory measurement
        }
        if (this.cpuHistory.length > this.maxHistoryPoints) {
            this.cpuHistory.shift(); // Remove oldest CPU measurement
        }
        
        // Update CPU calculation baseline for next measurement cycle
        this.lastCpuUsage = process.cpuUsage();
        this.startTime = process.hrtime();
        
        console.log(`SystemMetrics collected: CPU=${cpuPercent.toFixed(2)}%, Heap=${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    /**
     * Generates comprehensive system resource metrics report
     * 
     * @returns {Object} Comprehensive system resource metrics report
     */
    getMetrics() {
        console.log('SystemMetrics generating comprehensive metrics report');
        
        // Capture current memory state for real-time monitoring
        const currentMemory = process.memoryUsage();
        
        // Calculate recent CPU average for current utilization assessment
        const recentCpu = this.cpuHistory.slice(-10); // Last 10 measurements
        const avgCpu = recentCpu.length > 0 
            ? recentCpu.reduce((sum, point) => sum + point.percent, 0) / recentCpu.length 
            : 0;
        
        const metrics = {
            memory: {
                current: {
                    rss: Math.round(currentMemory.rss / 1024 / 1024 * 100) / 100,              // MB precision
                    heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024 * 100) / 100,    // MB precision
                    heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024 * 100) / 100,  // MB precision
                    external: Math.round(currentMemory.external / 1024 / 1024 * 100) / 100     // MB precision
                },
                history: this.memoryHistory.slice(-100) // Recent trend data for analysis
            },
            cpu: {
                current: Math.round(avgCpu * 100) / 100,                    // Current utilization percentage
                history: this.cpuHistory.slice(-100)                       // Recent trend data for analysis
            },
            uptime: Math.round(process.uptime()),                           // Process availability duration
            nodeVersion: process.version                                    // Runtime environment context
        };
        
        console.log(`SystemMetrics report generated: CPU=${metrics.cpu.current}%, Heap=${metrics.memory.current.heapUsed}MB`);
        return metrics;
    }

    /**
     * Stops automated metrics collection and cleans up resources
     */
    stop() {
        console.log('SystemMetrics stopping automated collection');
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }
    }
}

module.exports = SystemMetrics;
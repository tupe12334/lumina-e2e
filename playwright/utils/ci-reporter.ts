import type { TestResult, TestCase, FullResult, Reporter } from '@playwright/test/reporter';
import { promises as fs } from 'fs';
import path from 'path';
import * as process from 'process';

/**
 * Custom reporter for enhanced CI/CD integration
 */
export class CIReporter implements Reporter {
  private testResults: Array<{
    test: TestCase;
    result: TestResult;
    duration: number;
    status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
    error?: string;
    failureScreenshot?: string;
  }> = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const duration = result.duration;
    const status = result.status;
    const error = result.error?.message;

    this.testResults.push({
      test,
      result,
      duration,
      status,
      error,
      failureScreenshot: this.findFailureScreenshot(result),
    });

    // Log to console for immediate feedback
    const emoji = this.getStatusEmoji(status);
    const testTitle = `${test.parent.title} > ${test.title}`;
    console.log(`${emoji} ${testTitle} (${duration}ms)`);

    if (error) {
      console.error(`  ❌ Error: ${error}`);
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const summary = this.generateTestSummary(result);
    await this.generateReports(summary);
    
    // Log final summary
    this.logFinalSummary(summary);
    
    // Set exit code based on results
    if (summary.summary.failed > 0) {
      process.exitCode = 1;
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'timedOut': return '⏱️';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  private findFailureScreenshot(result: TestResult): string | undefined {
    const attachment = result.attachments.find(
      att => att.name === 'screenshot' && att.contentType.startsWith('image/')
    );
    return attachment?.path;
  }

  private generateTestSummary(result: FullResult) {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;
    const timedOut = this.testResults.filter(r => r.status === 'timedOut').length;

    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

    const failedTests = this.testResults
      .filter(r => r.status === 'failed')
      .map(r => ({
        title: `${r.test.parent.title} > ${r.test.title}`,
        error: r.error,
        duration: r.duration,
        screenshot: r.failureScreenshot,
        file: r.test.location?.file,
        line: r.test.location?.line,
      }));

    const slowestTests = this.testResults
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(r => ({
        title: `${r.test.parent.title} > ${r.test.title}`,
        duration: r.duration,
        status: r.status,
      }));

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed,
        failed,
        skipped,
        timedOut,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      },
      timing: {
        totalDuration: Math.round(totalDuration),
        avgDuration,
        totalDurationFormatted: this.formatDuration(totalDuration),
      },
      failedTests,
      slowestTests,
      environment: {
        ci: Boolean(process.env.CI),
        node: process.version,
        os: process.platform,
        baseUrl: process.env.E2E_BASE_URL || 'http://localhost:4174',
      },
      playwright: {
        status: result.status,
        startTime: result.startTime.toISOString(),
      },
    };
  }

  private async generateReports(summary: any): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(reportsDir, { recursive: true });

    // 1. Generate JSON report
    const jsonReportPath = path.join(reportsDir, 'ci-report.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(summary, null, 2));

    // 2. Generate markdown report for GitHub
    const markdownReport = await this.generateMarkdownReport(summary);
    const mdReportPath = path.join(reportsDir, 'test-summary.md');
    await fs.writeFile(mdReportPath, markdownReport);

    // 3. Generate JUnit XML for CI systems
    const junitReport = this.generateJUnitXML(summary);
    const junitPath = path.join(reportsDir, 'junit-results.xml');
    await fs.writeFile(junitPath, junitReport);

    // 4. Generate failure analysis if there are failures
    if (summary.failedTests.length > 0) {
      const failureAnalysis = await this.generateFailureAnalysis(summary.failedTests);
      const analysisPath = path.join(reportsDir, 'failure-analysis.md');
      await fs.writeFile(analysisPath, failureAnalysis);
    }

    console.log(`📊 Reports generated in: ${reportsDir}`);
  }

  private async generateMarkdownReport(summary: any): Promise<string> {
    const { summary: testSummary, timing, failedTests, slowestTests, environment } = summary;
    const statusIcon = testSummary.summary.failed > 0 ? '❌' : '✅';
    
    let report = `# E2E Test Report ${statusIcon}\n\n`;
    report += `**Generated:** ${summary.timestamp}\n`;
    report += `**Environment:** ${environment.ci ? 'CI' : 'Local'}\n`;
    report += `**Base URL:** ${environment.baseUrl}\n\n`;

    // Summary table
    report += `## Summary\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Total Tests | ${testSummary.total} |\n`;
    report += `| ✅ Passed | ${testSummary.passed} |\n`;
    report += `| ❌ Failed | ${testSummary.summary.failed} |\n`;
    report += `| ⏭️ Skipped | ${testSummary.skipped} |\n`;
    report += `| ⏱️ Timed Out | ${testSummary.timedOut} |\n`;
    report += `| 📊 Pass Rate | ${testSummary.passRate}% |\n`;
    report += `| ⏱️ Total Duration | ${timing.totalDurationFormatted} |\n`;
    report += `| 📈 Avg Duration | ${timing.avgDuration}ms |\n\n`;

    // Failed tests
    if (failedTests.length > 0) {
      report += `## Failed Tests\n\n`;
      for (const test of failedTests) {
        report += `### ❌ ${test.title}\n`;
        report += `**Duration:** ${test.duration}ms\n`;
        if (test.file) {
          report += `**File:** ${test.file}:${test.line || 0}\n`;
        }
        if (test.error) {
          report += `**Error:**\n\`\`\`\n${test.error}\n\`\`\`\n`;
        }
        if (test.screenshot) {
          report += `**Screenshot:** ${test.screenshot}\n`;
        }
        report += `\n`;
      }
    }

    // Slowest tests
    report += `## Slowest Tests\n\n`;
    report += `| Test | Duration | Status |\n`;
    report += `|------|----------|--------|\n`;
    for (const test of slowestTests) {
      const statusIcon = this.getStatusEmoji(test.status);
      report += `| ${test.title} | ${test.duration}ms | ${statusIcon} |\n`;
    }

    return report;
  }

  private generateJUnitXML(summary: any): string {
    const { summary: testSummary, timing } = summary;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="E2E Tests" tests="${testSummary.total}" failures="${testSummary.summary.failed}" time="${timing.totalDuration / 1000}">\n`;
    xml += `  <testsuite name="Playwright E2E" tests="${testSummary.total}" failures="${testSummary.summary.failed}" time="${timing.totalDuration / 1000}">\n`;
    
    for (const testResult of this.testResults) {
      const testName = `${testResult.test.parent.title} > ${testResult.test.title}`;
      const duration = testResult.duration / 1000;
      
      xml += `    <testcase name="${this.escapeXml(testName)}" time="${duration}"`;
      
      if (testResult.status === 'failed') {
        xml += `>\n`;
        xml += `      <failure message="${this.escapeXml(testResult.error || 'Test failed')}">\n`;
        xml += `        ${this.escapeXml(testResult.error || 'No error message')}\n`;
        xml += `      </failure>\n`;
        xml += `    </testcase>\n`;
      } else if (testResult.status === 'skipped') {
        xml += `>\n`;
        xml += `      <skipped/>\n`;
        xml += `    </testcase>\n`;
      } else {
        xml += `/>\n`;
      }
    }
    
    xml += `  </testsuite>\n`;
    xml += `</testsuites>\n`;
    
    return xml;
  }

  private async generateFailureAnalysis(failedTests: any[]): Promise<string> {
    let analysis = `# Failure Analysis\n\n`;
    analysis += `**Generated:** ${new Date().toISOString()}\n`;
    analysis += `**Failed Tests:** ${failedTests.length}\n\n`;

    // Group failures by error pattern
    const errorPatterns = new Map<string, any[]>();
    
    for (const test of failedTests) {
      if (test.error) {
        const errorKey = this.extractErrorPattern(test.error);
        if (!errorPatterns.has(errorKey)) {
          errorPatterns.set(errorKey, []);
        }
        errorPatterns.get(errorKey)!.push(test);
      }
    }

    analysis += `## Error Patterns\n\n`;
    
    for (const [pattern, tests] of errorPatterns) {
      analysis += `### ${pattern} (${tests.length} tests)\n\n`;
      analysis += `**Affected tests:**\n`;
      for (const test of tests) {
        analysis += `- ${test.title} (${test.duration}ms)\n`;
      }
      analysis += `\n**Error details:**\n\`\`\`\n${tests[0].error}\n\`\`\`\n\n`;
    }

    // Add recommendations
    analysis += `## Recommendations\n\n`;
    analysis += `1. **Review error patterns** above to identify common failure causes\n`;
    analysis += `2. **Check for flaky tests** that fail intermittently\n`;
    analysis += `3. **Verify test environment** configuration and dependencies\n`;
    analysis += `4. **Review recent code changes** that might have introduced regressions\n`;
    analysis += `5. **Consider adding more wait conditions** for elements that might load asynchronously\n\n`;

    return analysis;
  }

  private extractErrorPattern(error: string): string {
    // Extract meaningful error patterns
    if (error.includes('TimeoutError')) return 'Timeout Error';
    if (error.includes('Element not found')) return 'Element Not Found';
    if (error.includes('Navigation timeout')) return 'Navigation Timeout';
    if (error.includes('Network')) return 'Network Error';
    if (error.includes('Authentication')) return 'Authentication Error';
    
    // Fallback to first line of error
    return error.split('\n')[0] || 'Unknown Error';
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private logFinalSummary(summary: any): void {
    const { summary: testSummary, timing } = summary;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 E2E TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed:     ${testSummary.passed}/${testSummary.total} (${testSummary.passRate}%)`);
    console.log(`❌ Failed:     ${testSummary.summary.failed}`);
    console.log(`⏭️ Skipped:    ${testSummary.skipped}`);
    console.log(`⏱️ Timed Out:  ${testSummary.timedOut}`);
    console.log(`⏱️ Duration:   ${timing.totalDurationFormatted}`);
    console.log('='.repeat(60));
    
    if (testSummary.summary.failed > 0) {
      console.log('❌ Some tests failed. Check the reports for details.');
    } else {
      console.log('✅ All tests passed!');
    }
  }
}
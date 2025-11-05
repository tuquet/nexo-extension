/**
 * Migration Test Panel
 * Debug panel to verify schema v7 migration in development
 */

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@extension/ui';
import {
  exportDatabase,
  fixMissingMetadata,
  rebuildMappingsFromScenes,
  removeDuplicateMappings,
  verifyMigration,
} from '@src/utils/migration-test-utils';
import { AlertCircle, CheckCircle2, Download, RefreshCw, Wrench } from 'lucide-react';
import { useState } from 'react';
import type { MigrationTestResult } from '@src/utils/migration-test-utils';
import type React from 'react';

const MigrationTestPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<MigrationTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      const result = await verifyMigration();
      setTestResult(result);
    } catch (error) {
      console.error('[MigrationTest] Failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFixMetadata = async () => {
    setIsRunning(true);
    try {
      const fixed = await fixMissingMetadata();
      alert(`Fixed metadata for ${fixed} assets`);
      await handleRunTest(); // Re-run test
    } catch (error) {
      console.error('[MigrationTest] Fix failed:', error);
      alert('Failed to fix metadata');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRebuildMappings = async () => {
    setIsRunning(true);
    try {
      const created = await rebuildMappingsFromScenes();
      alert(`Created ${created} mappings from scene data`);
      await handleRunTest();
    } catch (error) {
      console.error('[MigrationTest] Rebuild failed:', error);
      alert('Failed to rebuild mappings');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    setIsRunning(true);
    try {
      const removed = await removeDuplicateMappings();
      alert(`Removed ${removed} duplicate mappings`);
      await handleRunTest();
    } catch (error) {
      console.error('[MigrationTest] Cleanup failed:', error);
      alert('Failed to remove duplicates');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportDB = async () => {
    await exportDatabase();
  };

  return (
    <Card className="mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="size-5" />
          Schema v7 Migration Test Panel
        </CardTitle>
        <CardDescription>Verify database migration integrity and fix issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Actions */}
        <div className="flex gap-2">
          <Button onClick={handleRunTest} disabled={isRunning}>
            {isRunning ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 size-4" />
                Run Test
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportDB}>
            <Download className="mr-2 size-4" />
            Export Backup
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="size-5" />
                  <span className="font-semibold">Migration Successful</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="size-5" />
                  <span className="font-semibold">Migration Issues Detected</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-muted/50 grid grid-cols-2 gap-4 rounded-lg border p-4 md:grid-cols-5">
              <div>
                <p className="text-muted-foreground text-sm">Total Assets</p>
                <p className="text-2xl font-bold">{testResult.stats.totalAssets}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Mappings</p>
                <p className="text-2xl font-bold">{testResult.stats.totalMappings}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">With Metadata</p>
                <p className="text-2xl font-bold text-green-600">{testResult.stats.assetsWithMetadata}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Orphaned</p>
                <p className="text-2xl font-bold text-yellow-600">{testResult.stats.orphanedAssets}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Duplicates</p>
                <p className="text-2xl font-bold text-red-600">{testResult.stats.duplicateMappings}</p>
              </div>
            </div>

            {/* Errors */}
            {testResult.errors.length > 0 && (
              <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
                <h3 className="mb-2 font-semibold text-red-800 dark:text-red-400">Errors</h3>
                <ul className="space-y-1 text-sm">
                  {testResult.errors.map((error, i) => (
                    <li key={i} className="text-red-700 dark:text-red-300">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {testResult.warnings.length > 0 && (
              <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950/20">
                <h3 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-400">
                  Warnings ({testResult.warnings.length})
                </h3>
                <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
                  {testResult.warnings.slice(0, 10).map((warning, i) => (
                    <p key={i} className="text-yellow-700 dark:text-yellow-300">
                      • {warning}
                    </p>
                  ))}
                  {testResult.warnings.length > 10 && (
                    <p className="italic text-yellow-600">... and {testResult.warnings.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Fix Actions */}
            {(testResult.stats.assetsWithMetadata < testResult.stats.totalAssets ||
              testResult.stats.duplicateMappings > 0) && (
              <div className="bg-card space-y-2 rounded-lg border p-4">
                <h3 className="font-semibold">Fix Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {testResult.stats.assetsWithMetadata < testResult.stats.totalAssets && (
                    <Button variant="outline" size="sm" onClick={handleFixMetadata} disabled={isRunning}>
                      Fix Missing Metadata
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleRebuildMappings} disabled={isRunning}>
                    Rebuild Mappings
                  </Button>
                  {testResult.stats.duplicateMappings > 0 && (
                    <Button variant="outline" size="sm" onClick={handleRemoveDuplicates} disabled={isRunning}>
                      Remove Duplicates
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { MigrationTestPanel };

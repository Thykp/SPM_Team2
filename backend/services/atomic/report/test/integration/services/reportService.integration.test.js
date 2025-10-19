// Load environment variables (following task service pattern)
require('dotenv').config();

// Integration tests for reportService with real Supabase
// Requires SUPABASE_URL and SUPABASE_API_KEY environment variables
const { createReport, createReportStorage, createReportStorageFromPath, createReportStorageFromFile } = require('../../../services/reportService');
const { supabase } = require('../../../db/supabase');
const { InternalError, ValidationError } = require('../../../model/AppError');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('ReportService Integration Tests', () => {
    let consoleErrorSpy;
    let testReportId;
    let testFilePath;
    let testFileName;
    const TEST_PROFILE_ID = '268daf6f-363d-4ca1-9a53-7fd6e3985746';

    beforeAll(async () => {
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        // Check environment variables (following task service pattern)
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_API_KEY) {
            throw new Error('SUPABASE_URL and SUPABASE_API_KEY must be set in environment variables for integration tests');
        }
        
        // Use sample PDF file from fixtures
        testFileName = `test-report-${Date.now()}.pdf`;
        testFilePath = path.join(__dirname, '../../fixtures/sample-report.pdf');
    });

    afterAll(async () => {
        // Clean up test data
        if (testReportId) {
            try {
                await supabase
                    .from('revamped_report')
                    .delete()
                    .eq('id', testReportId);
            } catch (error) {
                console.warn('Failed to clean up test report:', error.message);
            }
        }

        // Clean up uploaded files from storage
        try {
            await supabase.storage
                .from('reports')
                .remove([testFileName]);
        } catch (error) {
            console.warn('Failed to clean up test file from storage:', error.message);
        }

        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Environment Setup', () => {
        test('Should have valid Supabase connection', async () => {
            // Test basic Supabase connection
            const { data, error } = await supabase
                .from('revamped_report')
                .select('count')
                .limit(1);

            if (error) {
                throw error;
            }

            expect(data).toBeDefined();
        });

        test('Should have access to reports storage bucket', async () => {
            // Test storage bucket access
            const { data, error } = await supabase.storage
                .from('reports')
                .list('', { limit: 1 });

            if (error) {
                throw error;
            }

            expect(data).toBeDefined();
        });
    });

    describe('createReport', () => {
        test('Should create report metadata in real database', async () => {
            const reportData = {
                profile_id: TEST_PROFILE_ID,
                title: `Integration Test Report - ${Date.now()}`
            };
            const filePath = 'https://example.com/reports/test-report.pdf';

            const result = await createReport(reportData, filePath);

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            
            // Store the report ID for cleanup
            testReportId = result;
        });
    });

    describe('createReportStorage', () => {
        test('Should upload real PDF file to Supabase storage', async () => {
            const result = await createReportStorage(testFilePath);

            expect(result).toBeDefined();
            expect(result.uploadData).toBeDefined();
            expect(result.publicUrl).toBeDefined();
            expect(typeof result.publicUrl).toBe('string');
            expect(result.publicUrl).toContain('supabase');
        });
    });

    describe('Complete Workflow Integration', () => {
        test('Should complete full report creation workflow', async () => {
            // Step 1: Upload file to storage
            const storageResult = await createReportStorage(testFilePath);
            expect(storageResult).toBeDefined();
            expect(storageResult.publicUrl).toBeDefined();

            // Step 2: Create report metadata
            const reportData = {
                profile_id: TEST_PROFILE_ID,
                title: `Complete Workflow Test - ${Date.now()}`
            };

            const reportResult = await createReport(reportData, storageResult.publicUrl);
            expect(reportResult).toBeDefined();

            // Step 3: Verify the report was created in database
            const { data: reports, error } = await supabase
                .from('revamped_report')
                .select('*')
                .eq('profile_id', TEST_PROFILE_ID)
                .order('created_at', { ascending: false })
                .limit(1);

            expect(error).toBeNull();
            expect(reports).toBeDefined();
            expect(reports.length).toBeGreaterThan(0);
            expect(reports[0].filepath).toBe(storageResult.publicUrl);
        });
    });
});
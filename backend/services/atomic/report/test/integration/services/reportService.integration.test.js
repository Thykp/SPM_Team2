// Load environment variables (following task service pattern)
require('dotenv').config();

// Integration tests for reportService with real Supabase
// Requires SUPABASE_URL and SUPABASE_API_KEY environment variables
const { createReport, createReportStorage, createReportStorageFromPath, createReportStorageFromFile, getReportsByProfileId, deleteReport } = require('../../../services/reportService');
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
    const TEST_PROFILE_ID = 'e9f9a36c-5d22-49c8-9493-30cbf2f3fc67';

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

    describe('getReportsByProfileId', () => {
        test('Should fetch reports by profile_id from real database', async () => {
            // First create a report to ensure there's data
            const storageResult = await createReportStorage(testFilePath);
            const reportData = {
                profile_id: TEST_PROFILE_ID,
                title: `Get Reports Test - ${Date.now()}`
            };
            await createReport(reportData, storageResult.publicUrl);

            // Now fetch reports for this profile
            const reports = await getReportsByProfileId(TEST_PROFILE_ID);

            expect(reports).toBeDefined();
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBeGreaterThan(0);
            
            // Verify the report structure
            const report = reports[0];
            expect(report).toHaveProperty('id');
            expect(report).toHaveProperty('profile_id');
            expect(report).toHaveProperty('title');
            expect(report).toHaveProperty('filepath');
            expect(report).toHaveProperty('created_at');
            expect(report.profile_id).toBe(TEST_PROFILE_ID);
        });

        test('Should return empty array for profile with no reports', async () => {
            const nonExistentProfileId = '00000000-0000-0000-0000-000000000000';
            const reports = await getReportsByProfileId(nonExistentProfileId);

            expect(reports).toBeDefined();
            expect(Array.isArray(reports)).toBe(true);
            expect(reports.length).toBe(0);
        });

        test('Should order reports by created_at descending', async () => {
            const reports = await getReportsByProfileId(TEST_PROFILE_ID);

            if (reports.length > 1) {
                for (let i = 0; i < reports.length - 1; i++) {
                    const currentDate = new Date(reports[i].created_at);
                    const nextDate = new Date(reports[i + 1].created_at);
                    expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
                }
            }
        });
    });

    describe('deleteReport', () => {
        let testReportIdForDeletion;
        let testFileNameForDeletion;

        beforeAll(async () => {
            // Create a test report specifically for deletion
            testFileNameForDeletion = `test-delete-${Date.now()}.pdf`;
            const fileBuffer = await fs.readFile(testFilePath);
            
            const { publicUrl } = await createReportStorage(fileBuffer, testFileNameForDeletion);
            
            const reportData = {
                profile_id: TEST_PROFILE_ID,
                title: `Delete Test Report - ${Date.now()}`
            };
            
            const filepath = await createReport(reportData, publicUrl);
            
            // Get the report ID
            const reports = await supabase
                .from('revamped_report')
                .select('*')
                .eq('filepath', publicUrl)
                .limit(1);
            
            if (reports.data && reports.data.length > 0) {
                testReportIdForDeletion = reports.data[0].id;
            }
        });

        test('Should delete report and file from real storage', async () => {
            expect(testReportIdForDeletion).toBeDefined();

            // Delete the report
            const deletedReport = await deleteReport(testReportIdForDeletion);

            expect(deletedReport).toBeDefined();
            expect(deletedReport.id).toBe(testReportIdForDeletion);
            expect(deletedReport.profile_id).toBe(TEST_PROFILE_ID);

            // Verify the report is deleted from database
            const { data: reports, error } = await supabase
                .from('revamped_report')
                .select('*')
                .eq('id', testReportIdForDeletion);

            expect(error).toBeNull();
            expect(reports).toBeDefined();
            expect(reports.length).toBe(0);

            // Verify the file is deleted from storage
            const { data: files, error: storageError } = await supabase.storage
                .from('reports')
                .list('', { 
                    search: testFileNameForDeletion 
                });

            expect(storageError).toBeNull();
            expect(files).toBeDefined();
            // File should not be found
            const fileExists = files.some(file => file.name === testFileNameForDeletion);
            expect(fileExists).toBe(false);
        });

        test('Should throw ValidationError when deleting non-existent report', async () => {
            const nonExistentReportId = '00000000-0000-0000-0000-000000000000';

            await expect(deleteReport(nonExistentReportId))
                .rejects
                .toThrow('Report not found');
        });
    });
});
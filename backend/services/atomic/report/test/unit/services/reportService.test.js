// Mock environment variables before importing modules
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_API_KEY = 'test-key';

const { supabase } = require('../../../db/supabase');
const { createReport, createReportStorage, createReportStorageFromPath, createReportStorageFromFile, getReportsByProfileId, deleteReport } = require('../../../services/reportService');
const { InternalError, ValidationError } = require('../../../model/AppError');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('../../../db/supabase');
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));
jest.mock('path');

describe('ReportService', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('createReport', () => {
        test('Should create report metadata successfully', async () => {
            const reportData = {
                profile_id: 'user-123',
                title: 'Test Report'
            };
            const filePath = 'https://example.com/reports/test-report.pdf';

            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: [{ filepath: 'test-filepath' }],
                        error: null
                    })
                })
            });

            const result = await createReport(reportData, filePath);

            expect(supabase.from).toHaveBeenCalledWith('revamped_report');
            expect(result).toBe('test-filepath');
        });

        test('Should throw InternalError when database insert fails', async () => {
            const reportData = {
                profile_id: 'user-123',
                title: 'Test Report'
            };
            const filePath = 'https://example.com/reports/test-report.pdf';

            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Database connection failed' }
                    })
                })
            });

            await expect(createReport(reportData, filePath))
                .rejects
                .toThrow(InternalError);

            await expect(createReport(reportData, filePath))
                .rejects
                .toThrow('Failed to save report metadata to database');
        });

        test('Should handle report data with all required fields', async () => {
            const reportData = {
                profile_id: 'user-456',
                title: 'Personal Task Report - January 2024'
            };
            const filePath = 'https://example.com/reports/user-456-report.pdf';

            supabase.from = jest.fn().mockReturnValue({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValue({
                        data: [{ filepath: 'success-filepath' }],
                        error: null
                    })
                })
            });

            await createReport(reportData, filePath);

            expect(supabase.from).toHaveBeenCalledWith('revamped_report');
        });
    });

    describe('createReportStorageFromPath', () => {
        test('Should upload file from path successfully', async () => {
            const filePath = '/tmp/test-report.pdf';
            const mockBuffer = Buffer.from('mock-pdf-content');
            
            fs.readFile.mockResolvedValue(mockBuffer);
            path.basename.mockReturnValue('test-report.pdf');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/test-file.pdf' },
                        error: null
                    })
                })
            };

            const result = await createReportStorageFromPath(filePath);

            expect(fs.readFile).toHaveBeenCalledWith(filePath);
            expect(path.basename).toHaveBeenCalledWith(filePath);
            expect(supabase.storage.from).toHaveBeenCalledWith('reports');
            expect(result).toEqual({ path: 'reports/test-file.pdf' });
        });

        test('Should throw InternalError when file read fails', async () => {
            const filePath = '/tmp/nonexistent.pdf';
            
            fs.readFile.mockRejectedValue(new Error('File not found'));

            await expect(createReportStorageFromPath(filePath))
                .rejects
                .toThrow('File not found');
        });

        test('Should throw InternalError when storage upload fails', async () => {
            const filePath = '/tmp/test-report.pdf';
            const mockBuffer = Buffer.from('mock-pdf-content');
            
            fs.readFile.mockResolvedValue(mockBuffer);
            path.basename.mockReturnValue('test-report.pdf');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Storage service unavailable' }
                    })
                })
            };

            await expect(createReportStorageFromPath(filePath))
                .rejects
                .toThrow(InternalError);

            await expect(createReportStorageFromPath(filePath))
                .rejects
                .toThrow('Failed to upload report to storage');
        });
    });

    describe('createReportStorageFromFile', () => {
        test('Should upload file from buffer successfully', async () => {
            const fileName = 'test-report.pdf';
            const fileBuffer = Buffer.from('mock-pdf-content');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/test-file.pdf' },
                        error: null
                    })
                })
            };

            const result = await createReportStorageFromFile(fileName, fileBuffer);

            expect(supabase.storage.from).toHaveBeenCalledWith('reports');
            expect(result).toEqual({ path: 'reports/test-file.pdf' });
        });

        test('Should throw InternalError when storage upload fails', async () => {
            const fileName = 'test-report.pdf';
            const fileBuffer = Buffer.from('mock-pdf-content');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Storage quota exceeded' }
                    })
                })
            };

            await expect(createReportStorageFromFile(fileName, fileBuffer))
                .rejects
                .toThrow(InternalError);

            await expect(createReportStorageFromFile(fileName, fileBuffer))
                .rejects
                .toThrow('Failed to upload report to storage');
        });
    });

    describe('createReportStorage', () => {
        test('Should handle file path input', async () => {
            const filePath = '/tmp/test-report.pdf';
            const mockBuffer = Buffer.from('mock-pdf-content');
            
            fs.readFile.mockResolvedValue(mockBuffer);
            path.basename.mockReturnValue('test-report.pdf');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/test-file.pdf' },
                        error: null
                    }),
                    getPublicUrl: jest.fn().mockReturnValue({
                        data: { publicUrl: 'https://example.com/reports/test-file.pdf' }
                    })
                })
            };

            const result = await createReportStorage(filePath);

            expect(fs.readFile).toHaveBeenCalledWith(filePath);
            expect(result).toEqual({
                uploadData: { path: 'reports/test-file.pdf' },
                publicUrl: 'https://example.com/reports/test-file.pdf'
            });
        });

        test('Should handle buffer input with fileName', async () => {
            const fileName = 'test-report.pdf';
            const fileBuffer = Buffer.from('mock-pdf-content');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/test-file.pdf' },
                        error: null
                    }),
                    getPublicUrl: jest.fn().mockReturnValue({
                        data: { publicUrl: 'https://example.com/reports/test-file.pdf' }
                    })
                })
            };

            const result = await createReportStorage(fileBuffer, fileName);

            expect(result).toEqual({
                uploadData: { path: 'reports/test-file.pdf' },
                publicUrl: 'https://example.com/reports/test-file.pdf'
            });
        });

        test('Should throw ValidationError when buffer input missing fileName', async () => {
            const fileBuffer = Buffer.from('mock-pdf-content');

            await expect(createReportStorage(fileBuffer))
                .rejects
                .toThrow(ValidationError);

            await expect(createReportStorage(fileBuffer))
                .rejects
                .toThrow('fileName is required when uploading from buffer');
        });

        test('Should throw ValidationError when buffer input with null fileName', async () => {
            const fileBuffer = Buffer.from('mock-pdf-content');

            await expect(createReportStorage(fileBuffer, null))
                .rejects
                .toThrow(ValidationError);
        });

        test('Should handle different file types', async () => {
            const fileName = 'test-report.docx';
            const fileBuffer = Buffer.from('mock-docx-content');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/test-file.docx' },
                        error: null
                    }),
                    getPublicUrl: jest.fn().mockReturnValue({
                        data: { publicUrl: 'https://example.com/reports/test-file.docx' }
                    })
                })
            };

            const result = await createReportStorage(fileBuffer, fileName);

            expect(result).toEqual({
                uploadData: { path: 'reports/test-file.docx' },
                publicUrl: 'https://example.com/reports/test-file.docx'
            });
        });

        test('Should handle large file uploads', async () => {
            const fileName = 'large-report.pdf';
            const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB buffer

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/large-file.pdf' },
                        error: null
                    }),
                    getPublicUrl: jest.fn().mockReturnValue({
                        data: { publicUrl: 'https://example.com/reports/large-file.pdf' }
                    })
                })
            };

            const result = await createReportStorage(largeBuffer, fileName);

            expect(result).toEqual({
                uploadData: { path: 'reports/large-file.pdf' },
                publicUrl: 'https://example.com/reports/large-file.pdf'
            });
        });

        test('Should handle empty file buffer', async () => {
            const fileName = 'empty-report.pdf';
            const emptyBuffer = Buffer.alloc(0);

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/empty-file.pdf' },
                        error: null
                    }),
                    getPublicUrl: jest.fn().mockReturnValue({
                        data: { publicUrl: 'https://example.com/reports/empty-file.pdf' }
                    })
                })
            };

            const result = await createReportStorage(emptyBuffer, fileName);

            expect(result).toEqual({
                uploadData: { path: 'reports/empty-file.pdf' },
                publicUrl: 'https://example.com/reports/empty-file.pdf'
            });
        });

        test('Should handle special characters in fileName', async () => {
            const fileName = 'test-report-2024-01-15 (Final).pdf';
            const fileBuffer = Buffer.from('mock-pdf-content');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn().mockResolvedValue({
                        data: { path: 'reports/special-file.pdf' },
                        error: null
                    }),
                    getPublicUrl: jest.fn().mockReturnValue({
                        data: { publicUrl: 'https://example.com/reports/special-file.pdf' }
                    })
                })
            };

            const result = await createReportStorage(fileBuffer, fileName);

            expect(result).toEqual({
                uploadData: { path: 'reports/special-file.pdf' },
                publicUrl: 'https://example.com/reports/special-file.pdf'
            });
        });

        test('Should handle concurrent uploads', async () => {
            const fileName1 = 'report1.pdf';
            const fileName2 = 'report2.pdf';
            const buffer1 = Buffer.from('content1');
            const buffer2 = Buffer.from('content2');

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    upload: jest.fn()
                        .mockResolvedValueOnce({
                            data: { path: 'reports/report1.pdf' },
                            error: null
                        })
                        .mockResolvedValueOnce({
                            data: { path: 'reports/report2.pdf' },
                            error: null
                        }),
                    getPublicUrl: jest.fn()
                        .mockReturnValueOnce({
                            data: { publicUrl: 'https://example.com/reports/report1.pdf' }
                        })
                        .mockReturnValueOnce({
                            data: { publicUrl: 'https://example.com/reports/report2.pdf' }
                        })
                })
            };

            const [result1, result2] = await Promise.all([
                createReportStorage(buffer1, fileName1),
                createReportStorage(buffer2, fileName2)
            ]);

            expect(result1).toEqual({
                uploadData: { path: 'reports/report1.pdf' },
                publicUrl: 'https://example.com/reports/report1.pdf'
            });
            expect(result2).toEqual({
                uploadData: { path: 'reports/report2.pdf' },
                publicUrl: 'https://example.com/reports/report2.pdf'
            });
        });
    });

    describe('getReportsByProfileId', () => {
        test('Should fetch reports for a profile successfully', async () => {
            const mockReports = [
                {
                    id: 'report1',
                    profile_id: 'user-123',
                    title: 'Report 1',
                    filepath: 'https://example.com/report1.pdf',
                    created_at: '2024-01-20T10:00:00Z'
                },
                {
                    id: 'report2',
                    profile_id: 'user-123',
                    title: 'Report 2',
                    filepath: 'https://example.com/report2.pdf',
                    created_at: '2024-01-15T10:00:00Z'
                }
            ];

            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: mockReports,
                            error: null
                        })
                    })
                })
            });

            const result = await getReportsByProfileId('user-123');

            expect(supabase.from).toHaveBeenCalledWith('revamped_report');
            expect(result).toEqual(mockReports);
            expect(result).toHaveLength(2);
        });

        test('Should return empty array when no reports found', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: [],
                            error: null
                        })
                    })
                })
            });

            const result = await getReportsByProfileId('user-123');

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        test('Should order reports by created_at descending', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: [],
                            error: null
                        })
                    })
                })
            });

            await getReportsByProfileId('user-123');

            const orderCall = supabase.from().select().eq().order;
            expect(orderCall).toHaveBeenCalledWith('created_at', { ascending: false });
        });

        test('Should throw InternalError when database query fails', async () => {
            supabase.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Database connection failed' }
                        })
                    })
                })
            });

            await expect(getReportsByProfileId('user-123'))
                .rejects
                .toThrow(InternalError);

            await expect(getReportsByProfileId('user-123'))
                .rejects
                .toThrow('Failed to fetch reports for profile');
        });
    });

    describe('deleteReport', () => {
        test('Should delete report and return deleted record', async () => {
            const mockDeletedReport = {
                id: 'report1',
                profile_id: 'user-123',
                title: 'Test Report',
                filepath: 'https://example.com/reports/test-report.pdf'
            };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [mockDeletedReport],
                            error: null
                        })
                    })
                })
            });

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    remove: jest.fn().mockResolvedValue({
                        data: null,
                        error: null
                    })
                })
            };

            const result = await deleteReport('report1');

            expect(supabase.from).toHaveBeenCalledWith('revamped_report');
            expect(result).toEqual(mockDeletedReport);
            expect(supabase.storage.from).toHaveBeenCalledWith('reports');
        });

        test('Should delete file from storage after database deletion', async () => {
            const mockDeletedReport = {
                id: 'report1',
                profile_id: 'user-123',
                title: 'Test Report',
                filepath: 'https://example.com/storage/v1/object/public/reports/test-report.pdf'
            };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [mockDeletedReport],
                            error: null
                        })
                    })
                })
            });

            const mockRemove = jest.fn().mockResolvedValue({
                data: null,
                error: null
            });

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    remove: mockRemove
                })
            };

            await deleteReport('report1');

            expect(mockRemove).toHaveBeenCalledWith(['test-report.pdf']);
        });

        test('Should throw ValidationError when report not found', async () => {
            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [],
                            error: null
                        })
                    })
                })
            });

            await expect(deleteReport('nonexistent-report'))
                .rejects
                .toThrow(ValidationError);

            await expect(deleteReport('nonexistent-report'))
                .rejects
                .toThrow('Report not found');
        });

        test('Should throw InternalError when database delete fails', async () => {
            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: null,
                            error: { message: 'Database error' }
                        })
                    })
                })
            });

            await expect(deleteReport('report1'))
                .rejects
                .toThrow(InternalError);

            await expect(deleteReport('report1'))
                .rejects
                .toThrow('Failed to delete report from database');
        });

        test('Should handle storage deletion errors gracefully', async () => {
            const mockDeletedReport = {
                id: 'report1',
                profile_id: 'user-123',
                title: 'Test Report',
                filepath: 'https://example.com/reports/test-report.pdf'
            };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [mockDeletedReport],
                            error: null
                        })
                    })
                })
            });

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    remove: jest.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Storage service unavailable' }
                    })
                })
            };

            // Should not throw, just log the error
            const result = await deleteReport('report1');

            expect(result).toEqual(mockDeletedReport);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to delete file from storage:',
                { message: 'Storage service unavailable' }
            );
        });

        test('Should extract filename from URL correctly', async () => {
            const mockDeletedReport = {
                id: 'report1',
                profile_id: 'user-123',
                title: 'Test Report',
                filepath: 'https://example.com/storage/v1/object/public/reports/user-123-report.pdf'
            };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [mockDeletedReport],
                            error: null
                        })
                    })
                })
            });

            const mockRemove = jest.fn().mockResolvedValue({
                data: null,
                error: null
            });

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    remove: mockRemove
                })
            };

            await deleteReport('report1');

            expect(mockRemove).toHaveBeenCalledWith(['user-123-report.pdf']);
        });

        test('Should extract filename from simple path', async () => {
            const mockDeletedReport = {
                id: 'report1',
                profile_id: 'user-123',
                title: 'Test Report',
                filepath: 'reports/simple-report.pdf'
            };

            supabase.from = jest.fn().mockReturnValue({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockResolvedValue({
                            data: [mockDeletedReport],
                            error: null
                        })
                    })
                })
            });

            const mockRemove = jest.fn().mockResolvedValue({
                data: null,
                error: null
            });

            supabase.storage = {
                from: jest.fn().mockReturnValue({
                    remove: mockRemove
                })
            };

            await deleteReport('report1');

            expect(mockRemove).toHaveBeenCalledWith(['simple-report.pdf']);
        });
    });
});
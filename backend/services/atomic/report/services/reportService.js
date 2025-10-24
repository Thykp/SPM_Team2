const { supabase } = require("../db/supabase");
const { InternalError, ValidationError } = require("../model/AppError");
const REPORT_TABLE = "revamped_report";
const REPORT_STORAGE = "reports";
const fs = require("fs").promises;

async function createReport(report, filePath){
    const { data, error } = await supabase
        .from(REPORT_TABLE)
        .insert([{
        profile_id: report.profile_id,
        title: report.title,
        filepath: filePath,
        }])
        .select();
    
    if (error) {
        throw new InternalError('save report metadata to database', error);
    }

    return data[0].filepath;
}

async function createReportStorageFromPath(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = require('path').basename(filePath);
    
    const { data, error } = await supabase.storage
        .from(REPORT_STORAGE)
        .upload(fileName, fileBuffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf'
        });

    if (error) {
        throw new InternalError('upload report to storage', error);
    }
    
    return data;
}

async function createReportStorageFromFile(fileName, fileBuffer) {
    const { data, error } = await supabase.storage
        .from(REPORT_STORAGE)
        .upload(fileName, fileBuffer, {
            duplex: 'half',
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf'
        });

    if (error) {
        throw new InternalError('upload report to storage', error);
    }
    
    return data;
}

async function createReportStorage(filePathOrBuffer, fileName = null) {
    let uploadData;
    
    if (typeof filePathOrBuffer === 'string') {
        uploadData = await createReportStorageFromPath(filePathOrBuffer);
    } else {
        if (!fileName) {
            throw new ValidationError('fileName is required when uploading from buffer');
        }
        uploadData = await createReportStorageFromFile(fileName, filePathOrBuffer);
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
        .from(REPORT_STORAGE)
        .getPublicUrl(uploadData.path);
    
    return {
        uploadData,
        publicUrl: publicUrlData.publicUrl
    };
}

async function getReportsByProfileId(profileId) {
    const { data, error } = await supabase
        .from(REPORT_TABLE)
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
    
    if (error) {
        throw new InternalError('fetch reports for profile', error);
    }
    
    return data;
}

async function deleteReport(reportId) {
    const { data, error } = await supabase
        .from(REPORT_TABLE)
        .delete()
        .eq('id', reportId)
        .select();
    
    if (error) {
        throw new InternalError('delete report from database', error);
    }
    
    if (!data || data.length === 0) {
        throw new ValidationError('Report not found');
    }
    
    const deletedReport = data[0];
    const fileName = extractFileName(deletedReport.filepath);
    
    const { error: storageError } = await supabase.storage
        .from(REPORT_STORAGE)
        .remove([fileName]);
    
    if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
    }
    
    return deletedReport;
}

function extractFileName(filepath) {
    const urlParts = filepath.split('/');
    return urlParts[urlParts.length - 1];
}

module.exports = {
    createReport, 
    createReportStorage, 
    createReportStorageFromPath, 
    createReportStorageFromFile,
    getReportsByProfileId,
    deleteReport
}

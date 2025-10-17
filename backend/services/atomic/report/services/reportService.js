const { supabase } = require("../db/supabase")
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
        console.error("Error inserting report:", error);
        throw error;
    }

    return data.filepath;
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
        console.error("Error uploading file:", error);
        throw error;
    }
    
    return data;
}

async function createReportStorageFromFile(fileName, fileBuffer) {
    const { data, error } = await supabase.storage
        .from(REPORT_STORAGE)
        .upload(fileName, fileBuffer, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'application/pdf'
        });

    if (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
    
    return data;
}

async function createReportStorage(filePathOrBuffer, fileName = null) {
    if (typeof filePathOrBuffer === 'string') {
        return await createReportStorageFromPath(filePathOrBuffer);
    } else {
        if (!fileName) {
            throw new Error('fileName is required when uploading from buffer');
        }
        return await createReportStorageFromFile(fileName, filePathOrBuffer);
    }
}

module.exports = {
    createReport, 
    createReportStorage, 
    createReportStorageFromPath, 
    createReportStorageFromFile
}

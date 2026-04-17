import { StatusCodes } from "http-status-codes";
import AppError from "../../global/error";

/**
 * Fetch student info from the Google Sheet Masterlist.
 * We'll use the public CSV export URL if possible.
 */
const STUDENT_SHEET_URL = process.env.STUDENT_MASTERLIST_CSV_URL || "https://docs.google.com/spreadsheets/d/1mZMt0sPGNLgL1E2SudDtsgXsHI-LGAlFL0eeZfi76Gk/export?format=csv&gid=892793322";

/**
 * Fetches and parses the student masterlist CSV.
 */
const fetchMasterlist = async () => {
  try {
    const response = await fetch(STUDENT_SHEET_URL);
    if (!response.ok) {
      console.error(`[fetchMasterlist] Google Sheets returned ${response.status}: ${response.statusText}`);
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE, 
        `Google Sheets error (${response.status}). Ensure the sheet is shared as "Anyone with the link can view" or "Published to web" as CSV.`
      );
    }
    const text = await response.text();
    
    // Check if we got HTML (login page) instead of CSV
    if (text.trim().startsWith("<!DOCTYPE") || text.includes("<html")) {
      console.error("[fetchMasterlist] Received HTML instead of CSV. Sheet is likely private.");
      throw new AppError(
        StatusCodes.SERVICE_UNAVAILABLE, 
        "The Google Sheet is private. Please set it to 'Anyone with the link can view' or publish it to the web."
      );
    }
  
  // Improved CSV parser that handles commas within quoted fields
  const rows = text.split(/\r?\n/)
    .map(line => {
      const result = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(cell.trim().replace(/^"(.*)"$/, "$1"));
          cell = "";
        } else {
          cell += char;
        }
      }
      result.push(cell.trim().replace(/^"(.*)"$/, "$1"));
      return result;
    });
  
  // Filter out empty rows and skip header if it looks like one
  const filteredRows = rows.filter(row => row.length >= 2 && row[0]);
  
  // If the first row contains "ID" or "Name", it's likely a header
  if (filteredRows.length > 0) {
    const firstRow = filteredRows[0];
    const isHeader = firstRow.some(cell => 
      cell.toLowerCase().includes("id") || 
      cell.toLowerCase().includes("name") || 
      cell.toLowerCase().includes("student")
    );
    if (isHeader) return filteredRows.slice(1);
  }

  return filteredRows;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("[fetchMasterlist] Error fetching masterlist:", error);
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to fetch student info. Server could not reach Google Sheets."
    );
  }
};

/**
 * Find student by ID, Name, or Email.
 * Based on the user's masterlist structure:
 * A: ID
 * B: Email
 * C: Name
 * D: Department / Section
 */
const getStudentById = async (id: string) => {
  const masterlist = await fetchMasterlist();
  
  // Search by ID (Column A)
  const studentRow = masterlist.find(row => row[0].toLowerCase() === id.toLowerCase());
  
  if (!studentRow) {
    throw new AppError(StatusCodes.NOT_FOUND, `Student with ID "${id}" not found in Masterlist.`);
  }

  return {
    id:         studentRow[0],
    email:      studentRow[1] || "",
    name:       studentRow[2] || "",
    department: studentRow[3] || "",
  };
};

/**
 * Find student by Name and Email.
 */
const getStudentByDetails = async (name: string, email: string) => {
  const masterlist = await fetchMasterlist();
  
  const searchName  = (name || "").toLowerCase().trim();
  const searchEmail = (email || "").toLowerCase().trim();
  const searchId    = searchEmail.split("@")[0]; // e.g. "20221270"

  // Helper to "normalize" a string for fuzzy matching (remove commas, dots, and extra spaces)
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).sort().join(" ");

  const normalizedSearchName = normalize(searchName);

  // Search by Name (Column C) and Email (Column B)
  const studentRow = masterlist.find(row => {
    const rowId    = (row[0] || "").toLowerCase().trim();
    const rowEmail = (row[1] || "").toLowerCase().trim();
    const rowName  = (row[2] || "").toLowerCase().trim();
    
    // If searching by both name and email, require both to match
    if (searchName && searchEmail) {
      const emailMatch = rowEmail === searchEmail || 
                         rowEmail === searchId || 
                         rowId === searchId || 
                         rowId === searchEmail;
      
      if (!emailMatch) return false;

      const normalizedRowName = normalize(rowName);
      
      // Match if one contains the other, or if normalized versions match
      return normalizedRowName.includes(normalizedSearchName) || 
             normalizedSearchName.includes(normalizedRowName) ||
             normalizedRowName === normalizedSearchName;
    }
    
    // If searching by email only, match email/ID
    if (searchEmail && !searchName) {
      return rowEmail === searchEmail || 
             rowEmail === searchId || 
             rowId === searchId || 
             rowId === searchEmail;
    }
    
    // If searching by name only, match name
    if (searchName && !searchEmail) {
      const normalizedRowName = normalize(rowName);
      
      // Match if one contains the other, or if normalized versions match
      return normalizedRowName.includes(normalizedSearchName) || 
             normalizedSearchName.includes(normalizedRowName) ||
             normalizedRowName === normalizedSearchName;
    }
    
    return false;
  });
  
  if (!studentRow) {
    // Fallback: If no match with name, try searching by just Email/ID (since it's unique)
    const fallbackRow = masterlist.find(row => {
      const rowId    = (row[0] || "").toLowerCase().trim();
      const rowEmail = (row[1] || "").toLowerCase().trim();
      return rowEmail === searchEmail || rowEmail === searchId || rowId === searchId || rowId === searchEmail;
    });

    if (fallbackRow) {
      return {
        id:         fallbackRow[0],
        email:      fallbackRow[1] || "",
        name:       fallbackRow[2] || "",
        department: fallbackRow[3] || "",
      };
    }

    throw new AppError(StatusCodes.NOT_FOUND, "Student not found in the Masterlist. Please check the ID/Email and Name spelling.");
  }

  return {
    id:         studentRow[0],
    email:      studentRow[1] || "",
    name:       studentRow[2] || "",
    department: studentRow[3] || "",
  };
};

export const studentService = {
  getStudentById,
  getStudentByDetails,
};

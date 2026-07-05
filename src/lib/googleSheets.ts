import { ProjectProgressReport } from '../types';

interface SpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Create a brand new Google Spreadsheet
 */
export async function createSpreadsheet(accessToken: string, title: string): Promise<SpreadsheetResponse> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
  };
}

/**
 * Format and populate data inside the Google Spreadsheet
 */
export async function populateSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  reports: ProjectProgressReport[],
  stats: {
    total: number;
    avgProgress: number;
    approved: number;
    pending: number;
    revision: number;
  },
  filterDesc: {
    project: string;
    category: string;
    status: string;
    approval: string;
  }
): Promise<void> {
  const timestamp = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Prepare the structured data values
  const values = [
    ['PT KONSTRUKSI NUSANTARA'],
    ['LAPORAN RINGKASAN PROGRESS FISIK MINGGUAN - PMO & K3'],
    [`Tanggal Ekspor: ${timestamp}`],
    [],
    ['RINGKASAN EKSEKUTIF'],
    ['Total Laporan', `${stats.total} Laporan`, 'Status Persetujuan:', ''],
    ['Rata-rata Progress Fisik', `${stats.avgProgress}%`, '- Disetujui', `${stats.approved} Laporan`],
    ['Filter Proyek', filterDesc.project, '- Perlu Revisi', `${stats.revision} Laporan`],
    ['Filter Kategori', filterDesc.category, '- Pending', `${stats.pending} Laporan`],
    ['Filter Status Lapangan', filterDesc.status, '', ''],
    [],
    [
      'No',
      'Tanggal Laporan',
      'Nama Proyek',
      'Kategori Pekerjaan',
      'Progress Fisik (%)',
      'Status Lapangan',
      'Nama Pelapor',
      'Deskripsi Pekerjaan',
      'Status Persetujuan',
      'Feedback Manajemen'
    ]
  ];

  // Append report rows
  reports.forEach((r, idx) => {
    values.push([
      (idx + 1).toString(),
      r.date,
      r.projectName,
      r.category,
      `${r.progressPercentage}%`,
      r.status,
      r.reporterName,
      r.description,
      r.approvalStatus || 'Pending',
      r.managementFeedback || '-'
    ]);
  });

  // 1. Write the main content
  const writeResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Sheet1!A1',
        majorDimension: 'ROWS',
        values: values,
      }),
    }
  );

  if (!writeResponse.ok) {
    const errData = await writeResponse.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal mengisi data ke Google Spreadsheet.');
  }

  // 2. Apply premium design styling (Colors, Font styles, Alignments, Borders, Gridlines, Column Widths) using batchUpdate
  const designRequests = [
    // Enable Gridlines
    {
      updateSheetProperties: {
        properties: {
          sheetId: 0,
          gridlinesVisible: true,
        },
        fields: 'gridlinesVisible',
      },
    },
    // Main Title: Bold, 16pt, Dark Blue
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              fontSize: 16,
              bold: true,
              foregroundColor: { red: 0.05, green: 0.15, blue: 0.3 },
            },
          },
        },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    // Subtitle: Semi-bold, 11pt, Muted Grey
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              fontSize: 11,
              bold: true,
              foregroundColor: { red: 0.4, green: 0.4, blue: 0.4 },
            },
          },
        },
        fields: 'userEnteredFormat.textFormat',
      },
    },
    // Executive Summary Header Card Theme
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.93, blue: 0.98 },
            textFormat: {
              fontSize: 11,
              bold: true,
              foregroundColor: { red: 0.1, green: 0.2, blue: 0.5 },
            },
            borders: {
              bottom: { style: 'SOLID_MEDIUM', color: { red: 0.1, green: 0.2, blue: 0.5 } },
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,borders)',
      },
    },
    // Format Executive Summary cells
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 5,
          endRowIndex: 10,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              fontSize: 10,
            },
            backgroundColor: { red: 0.97, green: 0.98, blue: 0.99 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    // Bold left-labels in executive summary
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 5,
          endRowIndex: 10,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true,
              fontSize: 10,
            },
          },
        },
        fields: 'userEnteredFormat.textFormat.bold',
      },
    },
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 5,
          endRowIndex: 9,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true,
              fontSize: 10,
            },
          },
        },
        fields: 'userEnteredFormat.textFormat.bold',
      },
    },
    // Main Table Headers (Row 11 - zero indexed is 11)
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 11,
          endRowIndex: 12,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 }, // Slate 800
            textFormat: {
              bold: true,
              fontSize: 10,
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            },
            alignment: {
              horizontal: 'CENTER',
              vertical: 'MIDDLE',
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,alignment)',
      },
    },
    // Center Alignments for specific columns: No (col 0), Tanggal (col 1), Progress (col 4), Status Lapangan (col 5), Status Persetujuan (col 8)
    ...[0, 1, 4, 5, 8].map(colIdx => ({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 12,
          endRowIndex: 12 + reports.length,
          startColumnIndex: colIdx,
          endColumnIndex: colIdx + 1,
        },
        cell: {
          userEnteredFormat: {
            alignment: {
              horizontal: 'CENTER',
            },
          },
        },
        fields: 'userEnteredFormat.alignment',
      },
    })),
    // Auto fit column widths nicely
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: 0,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 10,
        },
      },
    },
  ];

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: designRequests,
      }),
    }
  );

  if (!updateResponse.ok) {
    console.warn('Gagal menerapkan styling premium ke Google Spreadsheet (tapi data berhasil disimpan).');
  }
}

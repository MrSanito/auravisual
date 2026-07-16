import React, { useState, useRef } from "react";
import { Download, Upload, X, FileText, Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "react-toastify";

interface ImportTransactionsModalProps {
  userId: string | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

// A simple robust CSV row parser that handles commas inside quotes
function parseCSVRow(text: string) {
  let result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cur += '"'; i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
  }
  result.push(cur.trim());
  return result;
}

export function ImportTransactionsModal({ userId, onClose, onSuccess }: ImportTransactionsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    if (!userId) return;
    try {
      const response = await fetch("/api/transactions/import/template", {
        headers: { "x-user-id": userId },
      });
      if (!response.ok) {
        toast.error("Failed to download template");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      toast.error("Error downloading template");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploadStatus("idle");
      setErrorMessage("");

      try {
        const text = await selectedFile.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length <= 1) {
          setUploadStatus("error");
          setErrorMessage("File is empty or contains only headers");
          return;
        }

        const rows = lines.slice(1);
        const transactions = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const parsed = parseCSVRow(row);
          const [date, type, categoryName, amountStr, mode, accountName, party, ...notesArr] = parsed;
          const notes = notesArr.join(",");

          transactions.push({
            date,
            type,
            categoryName,
            amountStr,
            mode,
            accountName,
            party,
            notes
          });
        }

        setParsedRows(transactions);
      } catch (err) {
        setUploadStatus("error");
        setErrorMessage("Failed to parse CSV file.");
      }
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("Unauthorized");
      return;
    }
    if (parsedRows.length === 0) {
      toast.error("No transactions to import");
      return;
    }

    setIsUploading(true);
    setUploadStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ transactions: parsedRows }),
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus("success");
        toast.success(`Successfully imported ${data.count} transactions!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setUploadStatus("error");
        setErrorMessage(data.error || "Failed to import file");
      }
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      setErrorMessage("Network error occurred while importing");
    } finally {
      setIsUploading(false);
    }
  };

  const cancelAndReset = () => {
    if (parsedRows.length > 0 && !isUploading) {
      setFile(null);
      setParsedRows([]);
      setUploadStatus("idle");
      setErrorMessage("");
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh] ${parsedRows.length > 0 ? "max-w-4xl" : "max-w-md"}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 shrink-0">
          <h3 className="text-lg font-bold text-gray-800">
            {parsedRows.length > 0 ? "Preview Transactions" : "Import Transactions"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {parsedRows.length === 0 ? (
            <>
              {/* Step 1: Download Template */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 text-sm text-blue-700 bg-blue-50 rounded-lg">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Advice:</strong> Always download and use a new template to ensure your categories and accounts are properly synced and to prevent data mismatches.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 w-full justify-center"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Step 2: Upload File */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Upload Filled Template</h4>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                    file ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Click to browse or drag file here</p>
                  <p className="text-xs text-gray-500 mt-1">Supports .csv files only</p>
                </div>
              </div>
            </>
          ) : (
            // Preview Table
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found <strong>{parsedRows.length}</strong> transactions to import from <span className="font-semibold text-gray-800">{file?.name}</span>.
                </p>
                <button onClick={() => setParsedRows([])} className="text-sm text-blue-600 font-medium hover:underline">
                  Choose different file
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Account</th>
                      <th className="px-4 py-3 font-medium">Party</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.type?.toUpperCase() === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.categoryName}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.amountStr}</td>
                        <td className="px-4 py-3">{row.accountName}</td>
                        <td className="px-4 py-3 text-gray-500">{row.party}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 10 && (
                <p className="text-xs text-center text-gray-500 pt-2">
                  Showing 10 of {parsedRows.length} transactions.
                </p>
              )}
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus === "error" && (
            <div className="flex items-start gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <p className="font-medium">Import successful!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={cancelAndReset}
            disabled={isUploading}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          
          {parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isUploading || uploadStatus === "success"}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Transactions"
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}



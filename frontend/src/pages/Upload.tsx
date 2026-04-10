import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, Link as LinkIcon, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import { uploadApi } from '../lib/api';
import type { ColumnMapping } from '../types';
import { cn } from '../lib/utils';

const KNOWN_COLUMNS = {
  accountName: ['Account Name', 'account_name', 'AccountName', 'Name'],
  accountOwner: ['Account Owner', 'account_owner', 'Owner', 'AE Name'],
  companySize: ['Company Size', 'company_size', 'CompanySize', 'Employees'],
  customerSegment: ['Customer Segment', 'customer_segment', 'Segment'],
  billingState: ['Billing State/Province', 'billing_state', 'State', 'Province'],
  industry: ['Industry', 'industry'],
  territory: ['Territory', 'territory'],
  userRegion: ['User Region', 'user_region', 'Region'],
  arr: ['ARR (max) (converted)', 'ARR', 'arr', 'Annual Recurring Revenue', 'ARR (max)'],
  arrCurrency: ['ARR (max) (converted) Currency', 'ARR Currency', 'arr_currency'],
  pipelineArr: ['Pipeline - ARR (converted)', 'Pipeline ARR', 'pipeline_arr', 'Pipeline'],
  pipelineArrCurrency: ['Pipeline - ARR (converted) Currency', 'Pipeline Currency'],
};

function autoMap(headers: string[]): ColumnMapping {
  const mapping: Record<string, string> = {};
  for (const [field, candidates] of Object.entries(KNOWN_COLUMNS)) {
    const match = headers.find(h =>
      candidates.some(c => c.toLowerCase() === h.toLowerCase().trim())
    );
    mapping[field] = match || '';
  }
  return mapping as unknown as ColumnMapping;
}

export default function UploadPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'file' | 'sheet'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>({
    accountName: '', accountOwner: '', companySize: '', customerSegment: '',
    billingState: '', industry: '', territory: '', userRegion: '',
    arr: '', arrCurrency: '', pipelineArr: '', pipelineArrCurrency: '',
  });
  const [step, setStep] = useState<'upload' | 'map' | 'confirm'>('upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    setError('');

    Papa.parse(f, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      complete: (results) => {
        const hdrs = results.meta.fields || [];
        setHeaders(hdrs);
        setPreviewRows(results.data as Record<string, string>[]);
        setMapping(autoMap(hdrs));
      },
    });

    // Get total count
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setTotalRows(results.data.length),
    });

    setStep('map');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    maxFiles: 1,
  });

  const handleSheetPreview = async () => {
    if (!sheetUrl.trim()) return;
    setError('');
    try {
      // Extract sheet ID from URL for preview via backend
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload/preview-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      });
      if (!res.ok) throw new Error('Could not load sheet');
      const data = await res.json();
      setHeaders(data.headers);
      setPreviewRows(data.rows.slice(0, 5));
      setTotalRows(data.totalRows);
      setMapping(autoMap(data.headers));
      setStep('map');
    } catch {
      setError('Could not load Google Sheet. Make sure it is publicly viewable and the URL is correct.');
    }
  };

  const handleUpload = async () => {
    if (!planId) return;
    setUploading(true);
    setError('');
    try {
      if (mode === 'file' && file) {
        await uploadApi.uploadCsv(planId, file, mapping);
      } else {
        await uploadApi.uploadGoogleSheet(planId, sheetUrl, mapping);
      }
      navigate(`/plans/${planId}/enrich`);
    } catch {
      setError('Upload failed. Please check the file and try again.');
      setUploading(false);
    }
  };

  const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
    accountName: 'Account Name *',
    accountOwner: 'Account Owner',
    companySize: 'Company Size',
    customerSegment: 'Customer Segment',
    billingState: 'Billing State/Province',
    industry: 'Industry *',
    territory: 'Territory',
    userRegion: 'User Region',
    arr: 'ARR (max) *',
    arrCurrency: 'ARR Currency',
    pipelineArr: 'Pipeline ARR',
    pipelineArrCurrency: 'Pipeline Currency',
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['upload', 'map', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              step === s ? 'bg-os-red text-white' :
              ['upload', 'map', 'confirm'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-400'
            )}>
              {['upload', 'map', 'confirm'].indexOf(step) > i ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={cn('text-sm', step === s ? 'font-medium text-gray-900' : 'text-gray-400')}>
              {s === 'upload' ? 'Upload' : s === 'map' ? 'Map Columns' : 'Confirm'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Account List</h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload your Salesforce account list as a CSV file or provide a Google Sheets link.
          </p>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit">
            {([['file', 'CSV File', UploadIcon], ['sheet', 'Google Sheets', LinkIcon]] as const).map(([m, label, Icon]) => (
              <button
                key={m}
                onClick={() => setMode(m as 'file' | 'sheet')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {mode === 'file' ? (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-os-red bg-red-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              )}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">
                {isDragActive ? 'Drop the CSV here' : 'Drag & drop your CSV, or click to browse'}
              </p>
              <p className="text-sm text-gray-400 mt-1">Supports Salesforce account exports</p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Google Sheets URL
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-os-red focus:border-transparent"
              />
              <p className="text-xs text-gray-400">
                The sheet must be set to "Anyone with the link can view"
              </p>
              <button
                onClick={handleSheetPreview}
                disabled={!sheetUrl.trim()}
                className="bg-os-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-os-red-dark transition-colors disabled:opacity-50"
              >
                Load Sheet
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      )}

      {step === 'map' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Map Columns</h2>
          <p className="text-sm text-gray-500 mb-6">
            We auto-detected {totalRows.toLocaleString()} accounts. Confirm the column mapping below.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map(field => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {FIELD_LABELS[field]}
                </label>
                <select
                  value={mapping[field]}
                  onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-os-red"
                >
                  <option value="">— not mapped —</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Preview */}
          {previewRows.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Data Preview (first 5 rows)</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="text-xs min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {[mapping.accountName, mapping.industry, mapping.arr].filter(Boolean).map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {[mapping.accountName, mapping.industry, mapping.arr].filter(Boolean).map(h => (
                          <td key={h} className="px-3 py-2 text-gray-700 border-b border-gray-100 max-w-[200px] truncate">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!mapping.accountName || !mapping.industry || !mapping.arr}
              className="px-4 py-2 text-sm bg-os-red text-white rounded-lg hover:bg-os-red-dark transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Confirm Upload</h2>
          <p className="text-sm text-gray-500 mb-6">
            Ready to import {totalRows.toLocaleString()} accounts. After upload, the app will enrich
            accounts with company revenue data and run AI signal detection.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Accounts to import</span>
              <span className="font-semibold">{totalRows.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Account Name column</span>
              <span className="font-medium text-gray-700">{mapping.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Industry column</span>
              <span className="font-medium text-gray-700">{mapping.industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ARR column</span>
              <span className="font-medium text-gray-700">{mapping.arr}</span>
            </div>
            {mapping.pipelineArr && (
              <div className="flex justify-between">
                <span className="text-gray-500">Pipeline ARR column</span>
                <span className="font-medium text-gray-700">{mapping.pipelineArr}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('map')}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-2 text-sm bg-os-red text-white rounded-lg hover:bg-os-red-dark transition-colors disabled:opacity-50 font-medium"
            >
              {uploading ? 'Uploading...' : `Import ${totalRows.toLocaleString()} Accounts`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

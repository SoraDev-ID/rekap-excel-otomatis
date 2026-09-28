export type UserRole = 'super_admin' | 'admin' | 'staff' | 'viewer';
export type FileStatus = 'processing' | 'done' | 'failed';

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  tenant?: Tenant;
  email?: string;
}

export interface UploadedFile {
  id: string;
  tenant_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  status: FileStatus;
  recap_results?: RecapResult[];
  uploader?: {
    full_name: string;
    role: UserRole;
  };
}

export interface AggregationRow {
  group: string;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  [key: string]: any;
}

export interface RecapSummaryData {
  recapTitle: string;
  groupByColumn: string;
  metricColumn: string;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
  totalRecords: number;
  overallSum: number;
  overallAverage: number;
  aggregations: AggregationRow[];
  columns: string[];
  sampleRows: Record<string, any>[];
  sanitizedFormulasCount?: number;
}

export interface RecapResult {
  id: string;
  tenant_id: string;
  file_id: string;
  summary_data: RecapSummaryData;
  created_at: string;
  uploaded_file?: UploadedFile;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  detail: Record<string, any>;
  created_at: string;
  user_profile?: {
    full_name: string;
    role: UserRole;
  };
}

export interface RequestRowWithService {
  id: string;
  folio: string;
  service_id: string;
  service_name: string | null;
  created_at: string;
  privacy_accepted: boolean;
  status_id: string;
  status_code: string;
  status_name: string;
}

export interface RequestStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
  order: number;
}

export interface RequestTimelineItem {
  id: string;
  status_id: string;
  status_name: string;
  status_code: string;
  created_at: string;
  description?: string;
  completed: boolean;
}

export interface RequestInquiryResult {
  id: string;
  service_id: string;
  service_name: string;
  created_at: string;
  privacy_accepted: boolean;
  status_id: string;
  status_code: string;
  status_name: string;
  applicant_name: string;
  municipality: string;
  state: string;
  timeline: RequestTimelineItem[];
}

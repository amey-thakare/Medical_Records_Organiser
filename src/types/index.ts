export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  photoURL?: string;
  createdAt: number;
}

export interface MedicalDocument {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  size: number;
  uploadDate: number;
  processingStatus: 'Uploaded' | 'Processing' | 'Processed' | 'Failed';
  category?: string;
  tags: string[];
  extractedText?: string;
}

export interface HealthParameter {
  id: string;
  userId: string;
  documentId: string;
  parameterName: string;
  value: string;
  numericValue?: number;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN';
  testDate: number;
  createdAt: number;
}

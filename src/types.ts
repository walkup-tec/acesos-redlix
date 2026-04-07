export type UserRole = "MASTER" | "LIDER" | "VENDEDOR" | "SUPORTE";

export type UserStatus = "INVITED" | "PENDING_APPROVAL" | "ACTIVE" | "BLOCKED";

export type ContentType = "IMAGE" | "PDF" | "COMMISSION_TABLE" | "OTHER";

export interface TenantUser {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  canManageUsers: boolean;
  permViewContents: boolean;
  permCreateManagers: boolean;
  permCreateSellers: boolean;
  permCommissionTables: boolean;
  permContents: boolean;
  passwordHash?: string;
  profile?: {
    cpf: string;
    rg: string;
    birthDate: string;
    address: string;
  };
  documents?: {
    identityPath: string;
    addressProofPath: string;
  };
  verificationCode?: string;
  firstAccessVerifiedAt?: string;
  resetCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface CommissionTable {
  id: string;
  tenantId: string;
  productId: string;
  bank: string;
  name: string;
  deadline: string;
  commissionPercent: number;
  observation?: string;
  createdBy: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  tenantId: string;
  title: string;
  type: ContentType;
  productId?: string;
  filePath: string;
  createdBy: string;
  createdAt: string;
}

export interface DatabaseState {
  users: TenantUser[];
  products: Product[];
  commissionTables: CommissionTable[];
  contents: ContentItem[];
}

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

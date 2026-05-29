export type CategoryId =
  | "all"
  | "production"
  | "distribution"
  | "quality"
  | "compliance"
  | "analytics"
  | "customer";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface LogoArt {
  src: string;
  alt: string;
  ratio: number;
}

export type LogoId = "erp" | "feedmill" | "pennentmill" | "salesforce";

export type ProductStatus = "active" | "new";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: Exclude<CategoryId, "all">;
  logo: LogoId;
  pinned: boolean;
  status: ProductStatus;
  lastUsed: string;
  version: string;
  project_code?: string;
}

export type ViewMode = "grid" | "list";

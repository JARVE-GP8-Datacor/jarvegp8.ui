import type { Category, LogoArt, LogoId, Product } from "./types";

export const CATEGORIES: readonly Category[] = [
  { id: "all", label: "All applications" },
  { id: "production", label: "Production" },
  { id: "distribution", label: "Distribution" },
  { id: "quality", label: "Quality & lab" },
  { id: "compliance", label: "Compliance" },
  { id: "analytics", label: "Analytics" },
  { id: "customer", label: "Customer" },
];

export const LOGOS: Record<LogoId, LogoArt> = {
  erp: {
    src: "/logos/datacor-erp.png",
    alt: "Datacor ERP",
    ratio: 668 / 302,
  },
  feedmill: {
    src: "/logos/feed-mill-manager.jpg",
    alt: "Feed Mill Manager — a datacor product",
    ratio: 1955 / 720,
  },
  pennentmill: {
    src: "/logos/pennent-mill-manager.jpg",
    alt: "Pennent Mill Manager — a datacor product",
    ratio: 2558 / 757,
  },
  salesforce: {
    src: "/logos/salesforce.png",
    alt: "Salesforce",
    ratio: 1280 / 910,
  },
};

export const PRODUCTS: Product[] = [
  {
    id: "erp",
    name: "Datacor ERP",
    tagline: "Enterprise resource planning for process manufacturers & distributors",
    category: "distribution",
    logo: "erp",
    pinned: true,
    status: "active",
    lastUsed: "Today, 9:02 AM",
    version: "2025.2",
    project_code: "erp",
  },
  {
    id: "feedmill",
    name: "Feed Mill Manager",
    tagline: "Production & inventory management for feed manufacturers",
    category: "production",
    logo: "feedmill",
    pinned: true,
    status: "active",
    lastUsed: "Today, 11:48 AM",
    version: "8.4",
    project_code: "fmm",
  },
  {
    id: "pennentmill",
    name: "Pennent Mill Manager",
    tagline: "Mill operations & batch tracking for specialty milling",
    category: "production",
    logo: "pennentmill",
    pinned: true,
    status: "active",
    lastUsed: "Yesterday",
    version: "6.1",
    project_code: "pmm",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    tagline: "CRM platform for sales, service, and marketing automation",
    category: "customer",
    logo: "salesforce",
    pinned: false,
    status: "active",
    lastUsed: "Today, 8:15 AM",
    version: "Spring '26",
    project_code: "salesforce",
  },
];

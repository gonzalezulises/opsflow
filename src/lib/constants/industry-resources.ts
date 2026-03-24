import {
  Fuel,
  Phone,
  ShoppingCart,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface IndustryResource {
  title: string;
  author: string;
  type: "Lectura" | "Video" | "Guía" | "Referencia" | "Caso" | "Herramienta";
  url: string;
  description: string;
}

export interface IndustrySection {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  /** Analogía del caso base "Alimentos Santa Emilia" traducida a esta industria */
  caseAnalogy: string;
  resources: IndustryResource[];
}

export const INDUSTRY_RESOURCES: IndustrySection[] = [
  {
    id: "oil-gas",
    name: "Petróleo y Gas / Energía",
    icon: Fuel,
    color: "text-amber-600",
    description:
      "Logística de materiales, mantenimiento de plantas, gestión de facilidades y cadena de suministro en entornos regulados de alta complejidad.",
    caseAnalogy:
      "El proceso 'Pedido a Despacho' de Alimentos Santa Emilia es equivalente al flujo 'Requisición de material a entrega en campo' en una operación petrolera: múltiples aprobaciones, validaciones de HSE, dependencia de proveedores externos y tiempos de espera que dominan el lead time.",
    resources: [
      {
        title: "Lean in the Oil & Gas Industry",
        author: "Society of Petroleum Engineers (SPE)",
        type: "Referencia",
        url: "https://www.spe.org/en/jpt/jpt-article-detail/?art=7828",
        description:
          "Cómo aplicar principios Lean en upstream y downstream: reducción de tiempos de espera en perforación, logística de campo y mantenimiento.",
      },
      {
        title: "Operational Excellence in Oil & Gas — McKinsey",
        author: "McKinsey & Company",
        type: "Lectura",
        url: "https://www.mckinsey.com/industries/oil-and-gas/our-insights",
        description:
          "Casos de mejora operativa en refinerías y operaciones de campo: VSM aplicado a turnarounds, reducción de NPT (Non-Productive Time).",
      },
      {
        title: "API Recommended Practice 754 — Process Safety Indicators",
        author: "American Petroleum Institute",
        type: "Referencia",
        url: "https://www.api.org/oil-and-natural-gas/health-and-safety/process-safety",
        description:
          "Indicadores de seguridad de procesos. Útil para entender cómo la industria petrolera mide riesgo operativo — análogo al módulo de riesgos del bootcamp.",
      },
      {
        title: "Total Productive Maintenance (TPM) in Refineries",
        author: "Lean Enterprise Institute",
        type: "Guía",
        url: "https://www.lean.org/lexicon-terms/total-productive-maintenance/",
        description:
          "Mantenimiento productivo total aplicado a plantas: OEE (Overall Equipment Effectiveness) como métrica de eficiencia de equipos — equivale a la eficiencia de flujo del VSM.",
      },
      {
        title: "Supply Chain Risk in Oil & Gas — Deloitte",
        author: "Deloitte",
        type: "Lectura",
        url: "https://www2.deloitte.com/global/en/industries/energy-resources-industrials.html",
        description:
          "Gestión de riesgos en cadena de suministro petrolera: dependencia de importaciones, reposición de repuestos críticos y single-source risk.",
      },
    ],
  },
  {
    id: "telecom",
    name: "Telecomunicaciones",
    icon: Phone,
    color: "text-blue-600",
    description:
      "Provisión de servicios, gestión de calidad, atención al cliente y transformación de procesos internos en empresas de telecomunicaciones.",
    caseAnalogy:
      "En telecomunicaciones, el equivalente a 'Pedido a Despacho' es el proceso 'Alta de servicio a activación': desde que el cliente solicita un servicio hasta que está funcionando. Las esperas en validación crediticia, asignación de recursos técnicos y coordinación de instalación son análogas al hold financiero y retrabajo del caso base.",
    resources: [
      {
        title: "eTOM (Enhanced Telecom Operations Map)",
        author: "TM Forum",
        type: "Referencia",
        url: "https://www.tmforum.org/oda/business-process-framework-etom/",
        description:
          "El marco de procesos estándar de la industria telco. Permite mapear cualquier proceso operativo de telecomunicaciones con una taxonomía universal.",
      },
      {
        title: "Lean Six Sigma in Telecom — Case Studies",
        author: "ISIXSIGMA",
        type: "Caso",
        url: "https://www.isixsigma.com/industries/telecommunications/",
        description:
          "Casos reales de Lean Six Sigma aplicados a telcos: reducción de tiempos de provisión, mejora de first-call resolution, optimización de NOC.",
      },
      {
        title: "Net Promoter Score (NPS) — Bain & Company",
        author: "Bain & Company",
        type: "Herramienta",
        url: "https://www.netpromotersystem.com/",
        description:
          "El NPS es el OTD/OTIF de telecomunicaciones: mide la experiencia del cliente como resultado de la eficiencia operativa interna.",
      },
      {
        title: "ITIL 4 — Service Value System",
        author: "Axelos / PeopleCert",
        type: "Referencia",
        url: "https://www.axelos.com/certifications/itil-service-management",
        description:
          "Marco de gestión de servicios TI. El flujo de valor de servicios (Service Value Chain) es conceptualmente equivalente al VSM del bootcamp.",
      },
    ],
  },
  {
    id: "retail",
    name: "Retail / Ferretería / Distribución",
    icon: ShoppingCart,
    color: "text-green-600",
    description:
      "Gestión de inventario, logística de tienda, proceso de compras, gestión fiscal y cadena de abastecimiento en retail.",
    caseAnalogy:
      "El caso 'Pedido a Despacho' aplica directamente al retail: el flujo 'Orden de compra a estante' en una ferretería tiene los mismos desperdicios — pedidos que llegan incompletos, reconteos, devoluciones a proveedor, y un lead time inflado por validaciones que no agregan valor al cliente final.",
    resources: [
      {
        title: "Lean Retail — Principios aplicados a tienda",
        author: "Lean Enterprise Institute",
        type: "Lectura",
        url: "https://www.lean.org/the-lean-post/articles/lean-retail/",
        description:
          "Cómo aplicar pensamiento Lean en retail: reducir pasos que no agregan valor en el recorrido del producto desde proveedor hasta punto de venta.",
      },
      {
        title: "Inventory Management Best Practices — APICS",
        author: "ASCM (Association for Supply Chain Management)",
        type: "Referencia",
        url: "https://www.ascm.org/",
        description:
          "Gestión de inventario y cadena de suministro. El quiebre de stock en retail es equivalente al 'despacho incompleto' del caso base.",
      },
      {
        title: "The Toyota Way in Retail — Tesco Case Study",
        author: "Varios autores",
        type: "Caso",
        url: "https://www.lean.org/the-lean-post/articles/what-can-retail-learn-from-lean/",
        description:
          "Cómo Tesco aplicó principios Toyota a su cadena de suministro: reducción de lead time de reposición, mejora de disponibilidad en estante.",
      },
      {
        title: "Loss Prevention & Shrinkage — NRF",
        author: "National Retail Federation",
        type: "Guía",
        url: "https://nrf.com/research/national-retail-security-survey",
        description:
          "Las pérdidas por merma en retail son un desperdicio directo. Equivalente al 'costo del desperdicio' del módulo 5: cuánto pierde la tienda por errores operativos.",
      },
    ],
  },
  {
    id: "insurance-services",
    name: "Seguros y Servicios Profesionales",
    icon: Shield,
    color: "text-purple-600",
    description:
      "Procesamiento de pólizas, gestión de siniestros, evaluación de riesgos y procesos administrativos en empresas de seguros y servicios.",
    caseAnalogy:
      "En seguros, el proceso 'Pedido a Despacho' equivale al flujo 'Solicitud de póliza a emisión' o 'Aviso de siniestro a pago': múltiples revisiones, aprobaciones escalonadas y tiempos de espera que el cliente percibe como inacción. El hold financiero del caso base es análogo a la 'revisión de suscripción' que frena el flujo.",
    resources: [
      {
        title: "Lean in Insurance — McKinsey",
        author: "McKinsey & Company",
        type: "Lectura",
        url: "https://www.mckinsey.com/industries/financial-services/our-insights",
        description:
          "Aplicación de Lean a operaciones de seguros: reducción del tiempo de emisión de pólizas, optimización del proceso de siniestros.",
      },
      {
        title: "Process Mining in Insurance — Celonis",
        author: "Celonis",
        type: "Herramienta",
        url: "https://www.celonis.com/industries/insurance/",
        description:
          "Process mining como VSM digital: mapear automáticamente el flujo real de una póliza o siniestro a partir de datos del sistema.",
      },
      {
        title: "Operational Risk Management in Financial Services",
        author: "Basel Committee / BIS",
        type: "Referencia",
        url: "https://www.bis.org/bcbs/publ/d515.htm",
        description:
          "Marco de gestión de riesgo operacional en servicios financieros. Complementa el módulo de riesgos con perspectiva regulatoria.",
      },
      {
        title: "Service Blueprinting — NNGroup",
        author: "Nielsen Norman Group",
        type: "Guía",
        url: "https://www.nngroup.com/articles/service-blueprints-definition/",
        description:
          "Service Blueprint es el VSM de servicios: mapea el proceso visible al cliente y los procesos de soporte internos. Ideal para seguros y servicios profesionales.",
      },
    ],
  },
];

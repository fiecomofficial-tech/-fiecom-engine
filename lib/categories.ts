export type CategoryId =
  | "portfolio"
  | "agency"
  | "startup"
  | "saas"
  | "restaurant"
  | "photographer"
  | "architecture"
  | "fitness"
  | "beauty"
  | "ecommerce"
  | "nonprofit"
  | "local"
  | "event"
  | "information"
  | "community"
  | "blog"
  | "luxury"
  | "personal";

export type IntakeFieldKind =
  | "text"
  | "longtext"
  | "url"
  | "files-image"
  | "files-pdf"
  | "files-any"
  | "list"
  | "select";

export interface IntakeField {
  id: string;
  label: string;
  hint?: string;
  kind: IntakeFieldKind;
  options?: string[];
  required?: boolean;
}

export interface Category {
  id: CategoryId;
  label: string;
  /** A one-line tag used in the UI when surfacing the category. */
  tagline: string;
  /** Sample prompts users can pick to seed the flow. */
  examplePrompts: string[];
  /** Category-specific intake — what we ask the user to upload. */
  intake: IntakeField[];
}

const baseBranding: IntakeField[] = [
  {
    id: "brandName",
    label: "Brand or studio name",
    kind: "text",
    required: true
  },
  {
    id: "voice",
    label: "Voice & tone",
    kind: "select",
    options: ["Editorial", "Confident", "Quiet luxury", "Playful", "Technical", "Mythic"],
    required: true
  },
  {
    id: "logo",
    label: "Logo (SVG or PNG, optional)",
    kind: "files-image"
  }
];

export const categories: Record<CategoryId, Category> = {
  portfolio: {
    id: "portfolio",
    label: "Portfolio",
    tagline: "Personal work, presented like a museum.",
    examplePrompts: [
      "Cinematic photography portfolio with quiet motion",
      "Editorial portfolio for a Berlin-based product designer",
      "Type-driven portfolio for a brand designer"
    ],
    intake: [
      ...baseBranding,
      {
        id: "projects",
        label: "Add your projects",
        hint: "Title + a few sentences each. Add images if you have them.",
        kind: "list",
        required: true
      },
      { id: "projectImages", label: "Project imagery", kind: "files-image" }
    ]
  },
  agency: {
    id: "agency",
    label: "Creative agency",
    tagline: "Showreels, capabilities, clients — choreographed.",
    examplePrompts: [
      "Independent design studio with a confident voice",
      "Branding agency working with culture-led clients",
      "Motion studio with a cinematic showreel"
    ],
    intake: [
      ...baseBranding,
      { id: "capabilities", label: "Capabilities", kind: "list", required: true },
      { id: "clients", label: "Past clients (optional)", kind: "list" },
      { id: "showreel", label: "Showreel link (optional)", kind: "url" },
      { id: "projectImages", label: "Project imagery", kind: "files-image" }
    ]
  },
  startup: {
    id: "startup",
    label: "Startup",
    tagline: "A founder narrative built for momentum.",
    examplePrompts: [
      "Futuristic AI startup launching a new product",
      "Climate tech startup with a research-driven voice",
      "Quiet, confident B2B startup"
    ],
    intake: [
      ...baseBranding,
      { id: "tagline", label: "One-line product tagline", kind: "text", required: true },
      { id: "problem", label: "The problem you solve", kind: "longtext", required: true },
      { id: "approach", label: "Your approach", kind: "longtext" },
      { id: "team", label: "Team members (name + role)", kind: "list" }
    ]
  },
  saas: {
    id: "saas",
    label: "SaaS product",
    tagline: "Product page that does the selling for you.",
    examplePrompts: [
      "Developer-focused SaaS with a Linear-quality landing",
      "AI-native productivity SaaS",
      "Quiet B2B analytics product"
    ],
    intake: [
      ...baseBranding,
      { id: "tagline", label: "Product tagline", kind: "text", required: true },
      { id: "features", label: "Key features", kind: "list", required: true },
      { id: "screenshots", label: "Product screenshots", kind: "files-image" },
      { id: "pricing", label: "Pricing tiers (label + price + a few bullets)", kind: "list" }
    ]
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    tagline: "Atmosphere first, menu second, reservations always.",
    examplePrompts: [
      "Modern omakase restaurant in Copenhagen",
      "Plant-forward neighbourhood bistro",
      "Coastal Italian, quiet luxury"
    ],
    intake: [
      ...baseBranding,
      { id: "menu", label: "Menu (PDF, document, or text)", kind: "files-any", required: true },
      { id: "address", label: "Address & hours", kind: "longtext", required: true },
      { id: "reservation", label: "Reservation link", kind: "url" },
      { id: "interior", label: "Interior & food imagery", kind: "files-image" }
    ]
  },
  photographer: {
    id: "photographer",
    label: "Photographer",
    tagline: "The work, full-bleed.",
    examplePrompts: [
      "Documentary photographer focused on long-form essays",
      "Architectural photographer, monochrome heavy",
      "Portrait photographer with editorial sensibility"
    ],
    intake: [
      ...baseBranding,
      { id: "series", label: "Series (title + a few sentences)", kind: "list", required: true },
      { id: "images", label: "Photographs", kind: "files-image", required: true }
    ]
  },
  architecture: {
    id: "architecture",
    label: "Architecture studio",
    tagline: "Drawings, models, projects — slow and considered.",
    examplePrompts: [
      "Independent architecture studio in Lisbon",
      "Residential architects with a quiet, material voice",
      "Studio focused on adaptive reuse"
    ],
    intake: [
      ...baseBranding,
      { id: "philosophy", label: "Studio philosophy", kind: "longtext" },
      { id: "projects", label: "Projects", kind: "list", required: true },
      { id: "images", label: "Project imagery", kind: "files-image" }
    ]
  },
  fitness: {
    id: "fitness",
    label: "Fitness brand",
    tagline: "Discipline, performance, identity.",
    examplePrompts: [
      "Boxing studio with a brutalist visual identity",
      "Run club with a community-first feel",
      "Performance training facility"
    ],
    intake: [
      ...baseBranding,
      { id: "programs", label: "Programs offered", kind: "list", required: true },
      { id: "schedule", label: "Schedule", kind: "longtext" },
      { id: "images", label: "Studio & member imagery", kind: "files-image" }
    ]
  },
  beauty: {
    id: "beauty",
    label: "Beauty brand",
    tagline: "Editorial product storytelling.",
    examplePrompts: [
      "Minimal skincare line with science-led positioning",
      "Niche fragrance house",
      "Botanical haircare brand"
    ],
    intake: [
      ...baseBranding,
      { id: "products", label: "Products (name + description)", kind: "list", required: true },
      { id: "images", label: "Product imagery", kind: "files-image" }
    ]
  },
  ecommerce: {
    id: "ecommerce",
    label: "Ecommerce",
    tagline: "Store that feels like a magazine.",
    examplePrompts: [
      "Small-batch ceramics store",
      "Premium denim brand",
      "Specialty coffee subscription"
    ],
    intake: [
      ...baseBranding,
      { id: "products", label: "Products (name + price + description)", kind: "list", required: true },
      { id: "images", label: "Product photography", kind: "files-image" },
      { id: "shopUrl", label: "Existing shop / Shopify URL (optional)", kind: "url" }
    ]
  },
  nonprofit: {
    id: "nonprofit",
    label: "Nonprofit",
    tagline: "Mission front and centre.",
    examplePrompts: [
      "Climate advocacy nonprofit",
      "Community arts organisation",
      "Education-focused foundation"
    ],
    intake: [
      ...baseBranding,
      { id: "mission", label: "Mission", kind: "longtext", required: true },
      { id: "programs", label: "Programs", kind: "list" },
      { id: "donateUrl", label: "Donation link", kind: "url" }
    ]
  },
  local: {
    id: "local",
    label: "Local business",
    tagline: "Be the place people search for by name.",
    examplePrompts: [
      "Independent bookstore",
      "Neighbourhood barbershop",
      "Single-location hotel"
    ],
    intake: [
      ...baseBranding,
      { id: "what", label: "What you do", kind: "longtext", required: true },
      { id: "address", label: "Address & hours", kind: "longtext", required: true },
      { id: "images", label: "Imagery", kind: "files-image" }
    ]
  },
  event: {
    id: "event",
    label: "Event",
    tagline: "A site with a countdown and a guest list.",
    examplePrompts: [
      "Design conference, single-day",
      "Album launch event",
      "Independent film festival"
    ],
    intake: [
      ...baseBranding,
      { id: "when", label: "Date & time", kind: "text", required: true },
      { id: "where", label: "Venue", kind: "text", required: true },
      { id: "schedule", label: "Schedule", kind: "list" },
      { id: "speakers", label: "Speakers / lineup", kind: "list" },
      { id: "rsvpUrl", label: "RSVP / ticket link", kind: "url" }
    ]
  },
  information: {
    id: "information",
    label: "Information site",
    tagline: "Documentation, references, archives — beautifully read.",
    examplePrompts: [
      "Public research lab site",
      "Independent journalism outlet",
      "Open-source project landing"
    ],
    intake: [
      ...baseBranding,
      { id: "summary", label: "What this site exists for", kind: "longtext", required: true },
      {
        id: "existingUrl",
        label: "Existing site URL (we'll modernise it)",
        kind: "url"
      },
      { id: "documents", label: "Documents", kind: "files-pdf" }
    ]
  },
  community: {
    id: "community",
    label: "Community",
    tagline: "A place that people belong to.",
    examplePrompts: [
      "Founders community in Stockholm",
      "Open-source maintainers club",
      "Creative writing collective"
    ],
    intake: [
      ...baseBranding,
      { id: "purpose", label: "Why the community exists", kind: "longtext", required: true },
      { id: "members", label: "Notable members (optional)", kind: "list" }
    ]
  },
  blog: {
    id: "blog",
    label: "Blog or publication",
    tagline: "A reading experience worth opening.",
    examplePrompts: [
      "Personal essay blog",
      "Independent design publication",
      "Long-form tech analysis"
    ],
    intake: [
      ...baseBranding,
      { id: "topics", label: "Topics or beats", kind: "list", required: true },
      { id: "posts", label: "Posts (title + excerpt)", kind: "list" }
    ]
  },
  luxury: {
    id: "luxury",
    label: "Luxury brand",
    tagline: "Restraint, materiality, mythology.",
    examplePrompts: [
      "Heritage watchmaker",
      "Independent leather atelier",
      "High-end interiors brand"
    ],
    intake: [
      ...baseBranding,
      { id: "story", label: "Brand story", kind: "longtext", required: true },
      { id: "products", label: "Pieces / collections", kind: "list" },
      { id: "images", label: "Imagery", kind: "files-image" }
    ]
  },
  personal: {
    id: "personal",
    label: "Personal brand",
    tagline: "Your work, your voice, no filler.",
    examplePrompts: [
      "Author personal site",
      "Operator personal site with writing & talks",
      "Founder personal site"
    ],
    intake: [
      ...baseBranding,
      { id: "bio", label: "Short bio", kind: "longtext", required: true },
      { id: "links", label: "Notable work or talks", kind: "list" }
    ]
  }
};

export const allCategories = Object.values(categories);

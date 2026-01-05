export interface ITestimonial {
  rating: number;
  title: string;
  review: string;
  author: {
    name: string;
    role: string;
    organization: string;
    image: string;
  };
  isDeleted: boolean;
}

export interface PricingItem {
  description: string;
}

// Main interface for the pricing data
export interface PricingData {
  title: string;
  billingType: "annually" | "monthly"; // assuming these are possible options
  pricing: string[];
}

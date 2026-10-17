'use client';

import React from 'react';

// Site-wide schema only (every page). Page-specific schema — FAQPage, Service,
// BlogPosting — lives with the page that shows that content.
export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rhinon Labs",
    "url": "https://www.rhinonlabs.com",
    "logo": "https://www.rhinonlabs.com/Logo_Rhinon_Labs_Light.png",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bhubaneswar",
      "addressRegion": "OR",
      "postalCode": "751001",
      "addressCountry": "IN"
    },
    // Same profiles the footer links to
    "sameAs": [
      "https://www.linkedin.com/company/rhinonlabs",
      "https://x.com/RhinonLabs",
      "https://www.instagram.com/rhinonlabs/"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 9664430061",
      "contactType": "Sales",
      "areaServed": ["Worldwide", "IN"],
      "availableLanguage": "English"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Rhinon Labs",
    "url": "https://www.rhinonlabs.com",
    "description": "Ship Your Product 3x Faster Without Hiring a Tech Team"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

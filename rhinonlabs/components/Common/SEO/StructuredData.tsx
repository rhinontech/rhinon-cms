'use client';

import React from 'react';

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Rhinon Labs",
    "url": "https://rhinonweb.com",
    "logo": "https://rhinonweb.com/favicon.ico",
    "sameAs": [
      "https://linkedin.com/company/rhinon-labs",
      "https://twitter.com/rhinonlabs"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 9664430061",
      "contactType": "Sales",
      "areaServed": "Worldwide",
      "availableLanguage": "English"
    }
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "MVP Development & AI Automation",
    "provider": {
      "@type": "Organization",
      "name": "Rhinon Labs"
    },
    "description": "We help founders and SMBs design, build and launch websites, apps and AI products fast with affordable pricing.",
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Development Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Custom Internal Dashboards"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Workflow Automation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "AI Agents & Smart Systems"
          }
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do we need to be technical to work with you?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Not at all. We handle the technical side end-to-end. We build it, we deploy it, we maintain it. You just run your business."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to build a system?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "It depends on complexity, but most projects are scoped and delivered within 2-4 weeks. You’ll get a clear timeline before we begin."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, Globe, Eye, Server, UserCheck, Scale } from 'lucide-react';

export default function PrivacyTermsPage() {
  const sections = [
    {
      title: "Privacy Policy",
      icon: <Shield className="w-6 h-6 text-cyan-500" />,
      content: [
        {
          heading: "1. Information We Collect",
          text: "At Rhinon Labs, we collect information necessary to provide our AI-powered development services. This includes personal data provided during consultation, technical metadata associated with your project requirements, and interaction data within our prototyping platforms. Our collection is strictly limited to what is essential for delivering enterprise-grade intelligence solutions."
        },
        {
          heading: "2. How We Use Information",
          text: "Your data is utilized primarily to personalize the development workflow, optimize our AI models for your specific industry context, and facilitate seamless communication. We employ advanced machine learning algorithms to analyze project scopes, which helps us ship your products up to 3x faster while maintaining rigorous quality standards."
        },
        {
          heading: "3. Data Security & Sovereignty",
          text: "We implement industry-leading encryption protocols and multi-layered security architectures. Your intellectual property and project data are stored in secure, distributed environments. We respect data sovereignty and ensure that your information is handled in compliance with international privacy standards, including GDPR and CCPA where applicable."
        },
        {
          heading: "4. AI Ethics & Transparency",
          text: "Our AI systems are designed with transparency and ethics at their core. We do not use client-specific proprietary data to train generalized models without explicit, written consent. Every automated decision in our development pipeline is subject to human oversight by our expert engineering team."
        }
      ]
    },
    {
      title: "Terms of Service",
      icon: <Scale className="w-6 h-6 text-violet-500" />,
      content: [
        {
          heading: "1. Service Engagement",
          text: "By engaging Rhinon Labs, you agree to a collaborative development process designed for rapid iteration. We provide design, development, and AI integration services. Each engagement is governed by a specific Statement of Work (SOW) that outlines deliverables, timelines, and technical specifications."
        },
        {
          heading: "2. Intellectual Property",
          text: "Unless otherwise specified in your SOW, all custom code, assets, and designs created specifically for your project become your property upon final payment. Rhinon Labs retains rights to its underlying proprietary frameworks, AI models, and pre-existing library components used to accelerate your build."
        },
        {
          heading: "3. Responsibilities & Liability",
          text: "While we strive for 100% accuracy and speed, software development is inherently iterative. Clients are responsible for providing clear requirements and timely feedback. Rhinon Labs' liability is limited to the fees paid for the specific phase of work under dispute."
        },
        {
          heading: "4. Governing Law",
          text: "These terms are governed by the laws of our primary operating jurisdiction. Any disputes arising from our services will be subject to binding arbitration, reflecting our commitment to professional and efficient resolution of enterprise-level agreements."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-10">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <h1 className="text-5xl md:text-6xl font-serif italic mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Legal Transparency
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Detailed protocols governing privacy, security, and service architecture at Rhinon Labs.
            Our commitment to enterprise-grade integrity.
          </p>
        </motion.div>

        <div className="space-y-24">
          {sections.map((section, sIdx) => (
            <motion.section 
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: sIdx * 0.2 }}
              className="relative"
            >
              <div className="flex items-center gap-4 mb-12">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  {section.icon}
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">{section.title}</h2>
              </div>

              <div className="grid gap-12 border-l border-white/10 pl-8 ml-6">
                {section.content.map((item, iIdx) => (
                  <div key={item.heading} className="relative group">
                    <div className="absolute -left-[37px] top-1 w-2.5 h-2.5 rounded-full bg-white/20 group-hover:bg-cyan-500/50 transition-colors border border-background" />
                    <h3 className="text-xl font-medium mb-4 text-white/90">{item.heading}</h3>
                    <p className="text-white/40 leading-relaxed font-light">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <Lock className="w-10 h-10 text-white/20 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Have questions about our protocols?</h3>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Our legal and security teams are available to discuss specific compliance requirements for your enterprise.
          </p>
          <a 
            href="mailto:legal@rhinon.tech"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all active:scale-95"
          >
            Contact Legal Dept
          </a>
        </motion.div>
        
        <div className="mt-20 text-center text-sm text-white/30 uppercase tracking-[0.3em] font-medium">
          Last Updated: March 16, 2026 • © Rhinon Technical Group
        </div>
      </div>
    </div>
  );
}

"use client";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Photos from "./PhotosCrauser";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";


const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

const Hero1 = () => {
  const router = useRouter();
  return (
    <div id="hero" className="overflow-hidden relative min-h-screen flex flex-col justify-center">
      <motion.div
        className="absolute inset-0 top-64 max-sm:top-52 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeOut", delay: 0.6 }}
        viewport={{ once: true }}
      >
        <div
          className="mask-[linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)]
                mask-mode:luminance relative w-full h-full"
        >
          <Image
            src="/images/background/background.jpg"
            fill
            className="object-cover"
            alt="Hero Background"
            priority
            sizes="100vw"
          />
        </div>
      </motion.div>
      <div className="pt-32 max-sm:pt-24 px-5 pb-14 flex flex-col gap-10 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-5 items-center">
          {/* Badge */}
          <motion.div variants={fadeUpVariant} className="mb-8 text-center inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">
              Your Go-To Operations Scaling Partner
            </span>
          </motion.div>

          {/* <div className="flex flex-col gap-0 w-full">
            <TextGenerateEffect
              className="text-center lg:text-7xl md:text-5xl text-4xl font-semibold leading-tight"
              words={"Ship your product 3x faster <br /> without hiring a tech team"}
            />
          </div> */}

          {/* Main Heading */}
          <motion.h1
            variants={fadeUpVariant}
            className="text-[42px] text-center sm:text-5xl md:text-[80px] font-sans font-normal leading-[1.1] tracking-[-0.02em] max-w-4xl mx-auto py-2 text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-6"
          >
            Scale Your Operations, <br className="sm:hidden" /> <span className="font-serif italic text-transparent bg-clip-text">Not Your Headcount.</span>
          </motion.h1>
          {/* Subtitle */}
          <motion.p variants={fadeUpVariant} className="text-white/70 text-center sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 px-4 sm:px-0">
            We design and build custom AI workflows, automations, and internal dashboards that reduce manual work and help your team work faster and smarter.
          </motion.p>
        </div>
        <motion.div
          className="flex items-center justify-center flex-col md:flex-row gap-5 md:gap-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="z-20">
            <Button
              className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-semibold rounded-none border-3 border-black/30 transition-all"
              onClick={() => window.open('https://calendly.com/rhinonlabs', '_blank')}
            >
              Book a Free Discovery Call
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4">
            {/* Avatar Stack */}
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                <img src="https://randomuser.me/api/portraits/women/1.jpg" alt="User 1" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                <img src="https://randomuser.me/api/portraits/men/2.jpg" alt="User 2" className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                <img src="https://randomuser.me/api/portraits/women/3.jpg" alt="User 3" className="w-full h-full rounded-full object-cover" />
              </div>
            </div>

            {/* Rating & Trust Text */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-white text-white" />
                ))}
              </div>
              <span className="text-white/70 text-sm">Trusted by 20+ startups and SMBs worldwide.</span>
            </div>
          </div>
        </motion.div>

        {/* Direct Contact Option */}
        <motion.div
          className="text-center text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-sm">
            Prefer to talk directly?{" "}
            <a
              href="tel:+918249291789"
              className="font-semibold text-white hover:underline transition-all"
            >
              Call us: +91 8249 291 789
            </a>
            {" "}or{" "}
            <a
              href="https://wa.me/918249291789"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white hover:underline transition-all"
            >
              WhatsApp
            </a>
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col gap-5 mt-10">
        <motion.div
          className="flex flex-col md:flex-row justify-center px-5 gap-5 md:gap-10 max-w-4xl mx-auto text-sm md:text-base text-center text-white/70"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
        >
          <span>Fast Delivery • Affordable Pricing • AI-Powered Development</span>
        </motion.div>

        {/* Photo carousel - visible on desktop (md+), hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          viewport={{ once: true }}
          className="pb-3 hidden md:block mask-[linear-gradient(to_bottom,black_50%,transparent_100%)] webkit-mask-[linear-gradient(to_bottom,black_50%,transparent_100%)]"
        >
          <Photos />
        </motion.div>
      </div>
    </div>
  );
};

export default Hero1;

"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Phone, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const FloatingContactButton = () => {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const { scrollY } = useScroll();

    // Hide on contact page
    const shouldHide = pathname === "/contact-us";

    useEffect(() => {
        const unsubscribe = scrollY.on("change", (latest) => {
            // Show button after scrolling 300px
            setIsVisible(latest > 300);
        });

        return () => unsubscribe();
    }, [scrollY]);

    if (shouldHide) return null;

    return (
        <motion.div
            className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.8,
                y: isVisible ? 0 : 20,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            {/* WhatsApp Button */}
            <motion.a
                href="https://wa.me/918249291789"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Contact via WhatsApp"
            >
                <MessageCircle className="w-6 h-6 text-white" />

                {/* Tooltip */}
                <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                    WhatsApp Us
                </span>

                {/* Pulse Animation */}
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></span>
            </motion.a>

            {/* Phone Button */}
            <motion.a
                href="tel:+918249291789"
                className="group relative w-14 h-14 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Call us"
            >
                <Phone className="w-6 h-6 text-black" />

                {/* Tooltip */}
                <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                    Call Now
                </span>
            </motion.a>
        </motion.div>
    );
};

export default FloatingContactButton;

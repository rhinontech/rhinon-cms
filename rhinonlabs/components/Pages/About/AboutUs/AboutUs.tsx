'use client'
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { motion } from 'framer-motion'
import Link from "next/link";
import { useRouter } from "next/navigation";

const AboutUs = () => {
    const router = useRouter()
    return (
        <div className="flex items-center flex-col py-20 px-5 gap-20">
            {/* Header */}
            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-5 items-center">
                    <p className="text-center">ABOUT</p>

                    <div className="flex w-fit text-center">
                        <h2 className="lg:text-7xl md:text-5xl text-3xl">Our Philosophy</h2>
                    </div>
                    <p className="text-center max-w-2xl text-lg text-white/80">We're a founder-led team specializing in internal systems for scaling enterprises. We work directly with product, ops, and engineering leaders to fix systems that slow teams down.</p>
                </div>
                <div className="flex items-center max-md:gap-5 max-md:flex-col justify-center gap-10">
                    <div className="">
                        <Button className="bg-white text-black hover:bg-gray-200 px-6 py-6  text-base font-semibold rounded-none border-3 border-black/30" onClick={() => router.push("/contact-us")}>
                            Book a 20-min Discovery Call
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
                            <span className="text-white/70 text-sm">Trusted by modern organizations worldwide.</span>
                        </div>
                    </div>
                </div>
            </div>
            <motion.div
                className=" relative flex h-[75vh] w-[80vw] max-md:h-[70vh]  items-center justify-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", }}
                viewport={{ once: true, amount: 0.4 }} // 👈 only animate on first view
            >
                <div className="absolute inset-0 -z-10">
                    <img src="/assets/about/architecture_wide.png" className="w-full h-full opacity-50 object-cover" alt="Rhinon Web Architecture" />
                </div>

            </motion.div>


        </div>
    )
}

export default AboutUs;
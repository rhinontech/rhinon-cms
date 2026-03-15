'use client'
import { Button } from "@/components/ui/button"
import { TextGenerateEffect } from "@/components/ui/text-generate-effect"
import { Star } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

const Hero = () => {
    const router = useRouter()
    return (
        <div className="pt-44 max-md:pt-20 px-5 pb-10 flex flex-col gap-20 max-w-[1200px] mx-auto" >

            {/* Header */}
            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-5 items-center">
                    <motion.p
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", }}
                        viewport={{ once: true }} // 👈 only animate on first view

                    >ABOUT</motion.p>

                    <div className="flex w-fit text-center">
                        <TextGenerateEffect className="lg:text-7xl md:text-5xl text-4xl" words={"Re-engineering the <br /> digital enterprise."} />
                    </div>
                    <motion.p
                        className="text-center max-w-2xl text-lg text-white/80"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", }}
                        viewport={{ once: true }} // 👈 only animate on first view
                    >Rhinon Web is not a traditional agency. We are a specialized product studio dedicated to building high-performance dashboards, internal tools, and mission-critical software.</motion.p>
                </div>
                <motion.div
                    className="flex items-center max-md:flex-col max-md:gap-5 justify-center gap-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", }}
                    viewport={{ once: true }} // 👈 only animate on first view
                >
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
                </motion.div>
            </div>

            {/* Trusted by */}
            <div className="flex h-24 border-t-1 border-white/10">
                <div className="flex items-center w-[120px] max-md:w-full max-md:hidden mr-10">
                    <p className="text-sm tracking-widest text-white/70">
                        TRUSTED BY
                    </p>
                </div>
                <div className="flex items-center justify-center w-full overflow-hidden mask-image-gradient">
                    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
                        <div className="flex w-fit animate-scroll gap-16 pr-16">
                            {[...Array(2)].map((_, setIndex) => (
                                <div key={setIndex} className="flex gap-16 items-center shrink-0">
                                    {[
                                        {
                                            type: "image",
                                            src: "https://rhinon.tech/_next/image?url=%2Fassets%2Frhinonlogo.png&w=256&q=75",
                                            alt: "Rhinon Tech"
                                        },
                                        {
                                            type: "image",
                                            src: "https://richharbor.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FRH-Logo.c9812010.png&w=3840&q=75",
                                            alt: "Rich Harbor"
                                        },
                                        {
                                            type: "text",
                                            text: "Al Rooha Pvt",
                                            className: "text-xl font-bold tracking-widest uppercase"
                                        },
                                        {
                                            type: "text",
                                            text: "6hz",
                                            className: "text-xl font-bold tracking-widest uppercase"
                                        },
                                        {
                                            type: "image",
                                            src: "https://rhinon.tech/_next/image?url=%2Fassets%2Frhinonlogo.png&w=256&q=75",
                                            alt: "Rhinon Tech"
                                        },
                                        {
                                            type: "image",
                                            src: "https://richharbor.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FRH-Logo.c9812010.png&w=3840&q=75",
                                            alt: "Rich Harbor"
                                        },
                                        {
                                            type: "text",
                                            text: "Al Rooha Pvt",
                                            className: "text-xl font-bold tracking-widest uppercase"
                                        },
                                        {
                                            type: "text",
                                            text: "6hz",
                                            className: "text-xl font-bold tracking-widest uppercase"
                                        },
                                    ].map((company, i) => (
                                        <div key={i} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default">
                                            {company.type === "image" ? (
                                                <img
                                                    src={company.src}
                                                    alt={company.alt}
                                                    className="h-8 w-auto object-contain"
                                                />
                                            ) : (
                                                <div className={`whitespace-nowrap text-white ${company.className}`}>
                                                    {company.text}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <TextGenerateEffect
                className="text-3xl font-medium text-center leading-relaxed text-white/50"
                words={"At Rhinon Web, we're passionate about designing intelligent digital ecosystems that leave a lasting impression. Our mission is to transform your complex workflows into seamless reality with a blend of AI-driven innovation, engineering expertise, and attention to detail. We believe the key to exceptional results lies in deep partnership."}
                highlight={["Rhinon", "Web", "intelligent", "digital", "ecosystems", "that", "leave", "a", "lasting", "impression", "AIdriven", "innovation", "engineering", "expertise", "and", "attention", "to", "detail", "deep", "partnership"]}
                highlightClassName="text-white"
                textColor=""
            />
        </div>
    )
}

export default Hero;
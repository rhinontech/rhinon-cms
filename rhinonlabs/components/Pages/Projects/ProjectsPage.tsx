'use client'
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { motion } from 'framer-motion';
import Link from 'next/link';



import { projects as slides } from "./data";
import { useRouter } from "next/navigation";

const ProjectsPage = () => {
    const router = useRouter();
    return (
        <div className="relative flex flex-col overflow-hidden ">
            <motion.div
                className="absolute inset-0 top-0 left-0 -z-10"
                initial={{ opacity: 0, }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                viewport={{ once: true }} // 👈 only animate on first view
            >
                <div className="[mask-image:linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)]
                mask-mode:luminance">
                    <img src="/images/background/q3lzdr4u88731.jpg" className="w-full h-full object-cover" alt="" />
                </div>
            </motion.div>
            <div>
                <div className=" pt-44 max-md:pt-20 px-5 pb-10 flex flex-col gap-10 max-w-[1400] mx-auto" >
                    <div className="flex flex-col gap-5 items-center">
                        <motion.p
                            className="text-center"
                            initial={{ opacity: 0, y: 20, }}
                            animate={{ opacity: 1, y: 0, }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            viewport={{ once: true }} // 👈 only animate on first view
                        >PORTFOLIO</motion.p>

                        <div className="flex flex-col gap-0">
                            <TextGenerateEffect className="lg:text-7xl md:text-5xl text-4xl " words={"Selected Works"} />

                        </div>
                        <motion.p
                            className="text-center max-w-2xl text-lg text-white/80"
                            initial={{ opacity: 0, y: 20, }}
                            animate={{ opacity: 1, y: 0, }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            viewport={{ once: true }} // 👈 only animate on first view
                        >Rhinon Web delivers mission-critical digital platforms for forward-thinking enterprises. We build scalable, high-performance tools that drive business growth.</motion.p>
                    </div>
                    <motion.div
                        className="grid grid-cols-2 max-md:grid-cols-1 gap-5"
                        initial={{
                            opacity: 0,
                            y: 20,
                            rotateX: 10,      // like lifting from the back
                            transformPerspective: 1000,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            rotateX: 0,       // now upright facing viewer
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            delay: 0.5
                        }}
                        viewport={{ once: true }}
                    >
                        {slides.map((slide) => (
                            <div key={slide.id} className="group border border-white/30 relative w-full h-[450px] max-md:h-[300px] overflow-hidden cursor-pointer" onClick={() => router.push(`/projects/${slide.id}`)}>
                                {/* IMAGE */}
                                <img
                                    src={slide.images[0]}
                                    alt="project"
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:opacity-70"
                                />

                                {/* MASK OVERLAY */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                                {/* CONTENT ON HOVER */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                                    <h3 className="text-white text-center text-2xl font-[500]">{slide.title}</h3>
                                    <p className="text-gray-200 text-center text-sm tracking-wide">{slide.category}</p>
                                </div>
                            </div>
                        ))}


                    </motion.div>

                    {/* Similar Problems We Solve Section */}
                    <motion.div
                        className="mt-20 max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-3 text-center">
                                <p className="uppercase text-sm md:text-base text-white/70">Enterprise Challenges</p>
                                <h2 className="text-3xl md:text-5xl font-semibold">Similar Problems We Solve</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    "Legacy dashboards that slow decision-making",
                                    "Manual ops workflows creating bottlenecks",
                                    "Admin tools that don't scale with teams",
                                    "Disconnected systems across ops & product",
                                    "Internal tools built by engineers, not designers",
                                    "Dashboards that can't handle complex permissions"
                                ].map((problem, index) => (
                                    <div key={index} className="p-5 border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg hover:border-white/20 transition-all">
                                        <p className="text-white/90">{problem}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                </div>

            </div>

        </div>
    )
}

export default ProjectsPage;
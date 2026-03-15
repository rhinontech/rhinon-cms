"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

interface ProjectDetailProps {
    project: {
        id: number;
        title: string;
        category: string;
        description: string;
        date: string;
        industry: string;
        timeline: string;
        liveLink: string;
        images: string[];
    }
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project }) => {
    return (
        <div className="text-white pt-36 pb-20">

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
            <div className="max-w-[1440px] mx-auto px-5 md:px-10">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Column - Scrollable Images */}
                    <div className="w-full lg:w-2/3 flex flex-col gap-10 pt-10">
                        {project.images.map((img, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="w-full rounded-lg overflow-hidden border border-white/10"
                            >
                                <img src={img} alt={`${project.title} screenshot ${index + 1}`} className="w-full h-auto object-cover" />
                            </motion.div>
                        ))}
                    </div>

                    {/* Right Column - Sticky Details */}
                    {/* <div className="w-full lg:w-1/3 relative">
                        <div className="lg:sticky lg:top-32 flex flex-col gap-8">
                            <div>
                                <p className="text-sm tracking-widest text-white/60 mb-2">{project.category}</p>
                                <h1 className="text-4xl md:text-5xl font-semibold leading-tight">{project.title}</h1>
                            </div>

                            <p className="text-lg text-white/70 leading-relaxed">
                                {project.description}
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full bg-gray-700 border-2 border-black overflow-hidden">
                                            <img src={`https://randomuser.me/api/portraits/men/${i + 20}.jpg`} alt="Team" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex text-white">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="white" />)}
                                    </div>
                                    <span className="text-xs text-white/60">Trusted by 36+ businesses</span>
                                </div>
                            </div>

                            <div className="w-full h-px bg-white/10 my-2"></div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-white/50 uppercase tracking-wider">Date</p>
                                    <p className="font-medium">{project.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/50 uppercase tracking-wider">Industry</p>
                                    <p className="font-medium">{project.industry}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-white/50 uppercase tracking-wider">Timeline</p>
                                    <p className="font-medium">{project.timeline}</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Link href={project.liveLink} className="flex items-center gap-2 text-white hover:text-white/80 transition-colors group">
                                    <span className="font-medium">Visit Live Site</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="pt-6">
                                <Button className="w-full py-6 text-lg bg-white text-black hover:bg-gray-200 rounded-none">
                                    Start a Project Like This
                                </Button>
                            </div>
                        </div>
                    </div> */}

                    {/* Yellow sticky box */}
                    <motion.div
                        style={{
                            position: "sticky",
                            top: "150px",
                        }}
                        className="h-fit flex items-center justify-center font-semibold pt-20 w-[50%]"
                    >
                        <section className="px-8">
                            <div className="">
                                {/* Label */}
                                <div className="mb-3">
                                    <span className="text-sm font-semibold tracking-widest text-white/80">
                                        {project.category}
                                    </span>
                                </div>

                                {/* Heading */}
                                <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
                                    {project.title}
                                </h1>

                                {/* Description */}
                                <p className="text-lg text-white/80 mb-12 font-normal max-w-lg">
                                    {project.description}
                                </p>

                                <div className='flex items-center gap-5'>

                                    {/* CTA Button */}
                                    <div className="">
                                        <Button className="bg-white text-black hover:bg-gray-200 px-6 py-6  text-base font-semibold rounded-none border-3 border-black/30">
                                            <Link href="/contact-us">
                                                Start a Project
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Social Proof */}
                                    <div className="flex items-center gap-4">
                                        {/* Avatar Stack */}
                                        <div className="flex -space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                                                <img
                                                    src="https://randomuser.me/api/portraits/women/1.jpg"
                                                    alt="User 1"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                                                <img
                                                    src="https://randomuser.me/api/portraits/men/2.jpg"
                                                    alt="User 2"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            {/* <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                                                <img
                                                    src="https://randomuser.me/api/portraits/women/3.jpg"
                                                    alt="User 3"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div> */}
                                        </div>

                                        {/* Rating & Trust Text */}
                                        <div className="flex flex-col">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-white text-white" />
                                                ))}
                                            </div>
                                            <span className="text-white/80 text-sm font-light mt-1">
                                                Trusted by leading enterprises & fast-growing teams worldwide.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="w-full h-px bg-white/10 my-2"></div> */}

                                <div className="flex flex-col gap-2 mt-10">
                                    <div className='flex items-center justify-between'>
                                        <p className="font-medium uppercase tracking-wider">Date</p>
                                        <p className="font-medium text-white/50 tracking-wider">{project.date}</p>
                                    </div>

                                    <div className="w-full h-px bg-white/10 my-2"></div>
                                    <div className='flex items-center justify-between'>
                                        <p className="font-medium uppercase tracking-wider">Industry</p>
                                        <p className="font-medium text-white/50 tracking-wider">{project.industry}</p>
                                    </div>

                                    <div className="w-full h-px bg-white/10 my-2"></div>
                                    <div className='flex items-center justify-between'>
                                        <p className="font-medium uppercase tracking-wider">Status</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white/50 tracking-wider">Live</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-px bg-white/10 my-2"></div>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <p className="font-medium uppercase tracking-wider">Live Projects</p>
                                        </div>
                                        <p className="flex items-center gap-2 font-medium text-white/50 tracking-wider hover:text-white transition-colors cursor-pointer" onClick={() => window.open(project.liveLink, "_blank")}>Visit Site <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></p>
                                    </div>
                                    <div className="w-full h-px bg-white/10 my-2"></div>
                                </div>

                            </div>
                        </section>
                    </motion.div>

                </div>
            </div>
        </div >
    );
};

export default ProjectDetail;

"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useState } from "react";
import { FAQ } from "@/components/Common/FAQ/FAQ";
import { CustomXIcon, Footer } from "@/components/Common/Footer/Footer";
import { Mail, Phone, Headphones, User, Waves, Twitter, Instagram, Linkedin } from "lucide-react";

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        whatsapp: "",
        company: "",
        projectType: "",
        message: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    whatsapp: formData.whatsapp,
                    company: formData.company,
                    service: formData.projectType,
                    message: formData.message,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setFormData({
                    name: "",
                    email: "",
                    whatsapp: "",
                    company: "",
                    projectType: "",
                    message: "",
                });
            } else {
                setError("Failed to submit. Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background relative selection:bg-primary/50 flex flex-col">

            <div className="grow pt-32 pb-24 relative overflow-hidden flex flex-col items-center">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-16 px-6">

                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">

                        <Phone className="w-3.5 h-3.5 text-white/70" />

                        <span className="text-[11px] font-bold tracking-[0.2em] text-[#A3B8CC] uppercase font-sans">
                            CONTACT
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-4">
                        We’d love to hear <span className="font-serif italic text-transparent bg-clip-text">from you!</span>
                    </h1>
                    <p className="opacity-60 max-w-md">
                        Contact us for inquiries, support, or feedback. We're here to assist you every step of the way.
                    </p>
                </div>

                {/* Content Section */}
                <div className="max-w-[1000px] w-full mx-auto px-6 relative z-10 flex flex-col md:flex-row gap-6">

                    {/* Left Column: Info Cards */}
                    <div className="md:w-[45%] flex flex-col gap-6">

                        {/* Email Us Card */}
                        <div className="p-8 overflow-hidden rounded-2xl relative  border border-border/7 flex flex-col items-start shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] ">
                            <div className="flex gap-2 items-center mb-3">
                                <div className="px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]  flex items-center justify-center ">
                                    <Mail className="w-7 h-7" />
                                </div>
                                <h2 className="text-xl font-semibold ">Email Us</h2>
                            </div>
                            <p className="text-[16px] opacity-60 mb-8 leading-relaxed pr-4">
                                Facing technical challenges or product concerns? We're here to assist
                            </p>
                            <a href="mailto:upasana@rhinon.tech" className="text-[16px] opacity-90 underline underline-offset-2 decoration-1">
                                Send us an email
                            </a>

                            <div
                                className="absolute top-0 right-0 pointer-events-none z-10"
                                style={{
                                    width: '437px',
                                    height: '306px',
                                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)',
                                    opacity: 0.1,
                                    transform: 'translate(50%, -50%)'
                                }}
                            />
                        </div>

                        {/* Contact Sales Card */}
                        <div className="p-8 overflow-hidden rounded-2xl relative  border border-border/7 flex flex-col items-start shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] ">
                            <div className="flex gap-2 items-center mb-3">
                                <div className="px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]  flex items-center justify-center ">
                                    <User className="w-7 h-7" />
                                </div>
                                <h2 className="text-xl font-semibold ">Contact Sales</h2>
                            </div>
                            <p className="text-[16px] opacity-60 mb-8 leading-relaxed pr-4">
                                Let's collaborate on custom solutions or discuss product insights
                            </p>
                            <div className="flex items-center gap-4 mb-8">
                                <a href="https://x.com/RhinonLabs" target="_blank" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                                    <CustomXIcon />
                                </a>
                                <a href="https://www.instagram.com/rhinonlabs/" target="_blank" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <Instagram className="w-5 h-5 text-white/80" />
                                </a>
                                <a href="https://www.linkedin.com/company/rhinonlabs" target="_blank" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                                    <Linkedin className="w-5 h-5 text-white/80" />
                                </a>
                            </div>
                            <a href="tel:+918249291789" className="text-[16px] opacity-90 underline underline-offset-2 decoration-1">
                                Book a call
                            </a>

                            <div
                                className="absolute top-0 right-0 pointer-events-none z-10"
                                style={{
                                    width: '437px',
                                    height: '306px',
                                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)',
                                    opacity: 0.1,
                                    transform: 'translate(50%, -50%)'
                                }}
                            />
                        </div>

                    </div>

                    {/* Right Column: Form */}
                    <div className="md:w-[55%]">
                        <div className="p-8 md:px-10 md:py-12 rounded-2xl overflow-hidden border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] relative h-full flex flex-col">

                            {/* Form Header */}
                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]  flex items-center justify-center mb-5 ">
                                    <Headphones className="w-7 h-7" />
                                </div>
                                <h2 className="text-xl font-semibold">
                                    Send us your query
                                </h2>
                            </div>

                            {/* Form */}
                            <form className="space-y-6 relative z-10 flex-1 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="space-y-5">
                                        <label htmlFor="fullName" className="text-[14px] font-semibold opacity-60 tracking-wide ">Name</label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            className="w-full mt-1.5 border border-border/7 rounded-[8px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-[14px] font-semibold opacity-60 tracking-wide ">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="w-full mt-1.5 border border-border/7 rounded-[8px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                                            placeholder="Enter your email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-[14px] font-semibold opacity-60 tracking-wide ">Subject</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            className="w-full mt-1.5 border border-border/7 rounded-[8px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
                                            placeholder="Enter your subject"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-[14px] font-semibold opacity-60 tracking-wide ">Message</label>
                                        <textarea
                                            id="message"
                                            rows={3}
                                            className="w-full mt-1.5 border border-border/7 rounded-[8px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                                            placeholder="Enter your message"
                                        />
                                    </div>
                                </div>

                                <div className=" relative group">
                                    <Button className="w-full bg-background   border-border/7 text-white font-semibold py-6 rounded-[8px] text-[15px] transition-colors relative z-10 ">
                                        Send Your Message
                                    </Button>
                                    {/* <div className="absolute left-1/2 bottom-0 w-[40%] h-4 bg-white/20 blur-[12px] -translate-x-1/2 group-hover:bg-white/30 transition-all rounded-full pointer-events-none" /> */}
                                </div>
                            </form>


                            <div
                                className="absolute top-0 right-0 pointer-events-none z-10"
                                style={{
                                    width: '437px',
                                    height: '306px',
                                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)',
                                    opacity: 0.1,
                                    transform: 'translate(50%, -50%)'
                                }}
                            />
                        </div>
                    </div>

                </div>


                {/* Existing Dividers/Overlays similarly added to other sections */}
                <div
                    className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-[4px]"
                    style={{
                        background: 'radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)'
                    }}
                />

                <div
                    className="absolute -bottom-[249px] left-0 right-0 mx-auto w-[793px] h-[499px] opacity-10 pointer-events-none -rotate-13 rounded-[10px]"
                    style={{
                        background: 'radial-gradient(50% 50% at 50% 50%, rgba(213, 219, 230, 0.7) 0%, rgba(213, 219, 230, 0) 100%)',
                        zIndex: 1
                    }}
                />
            </div>
            <FAQ />

            
        </main>
    );
};

export default ContactUs;
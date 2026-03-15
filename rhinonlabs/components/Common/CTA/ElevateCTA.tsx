'use client';
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useRef, useEffect } from 'react';

const CanvasRays = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Generate 15 deterministic rays so they look consistent on every load
        const rays = Array.from({ length: 35 }).map((_, i) => {
            // Using index 'i' to create pseudo-random but fixed values
            const normalizedIndex = i / 35;

            return {
                baseAngle: Math.PI * ((i * 0.618) % 1), // Spans a full 180 degrees from left to right
                speed: 0.001 + ((i * 1.3) % 1) * 0.005,
                width: 2 + ((i * 2.7) % 1) * 6, // Very narrow at the source (origin)
                endWidth: 150 + ((i * 1.9) % 1) * 300, // Very wide at the bottom
                length: canvas.height * 2 + ((i * 0.4) % 1) * (canvas.height * 0.5),
                phase: normalizedIndex * Math.PI * 2,
                opacity: 0.15 + ((i * 3.1) % 1) * 1 // Slightly sharper opacity 
            };
        });

        const draw = () => {
            time += 1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const originX = canvas.width / 2;
            const originY = -50; // slightly above top edge

            rays.forEach(ray => {
                // Sway back and forth based on sine wave
                const angleOffset = Math.sin(time * ray.speed + ray.phase) * 0.15;
                const currentAngle = ray.baseAngle + angleOffset;

                const endX = originX + Math.cos(currentAngle) * ray.length;
                const endY = originY + Math.sin(currentAngle) * ray.length;

                // Polygon math to create a ray that gets wider at the bottom
                const perpAngle = currentAngle + Math.PI / 2;
                const widthAtEnd = ray.endWidth;

                // Primary color fading out to transparent
                const r = 28, g = 43, b = 255; // Matches #1c2bff
                const pulse = Math.sin(time * ray.speed * 2 + ray.phase) * 0.05;
                const finalOpacity = Math.max(0, ray.opacity + pulse);

                const gradient = ctx.createLinearGradient(originX, originY, endX, endY);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalOpacity})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(originX - Math.cos(perpAngle) * ray.width / 2, originY - Math.sin(perpAngle) * ray.width / 2);
                ctx.lineTo(originX + Math.cos(perpAngle) * ray.width / 2, originY + Math.sin(perpAngle) * ray.width / 2);
                ctx.lineTo(endX + Math.cos(perpAngle) * widthAtEnd / 2, endY + Math.sin(perpAngle) * widthAtEnd / 2);
                ctx.lineTo(endX - Math.cos(perpAngle) * widthAtEnd / 2, endY - Math.sin(perpAngle) * widthAtEnd / 2);
                ctx.closePath();
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-90 blur-md" />;
};

const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

export function ElevateCTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-4 relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.15 } }
                    }}
                    className="relative overflow-hidden rounded-[2rem] border-[0.5px] border-white/10 bg-background min-h-[500px] flex flex-col items-center justify-center text-center p-8 md:p-16"
                >
                    {/* Animated Light Rays */}
                    <div className="absolute inset-0  pointer-events-none overflow-hidden mix-blend-screen">
                        <CanvasRays />
                        {/* Core Source Glow */}

                    </div>

                    {/* Dot Pattern Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-100"
                        style={{
                            backgroundImage: 'url("https://framerusercontent.com/images/1xOqMa4sAAwBCrdkiSJfIXups.png?scale-down-to=2048")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            mixBlendMode: 'screen'
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
                        <motion.div variants={fadeUpVariant} className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium tracking-widest text-[#A3B8CC]">
                                Work With Us
                            </span>
                        </motion.div>

                        <motion.h2 variants={fadeUpVariant} className="text-4xl md:text-6xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white/70 to-white/30 mb-6 leading-tight">
                            Need something else?  <br className="hidden md:block" />
                            <span className="font-serif italic text-transparent bg-clip-text">Let’s Talk.</span>
                        </motion.h2>

                        <motion.p variants={fadeUpVariant} className="text-base text-white/60 md:text-lg mb-10 max-w-2xl leading-relaxed">
                            Ready to take the next step? Join us now and start transforming your vision into reality with expert support.
                        </motion.p>

                        <motion.div variants={fadeUpVariant}>
                            <Button size="lg" className="rounded-2xl max-sm:py-5 px-8 bg-primary hover:bg-primary/90 text-white max-sm:text-sm font-medium">
                                Get a Custom System Built for Your Business
                            </Button>
                        </motion.div>
                    </div>

                    {/* Bottom-to-Top Black Gradient Overlay (Solid black on bottom 50%) */}
                    <div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{ background: 'linear-gradient(to top, #04070D 0%, #04070D 50%, transparent 100%)' }}
                    />
                </motion.div>
            </div>
        </section>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const initialWords = [
    'Spending hours on repetitive work',
    "Scattered data across different tools",
    "Automation didn’t really fix the chaos",
    "You keep hiring more for operations",
    "No clarity inside operations and tasks",
];

// We reverse the array visually so that physically sliding downwards (pulling in text from above) reads correctly from 0 to 5.
const reversedWords = [...initialWords].reverse();
// Three full loops guarantee we can do a seamless invisible teleport to create the perfect infinite scroll.
const listWords = [...reversedWords, ...reversedWords, ...reversedWords]; // 18 items
const WORD_COUNT = initialWords.length;

export function Problem() {
    const startIndex = (2 * WORD_COUNT) - 1;
    const teleportIndex = WORD_COUNT - 1;

    const controls = useAnimation();
    const [activeIndex, setActiveIndex] = useState(startIndex);
    const [itemHeight, setItemHeight] = useState(80);

    useEffect(() => {
        const updateHeight = () => {
            setItemHeight(window.innerWidth < 768 ? 50 : 80);
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    useEffect(() => {
        let isMounted = true;
        let current = startIndex;

        // Set initial invisible position instantly
        controls.set({ y: -current * itemHeight });

        const runAnimation = async () => {
            // First delay is shorter so the page feels alive immediately after refresh.
            let isFirst = true;

            while (isMounted) {
                // Wait for the holding period (text stays still)
                await new Promise(resolve => setTimeout(resolve, isFirst ? 400 : 1600));
                isFirst = false;

                if (!isMounted) break;

                // Move down one slot physically
                current -= 1;
                setActiveIndex(current);

                // Animate beautifully and wait for the CSS transition to fully finish
                await controls.start({
                    y: -current * itemHeight,
                    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                });

                // Immediately after the animation finishes, check if we've hit the teleport boundary
                if (current === teleportIndex) {
                    current = startIndex;
                    setActiveIndex(current);
                    controls.set({ y: -current * itemHeight }); // Instance teleport
                }
            }
        };

        runAnimation();

        return () => {
            isMounted = false;
        };
    }, [controls, itemHeight]);

    return (
        <section id="problem" className="py-16 md:py-24 relative overflow-hidden bg-background flex flex-col items-center justify-center min-h-[40vh] md:min-h-[60vh]">
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 relative z-10 w-full flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">

                {/* Left side */}
                <div className="flex relative items-center text-3xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-white whitespace-nowrap z-20">
                    {/* <span className="bg-[#e4d9ff] text-black pr-1 py-1 ">Sound familiar </span> */}
                    <span className="ml-0 md:ml-4">Sound familiar?</span>
                    {/* SVG Arrow */}
                    <div className="ml-4 w-16 h-16 relative hidden lg:block -mt-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                            <defs>
                                <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ff4d4d" />
                                    <stop offset="50%" stopColor="#ff8c42" />
                                    <stop offset="100%" stopColor="#a230ed" />
                                </linearGradient>
                            </defs>
                            <path d="M 0 60 Q 40 0 80 50" fill="none" stroke="url(#arrowGradient)" strokeWidth="4" strokeLinecap="round" />
                            <path d="M 60 55 L 82 52 L 75 30" fill="none" stroke="url(#arrowGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* <div className="absolute top-0 left-0 z-10">
                        <img src="https://framerusercontent.com/images/8BXeBQObnslmzSi9htBC7WTLXM.svg" alt="Arrow Decoration" />
                    </div> */}
                </div>

                {/* Right side list */}
                <div
                    className="relative h-[250px] md:h-[350px] overflow-hidden w-full md:w-auto flex flex-col justify-center items-center md:items-start mt-4 md:mt-0"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' }}
                >
                    <div className="relative w-full h-[250px] md:h-[350px] min-w-[280px] sm:min-w-[400px] md:min-w-[750px]">
                        <motion.div
                            animate={controls}
                            className="absolute left-0 w-full"
                            style={{
                                top: `calc(50% - ${itemHeight / 2}px)`, // Physically locks the 0,0 mathematical center exactly to the middle of the viewport
                            }}
                        >
                            {listWords.map((word, i) => {
                                // By using modulo, both Item 5 and Item 11 share the exact same 'isCenter' boolean.
                                // This guarantees that when the list teleports from 5 to 11, the opacity values do not change or flash.
                                const isCenter = (i % WORD_COUNT) === (activeIndex % WORD_COUNT);

                                return (
                                    <div
                                        key={i}
                                        className={`absolute left-0 w-full text-center md:text-left text-lg sm:text-2xl md:text-5xl lg:text-5xl font-medium tracking-tighter whitespace-normal md:whitespace-nowrap flex flex-col justify-center px-4 md:px-0 ${isCenter ? 'z-10' : 'z-0'}`}
                                        style={{ top: `${i * itemHeight}px`, height: `${itemHeight}px` }}
                                    >
                                        <div className="relative w-full block">
                                            {/* Base text */}
                                            <span
                                                className="relative w-full block text-white transition-opacity duration-500 leading-tight"
                                                style={{ opacity: isCenter ? 0 : 0.2 }}
                                            >
                                                {word}
                                            </span>

                                            {/* Gradient text overlay */}
                                            <span
                                                className="absolute left-0 top-0 w-full block text-transparent bg-clip-text bg-linear-to-r from-[#ff4d4d] via-[#ff8c42] to-[#a230ed] pointer-events-none transition-opacity duration-500 leading-tight"
                                                style={{ opacity: isCenter ? 1 : 0 }}
                                            >
                                                {word}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </div>
                </div>

            </div>
            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-y-1/2 -translate-x-1/2 bg-[radial-gradient(circle,rgba(162,48,237,0.05)_0,transparent_70%)] pointer-events-none" />
        </section>
    );
}

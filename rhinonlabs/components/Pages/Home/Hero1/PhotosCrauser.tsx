'use client'
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SLIDE_DURATION = 1500; // milliseconds

const slides = [
  {
    id: 1,
    image: "/assets/hero/1.png",
    title: "LIVE SESSIONS",
    subtitle: "Collaborate, connect, and learn together",
    tags: [
      { text: "interact", x: "-top-4 left-2", y: "" },
      { text: "engage", x: "top-5 -right-8", y: "" },
      { text: "vibe", x: "top-1/2 -left-8", y: "" },
      { text: "surge", x: "top-[80%] -right-8", y: "" },
    ],
  },
  {
    id: 2,
    image: "/assets/hero/2.png",
    title: "COMMUNITY MEETUPS",
    subtitle: "Build lasting professional connections",
    tags: [
      { text: "collaborate", x: "-top-4 left-2", y: "" },
      { text: "connect", x: "top-5 -right-4", y: "" },
      { text: "grow", x: "top-1/2 -left-8", y: "" },
      { text: "learn", x: "top-[80%] -right-8", y: "" },
    ],
  },
  {
    id: 3,
    image: "/assets/hero/3.png",
    title: "LEARN BY BUILDING",
    subtitle: "Interactive learning experiences in real-time",
    tags: [
      { text: "crafting", x: "-top-4 left-2", y: "" },
      { text: "apply", x: "top-5 -right-7", y: "" },
      { text: "buildship", x: "top-1/2 -left-15", y: "" },
      { text: "constructive", x: "top-[80%] -right-16", y: "" },
    ],
  },
];

export default function CarouselSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
      setIsTransitioning(false);
    }, 300);
  };

  const getSlidePosition = (index: any) => {
    const diff = (index - activeIndex + slides.length) % slides.length;

    if (diff === 0) return "center";
    if (diff === 1) return "right";
    if (diff === slides.length - 1) return "left";
    return "hidden";
  };

  const getSlideStyle = (position: any) => {
    const baseStyle = {
      transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    switch (position) {
      case "center":
        return {
          ...baseStyle,
          transform: "translateX(0) translateZ(0) scale(1)",
          opacity: 1,
          zIndex: 30,
        };
      case "left":
        return {
          ...baseStyle,
          transform: "translateX(-55%) translateZ(-150px) scale(0.8)",
          opacity: 1,
          zIndex: 10,
        };
      case "right":
        return {
          ...baseStyle,
          transform: "translateX(55%) translateZ(-150px) scale(0.8)",
          opacity: 1,
          zIndex: 10,
        };
      default:
        return {
          ...baseStyle,
          transform: "translateX(0) translateZ(-300px) scale(0.5)",
          opacity: 0,
          zIndex: 0,
        };
    }
  };

  return (
    <div className="h-[400px] sm:h-[450px] md:h-[650px] flex items-center justify-center overflow-visible">

      {/* card container */}
      <div
        className="relative w-full max-w-4xl h-full flex items-center justify-center"
        style={{ perspective: "1500px" }}
      >
        {slides.map((slide, index) => {
          const position = getSlidePosition(index);
          const style = getSlideStyle(position);

          return (
            <div
              key={slide.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                ...style,
                transformStyle: "preserve-3d",
                pointerEvents: position === "center" ? "auto" : "none",
              }}
            >
              <div className="relative w-[300px] border border-white/20 sm:w-[90%]  lg:w-full h-[650px] max-sm:h-[400px] p-[25px] shadow-2xl"
              >

                {/* Gradient overlay for left card (left to right) */}
                <div
                  className="absolute inset-0 z-50 pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                    opacity: position === "left" ? 1 : 0,
                    transition: "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                />

                {/* Gradient overlay for right card (right to left) */}
                <div
                  className="absolute inset-0 pointer-events-none z-50"
                  style={{
                    background: "linear-gradient(270deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
                    opacity: position === "right" ? 1 : 0,
                    transition: "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                />


                <div className="relative h-full sm:h-56 md:h-full w-auto  overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient overlay */}
                  {/* <div
                    className="absolute bottom-0 left-0 right-0 h-40"
                    style={{
                      background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0) 100%)"
                    }}
                  /> */}

                  {/* Text content */}
                  {/* <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <h2 className="text-white font-semibold tracking-wide text-[20px]">
                      {slide.title}
                    </h2>
                    <p className="text-[#FFFFFF] text-[14px] font-light">
                      {slide.subtitle}
                    </p>
                  </div> */}
                </div>

                {/* {position === "center" && (
                  <>
                    {slide.tags.map((tag, tagIndex) => (
                      <motion.div
                        key={tagIndex}
                        className={`absolute ${tag.x} px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white backdrop-blur-md bg-white/20 border border-[#FFFFFF] shadow-lg`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: 1,
                          y: [0, -10, 0]
                        }}
                        transition={{
                          opacity: { duration: 0.6, delay: tagIndex * 0.1 },
                          y: {
                            duration: 3,
                            delay: tagIndex * 0.3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        {tag.text}
                      </motion.div>
                    ))}
                  </>
                )} */}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
"use client"
import Hero from "./Hero/Hero";
import AboutUs from "./AboutUs/AboutUs";
import Team from "./Team/Team";
import Statics from "./Statics/Statics";
import { motion } from 'framer-motion';


const About = () => {
    return (
        <div className="relative flex flex-col ">
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
            <div className="">
                <Hero />
                <AboutUs />
                {/* <Team /> */}
                <Statics />
            </div>

        </div>

    )
}

export default About;
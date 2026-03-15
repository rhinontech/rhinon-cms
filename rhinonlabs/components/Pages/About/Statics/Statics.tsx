'use client'
import { CountUp } from "../CountUp/CountUp";

import { motion } from "framer-motion";

const statics = [
    {
        number: 98,
        title: 'Client Retention',
        subs: "Building long-term partnerships.",
    },
    {
        number: 50,
        title: 'Enterprise Projects',
        subs: "Delivered for global organizations.",
    },
    {
        number: 100,
        title: 'On-Time Delivery',
        subs: "Precision in execution.",
    }
]

const Statics = () => {
    return (
        <div className=" py-20 px-5 flex flex-col gap-20 max-w-[1200px] mx-auto" >
            <div className="flex flex-col gap-5">
                <p>BY THE NUMBERS</p>
                <h2 className="text-3xl md:text-5xl lg:text-7xl"> Our Impact <br /> by the numbers</h2>
            </div>
            <div className='grid grid-cols-1 gap-3 w-full  md:grid-cols-2 lg:grid-cols-3'>
                {statics.map((stat, index) => (
                    <motion.div
                        key={index}
                        className="border-t flex flex-col gap-5"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        viewport={{ once: true }} // 👈 only animate on first view
                    >
                        <div className="border-t border-white/70 w-fit">
                            <h2 className="text-4xl max-sm:text-3xl font-semibold pt-5"><CountUp target={stat.number} duration={0.8} />%</h2>
                        </div>
                        <h2 className="font-semibold text-xl mt-3">{stat.title}</h2>
                        <p className="text-white/70">{stat.subs}</p>
                    </motion.div>
                ))}

            </div>


        </div>

    )
}

export default Statics;
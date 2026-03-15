'use client'
import { Button } from "@/components/ui/button";
import { Linkedin } from "lucide-react";
import { motion } from "framer-motion";

const teams = [
    {
        name: "Ryan Smith",
        profession: "Founder",
        image: 'https://i.pinimg.com/736x/22/5f/4c/225f4c968155fcd81cc89182f673583b.jpg',
    },
    {
        name: "Levi Smith",
        profession: "Designer",
        image: 'https://i.pinimg.com/736x/1d/f1/48/1df148bff017c65474e302ce4b0d3ec5.jpg',
    },
    {
        name: "Eren Smith",
        profession: "Developer",
        image: 'https://i.pinimg.com/736x/04/32/0f/04320f63f177eac45bfeac2b8d0436e6.jpg',
    },
]

const Team = () => {
    return (
        <div className=" py-20 px-5 flex flex-col items-center gap-10 max-w-[1200px] mx-auto" >
            <div className="flex flex-col gap-5">
                <p className="text-center">LEADERSHIP</p>
                <h2 className="text-center lg:text-7xl md:text-5xl text-3xl ">Expertise Led By Builders</h2>
            </div>
            <div className="flex flex-col w-full gap-5">
                <div className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 w-full gap-3">
                    {teams.map((team, index) => (
                        <motion.div
                            key={index}
                            className=" group cursor-pointer relative flex items-end justify-center h-[450px] p-5"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 * index }}
                            viewport={{ once: true, amount: 0.5 }} // 👈 only animate on first view
                        >
                            <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,rgba(180,180,180,1),rgba(180,180,180,1)_70%,transparent)]">
                                <img src={team.image} className="w-full h-full group-hover:opacity-50 opacity-80 transition-all duration-300 object-cover" alt="" />
                            </div>

                            <div className="w-full flex">
                                <div className="flex flex-1 flex-col gap-2">
                                    <h2 className="text-xl font-semibold">{team.name}</h2>
                                    <p className="text-white/70">{team.profession}</p>
                                </div>
                                <div className="ml-3 flex items-center">
                                    <Linkedin fill="white" />
                                </div>

                            </div>

                        </motion.div>
                    ))}



                </div>
                <motion.div
                    className="flex flex-col border gap-20 max-md:gap-10 p-10 bg-[url('https://framerusercontent.com/images/q1aFGNfaXt7u0fNbIGobxcvPI.png?scale-down-to=2048')] bg-cover bg-center "
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", }}
                    viewport={{ once: true, amount: 0.5 }} // 👈 only animate on first view
                >
                    <h2 className="w-full text-2xl">Join our mission?</h2>
                    <div className="flex max-md:flex-col gap-5">
                        <p className="text-white/70 max-w-sm">
                            If you’d like to work on projects that matter, check out our open positions and apply.
                        </p>
                        <div className="flex-1 flex md:justify-end md:items-end">
                            <Button className="bg-white text-black hover:bg-gray-200  py-5 text-base font-semibold rounded-none border-3 border-black/30">
                                View open positions
                            </Button>
                        </div>
                    </div>

                </motion.div>

            </div>
        </div>
    )

}

export default Team;
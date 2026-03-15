'use client';
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export function ParticleOverlay() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    if (!init) return null;

    return (
        <div className="absolute w-[1320px] h-[442px] -left-[60px] -right-[60px] bottom-0 pointer-events-none z-2">
            <Particles
                id="tsparticles"
                options={{
                    fullScreen: { enable: false },
                    background: {
                        color: {
                            value: "transparent",
                        },
                    },
                    fpsLimit: 60,
                    particles: {
                        color: {
                            value: "#C2C4CC",
                        },
                        // links: {
                        //     color: "#C2C4CC",
                        //     distance: 100,
                        //     enable: true,
                        //     opacity: 0.2,
                        //     width: 0.5,
                        // },
                        move: {
                            direction: "none",
                            enable: true,
                            outModes: {
                                default: "out",
                            },
                            random: true,
                            speed: 1,
                            straight: false,
                        },
                        number: {
                            density: {
                                enable: true,
                                height: 800,
                                width: 800
                            },
                            value: 30,
                        },
                        opacity: {
                            value: { min: 0.8, max: 1 },
                        },
                        shape: {
                            type: "circle",
                        },
                        size: {
                            value: { min: 0.5, max: 1 },
                        },
                    },
                    detectRetina: true,
                }}
                className="w-full h-full"
            />
        </div>
    );
}

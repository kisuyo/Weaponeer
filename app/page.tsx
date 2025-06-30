"use client";

import { useEffect, useState } from "react";
import { $openChest, $createTestPlayer } from "./actions/actions";
import { motion, useAnimate } from "framer-motion";
import Bottombar from "./components/Bottombar";
import Topbar from "./components/Topbar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Topbar />
      <div className="flex flex-col bg-yellow-500 h-full w-full items-center justify-center">
        <div className="relative w-full h-full">
          <motion.div
            animate={{
              scale: [0.8, 1],
              opacity: [0, 1],
            }}
            transition={{
              duration: 1,

              type: "spring",
            }}
            className="border-neutral-800/30 border-[20px] rounded-full w-[400px] h-[400px] flex items-center justify-center absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
          >
            <motion.div
              animate={{
                scale: [0.5, 1],
                opacity: [0, 1],
              }}
              transition={{
                duration: 1,
                delay: 0.2,
                type: "spring",
              }}
              className="bg-neutral-800/30  h-[90%] border-2 border-black w-[90%] rounded-full "
            ></motion.div>
            <motion.div
              animate={{
                scale: [0.5, 1],
                opacity: [0, 1],
              }}
              transition={{
                duration: 1,
                delay: 1,
                type: "spring",
              }}
              className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%]"
            >
              {/* <img
                src="/wooden_sword.png"
                alt="sword"
                className="w-full h-auto"
              /> */}
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Bottombar />
    </main>
  );
}

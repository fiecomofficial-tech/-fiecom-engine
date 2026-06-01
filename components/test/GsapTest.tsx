"use client";

import { useEffect } from "react";
import gsap from "gsap";

export default function GsapTest() {
  useEffect(() => {
    gsap.to(".box", {
      x: 300,
      duration: 2,
    });
  }, []);

  return (
    <div
      className="box"
      style={{
        width: 100,
        height: 100,
        background: "red",
      }}
    />
  );
}

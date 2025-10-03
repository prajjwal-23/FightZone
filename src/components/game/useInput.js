"use client";
import { useEffect, useRef } from "react";

export default function useInput() {
  const keysRef = useRef({});

  useEffect(() => {
    const down = (e) => (keysRef.current[e.key] = true);
    const up = (e) => (keysRef.current[e.key] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return keysRef; // usage: keys.current["a"] === true/false
}

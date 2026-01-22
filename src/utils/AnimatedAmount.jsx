import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

const AnimatedAmount = ({ value }) => {
  const motionValue = useMotionValue(0);

  const rounded = useTransform(motionValue, (latest) =>
    Math.floor(latest).toLocaleString("en-IN"),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: "easeOut",
    });

    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

export default AnimatedAmount;

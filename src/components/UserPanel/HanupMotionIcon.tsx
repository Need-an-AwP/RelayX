import { useState } from "react"
import { Phone } from "lucide-react"
import { motion } from "framer-motion"

interface PhoneIconProps {
  size?: number
}

export default function Component({ size = 24 }: PhoneIconProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          animate={isHovered ? { rotate: 135 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Phone className="text-red-500" size={size} />
        </motion.div>
      </motion.div>
    </div>
  )
}
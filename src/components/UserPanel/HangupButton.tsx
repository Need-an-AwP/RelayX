import { useState } from "react"
import { Phone } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface AnimatedHangupButtonProps {
  size?: number
  onClick?: () => void
}

export default function AnimatedHangupButton({ size = 16, onClick }: AnimatedHangupButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <motion.div
        animate={isHovered ? { rotate: 135 } : { rotate: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Phone className="text-red-500" size={size} />
      </motion.div>
    </Button>
  )
}
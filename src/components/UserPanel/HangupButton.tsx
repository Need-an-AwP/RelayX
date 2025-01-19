import { useState, forwardRef } from "react"
import { Phone } from "lucide-react"
import { motion } from "framer-motion"
import { Button, ButtonProps } from "@/components/ui/button"

interface HangupButtonProps extends ButtonProps {
  iconSize?: number
}

const HangupButton = forwardRef<HTMLButtonElement, HangupButtonProps>(
  ({ iconSize = 16, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <Button
        ref={ref}
        size="icon"
        variant="ghost"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative"
        {...props}
      >
        <motion.div
          animate={isHovered ? { rotate: 135 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Phone className="text-red-500" size={iconSize} />
        </motion.div>
      </Button>
    )
  }
)

HangupButton.displayName = "HangupButton"

export default HangupButton
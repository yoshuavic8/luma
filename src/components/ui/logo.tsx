"use client"

import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  variant?: "default" | "light" | "dark"
  size?: "sm" | "md" | "lg"
  href?: string
}

export function Logo({ variant = "default", size = "md", href = "/" }: LogoProps) {
  // Define size dimensions
  const dimensions = {
    sm: { width: 100, height: 40 },
    md: { width: 150, height: 60 },
    lg: { width: 200, height: 80 },
  }

  // Define image path based on variant
  const imagePath = 
    variant === "light" 
      ? "/assets/images/logo/luma-logo-light.png" 
      : variant === "dark" 
        ? "/assets/images/logo/luma-logo-dark.png" 
        : "/assets/images/logo/luma-logo.png"

  const { width, height } = dimensions[size]

  const logoImage = (
    <div className="relative" style={{ width, height }}>
      <Image
        src={imagePath}
        alt="Luma Logo"
        fill
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  )

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoImage}
      </Link>
    )
  }

  // Otherwise just return the image
  return logoImage
}

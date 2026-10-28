import { Droplets } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Droplets className="h-5 w-5" />
            <span className="font-semibold">AquaSense</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/cleaning-guide" className="hover:text-primary transition-colors">
              Water Cleaning
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">© 2025 AquaSense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

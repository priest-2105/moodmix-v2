"use client"

import { useState, useEffect, useRef, forwardRef } from "react"
import { SearchIcon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ onSearch, placeholder = "Search...", className = "" }, ref) => {
    const [query, setQuery] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)
    const debouncedQuery = useDebounce(query, 300)

    // Combine the forwarded ref with our local ref
    const combinedRef = (node: HTMLInputElement) => {
      // Update the local ref
      if (inputRef.current) {
        inputRef.current = node
      }

      // Update the forwarded ref
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    useEffect(() => {
      onSearch(debouncedQuery)
    }, [debouncedQuery, onSearch])

    const handleClear = () => {
      setQuery("")
      onSearch("")
      inputRef.current?.focus()
    }

    return (
      <div className={`relative ${className}`}>
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
        <Input
          ref={combinedRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 bg-white/10 border-white/10 text-white placeholder:text-white/50 focus-visible:ring-[#00FFFF] focus-visible:ring-offset-0 focus-visible:border-[#00FFFF]"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-white/50 hover:text-white"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  },
)

SearchBar.displayName = "SearchBar"

export default SearchBar


"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number] // [lng, lat]
  properties?: {
    category?: string
    maki?: string
  }
  text?: string
}

interface MapboxGeocodingAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: MapboxFeature) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
}

const MAPBOX_TOKEN = "pk.eyJ1IjoiZ29sZGVuYml1IiwiYSI6ImNtZ3h6MXcybDBhMnYyanBvdThpbzJtdzUifQ.P5vJLh6Gzx2A6y1YmeKCBw"

export function MapboxGeocodingAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Tìm kiếm địa điểm...",
  label,
  className = "",
  disabled = false
}: MapboxGeocodingAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<MapboxFeature | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const searchPlaces = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      // Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=vi&country=vn&limit=5`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch places')
      }

      const data = await response.json()

      if (data.features && Array.isArray(data.features)) {
        setSuggestions(data.features)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error searching places:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedPlace(null)

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(newValue)
    }, 300)
  }

  const handlePlaceSelect = (place: MapboxFeature) => {
    setSelectedPlace(place)
    onChange(place.place_name)
    setShowSuggestions(false)
    setSuggestions([])
    onPlaceSelect(place)
  }

  const handleClear = () => {
    onChange('')
    setSelectedPlace(null)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor="mapbox-input" className="text-sm font-medium text-foreground mb-2 block">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          id="mapbox-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-10"
          disabled={disabled}
        />
        
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((place, index) => (
              <button
                key={place.id || index}
                type="button"
                onClick={() => handlePlaceSelect(place)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {place.text || place.place_name.split(',')[0]}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {place.place_name}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPlace && (
        <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Đã chọn: {selectedPlace.text || selectedPlace.place_name.split(',')[0]}</span>
          </div>
        </div>
      )}
    </div>
  )
}







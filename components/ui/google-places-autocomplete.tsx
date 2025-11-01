// "use client"

// import React, { useState, useRef, useEffect } from 'react'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import { MapPin, Search, X } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'

// interface GooglePlace {
//   place_id: string
//   description: string
//   structured_formatting: {
//     main_text: string
//     secondary_text: string
//   }
//   geometry?: {
//     location: {
//       lat: number
//       lng: number
//     }
//   }
// }

// interface GooglePlacesAutocompleteProps {
//   value: string
//   onChange: (value: string) => void
//   onPlaceSelect: (place: GooglePlace) => void
//   placeholder?: string
//   label?: string
//   className?: string
//   disabled?: boolean
// }

// export function GooglePlacesAutocomplete({
//   value,
//   onChange,
//   onPlaceSelect,
//   placeholder = "Tìm kiếm địa điểm...",
//   label,
//   className = "",
//   disabled = false
// }: GooglePlacesAutocompleteProps) {
//   const [suggestions, setSuggestions] = useState<GooglePlace[]>([])
//   const [isLoading, setIsLoading] = useState(false)
//   const [showSuggestions, setShowSuggestions] = useState(false)
//   const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null)
//   const inputRef = useRef<HTMLInputElement>(null)
//   const timeoutRef = useRef<NodeJS.Timeout>()

//   // Google Places API key - nên lưu trong environment variables
//   const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''

//   const searchPlaces = async (query: string) => {
//     if (!query.trim() || query.length < 2) {
//       setSuggestions([])
//       return
//     }

//     if (!GOOGLE_PLACES_API_KEY) {
//       console.warn('Google Places API key not found. Please set NEXT_PUBLIC_GOOGLE_PLACES_API_KEY in your environment variables.')
//       return
//     }

//     setIsLoading(true)

//     try {
//       // Sử dụng Google Places API Text Search
//       const response = await fetch(
//         `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&language=vi&region=vn`
//       )

//       if (!response.ok) {
//         throw new Error('Failed to fetch places')
//       }

//       const data = await response.json()

//       if (data.status === 'OK') {
//         const places = data.results.map((place: any) => ({
//           place_id: place.place_id,
//           description: place.formatted_address,
//           structured_formatting: {
//             main_text: place.name,
//             secondary_text: place.formatted_address
//           },
//           geometry: place.geometry
//         }))
//         setSuggestions(places)
//       } else {
//         console.error('Google Places API error:', data.status)
//         setSuggestions([])
//       }
//     } catch (error) {
//       console.error('Error searching places:', error)
//       setSuggestions([])
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newValue = e.target.value
//     onChange(newValue)
//     setSelectedPlace(null)

//     // Clear previous timeout
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current)
//     }

//     // Debounce search
//     timeoutRef.current = setTimeout(() => {
//       searchPlaces(newValue)
//     }, 300)
//   }

//   const handlePlaceSelect = (place: GooglePlace) => {
//     setSelectedPlace(place)
//     onChange(place.description)
//     setShowSuggestions(false)
//     setSuggestions([])
//     onPlaceSelect(place)
//   }

//   const handleClear = () => {
//     onChange('')
//     setSelectedPlace(null)
//     setSuggestions([])
//     setShowSuggestions(false)
//     inputRef.current?.focus()
//   }

//   const handleFocus = () => {
//     if (suggestions.length > 0) {
//       setShowSuggestions(true)
//     }
//   }

//   const handleBlur = () => {
//     // Delay hiding suggestions to allow clicking on them
//     setTimeout(() => {
//       setShowSuggestions(false)
//     }, 200)
//   }

//   // Cleanup timeout on unmount
//   useEffect(() => {
//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//       }
//     }
//   }, [])

//   return (
//     <div className={`relative ${className}`}>
//       {label && (
//         <Label htmlFor="google-places-input" className="text-sm font-medium text-foreground mb-2 block">
//           {label}
//         </Label>
//       )}
      
//       <div className="relative">
//         <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none">
//           {isLoading ? (
//             <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
//           ) : (
//             <Search className="h-4 w-4" />
//           )}
//         </div>
        
//         <Input
//           ref={inputRef}
//           id="google-places-input"
//           type="text"
//           placeholder={placeholder}
//           value={value}
//           onChange={handleInputChange}
//           onFocus={handleFocus}
//           onBlur={handleBlur}
//           className="pl-10 pr-10"
//           disabled={disabled}
//         />
        
//         {value && !disabled && (
//           <button
//             type="button"
//             onClick={handleClear}
//             className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         )}
//       </div>

//       <AnimatePresence>
//         {showSuggestions && suggestions.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             transition={{ duration: 0.2 }}
//             className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
//           >
//             {suggestions.map((place, index) => (
//               <button
//                 key={place.place_id}
//                 type="button"
//                 onClick={() => handlePlaceSelect(place)}
//                 className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
//               >
//                 <div className="flex items-start gap-3">
//                   <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
//                   <div className="flex-1 min-w-0">
//                     <div className="font-medium text-foreground truncate">
//                       {place.structured_formatting.main_text}
//                     </div>
//                     <div className="text-sm text-muted-foreground truncate">
//                       {place.structured_formatting.secondary_text}
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {selectedPlace && (
//         <div className="mt-2 p-3 bg-muted/30 rounded-md border border-border">
//           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//             <MapPin className="h-4 w-4" />
//             <span>Đã chọn: {selectedPlace.structured_formatting.main_text}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }









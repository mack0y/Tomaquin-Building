import { Zap, Droplets } from 'lucide-react'

const UTILITY_TYPES = [
  { value: 'electric', label: 'Electric', icon: Zap, color: 'text-yellow-500' },
  { value: 'water', label: 'Water', icon: Droplets, color: 'text-blue-500' },
]

export { UTILITY_TYPES }

export default function UtilityTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-3">
      {UTILITY_TYPES.map((type) => {
        const Icon = type.icon
        return (
          <button
            key={type.value}
            onClick={() => onTabChange(type.value)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === type.value
                ? 'bg-primary text-white'
                : 'bg-surface-card border border-border text-text-secondary hover:bg-surface'
            }`}
          >
            <Icon className={`h-4 w-4 ${activeTab === type.value ? 'text-white' : type.color}`} />
            {type.label}
          </button>
        )
      })}
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Network,
  Users,
  Building,
  MapPin,
  Calendar,
  FileText,
  Lightbulb,
} from "lucide-react"
import type { MatterEntity, MatterRelationship } from "@/lib/cmf/cognitive-matter-fabric"

interface KnowledgeGraphViewerProps {
  matterId: string
  entities: MatterEntity[]
  relationships: MatterRelationship[]
  onEntitySelect?: (entity: MatterEntity) => void
  onQuerySubmit?: (query: string) => void
}

export function KnowledgeGraphViewer({
  matterId,
  entities,
  relationships,
  onEntitySelect,
  onQuerySubmit,
}: KnowledgeGraphViewerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEntity, setSelectedEntity] = useState<MatterEntity | null>(null)
  const [filteredEntities, setFilteredEntities] = useState<MatterEntity[]>(entities)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<{ start?: string; end?: string }>({})
  const graphRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFilteredEntities(entities)
  }, [entities])

  const entityTypes = [
    { type: "person", icon: Users, color: "bg-blue-500", label: "People" },
    { type: "organization", icon: Building, color: "bg-green-500", label: "Organizations" },
    { type: "location", icon: MapPin, color: "bg-red-500", label: "Locations" },
    { type: "event", icon: Calendar, color: "bg-purple-500", label: "Events" },
    { type: "document", icon: FileText, color: "bg-orange-500", label: "Documents" },
    { type: "concept", icon: Lightbulb, color: "bg-yellow-500", label: "Concepts" },
  ]

  const getEntityIcon = (type: string) => {
    const entityType = entityTypes.find((et) => et.type === type)
    return entityType?.icon || Network
  }

  const getEntityColor = (type: string) => {
    const entityType = entityTypes.find((et) => et.type === type)
    return entityType?.color || "bg-gray-500"
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const filtered = entities.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredEntities(filtered)

      if (onQuerySubmit) {
        onQuerySubmit(searchQuery)
      }
    } else {
      setFilteredEntities(entities)
    }
  }

  const handleFilterToggle = (entityType: string) => {
    const newFilters = activeFilters.includes(entityType)
      ? activeFilters.filter((f) => f !== entityType)
      : [...activeFilters, entityType]

    setActiveFilters(newFilters)

    if (newFilters.length === 0) {
      setFilteredEntities(entities)
    } else {
      setFilteredEntities(entities.filter((entity) => newFilters.includes(entity.entityType)))
    }
  }

  const handleEntityClick = (entity: MatterEntity) => {
    setSelectedEntity(entity)
    if (onEntitySelect) {
      onEntitySelect(entity)
    }
  }

  const getRelatedEntities = (entityId: string) => {
    const related = relationships
      .filter((rel) => rel.sourceEntityId === entityId || rel.targetEntityId === entityId)
      .map((rel) => {
        const relatedId = rel.sourceEntityId === entityId ? rel.targetEntityId : rel.sourceEntityId
        return entities.find((e) => e.id === relatedId)
      })
      .filter(Boolean) as MatterEntity[]

    return related
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Query the knowledge graph (e.g., 'Show all communications between John and Acme Corp')"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Entity Type Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {entityTypes.map((entityType) => {
              const Icon = entityType.icon
              const count = entities.filter((e) => e.entityType === entityType.type).length
              const isActive = activeFilters.includes(entityType.type)

              return (
                <Button
                  key={entityType.type}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterToggle(entityType.type)}
                  className={isActive ? entityType.color : ""}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {entityType.label} ({count})
                </Button>
              )
            })}
          </div>

          {/* Graph Controls */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Temporal Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graph Visualization */}
        <div className="lg:col-span-2">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                Knowledge Graph ({filteredEntities.length} entities, {relationships.length} relationships)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-6">
              <div
                ref={graphRef}
                className="h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg relative overflow-hidden"
              >
                {/* Simulated Graph Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Interactive Knowledge Graph</h3>
                    <p className="text-gray-600 max-w-md">
                      This would display an interactive D3.js or similar visualization showing entities as nodes and
                      relationships as edges, with dynamic filtering and querying capabilities.
                    </p>
                  </div>
                </div>

                {/* Entity Nodes (Simulated) */}
                <div className="absolute top-20 left-20">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    JD
                  </div>
                  <div className="text-xs mt-1 text-center">John Doe</div>
                </div>

                <div className="absolute top-40 right-32">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    AC
                  </div>
                  <div className="text-xs mt-1 text-center">Acme Corp</div>
                </div>

                <div className="absolute bottom-32 left-32">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    CT
                  </div>
                  <div className="text-xs mt-1 text-center">Contract</div>
                </div>

                {/* Connection Lines (Simulated) */}
                <svg className="absolute inset-0 pointer-events-none">
                  <line x1="80" y1="80" x2="300" y2="200" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="80" y1="80" x2="150" y2="400" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="300" y1="200" x2="150" y2="400" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entity Details and List */}
        <div className="space-y-6">
          {/* Selected Entity Details */}
          {selectedEntity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {(() => {
                    const Icon = getEntityIcon(selectedEntity.entityType)
                    return <Icon className="h-5 w-5 mr-2" />
                  })()}
                  Entity Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{selectedEntity.name}</h3>
                    <Badge className={getEntityColor(selectedEntity.entityType)}>{selectedEntity.entityType}</Badge>
                  </div>

                  {selectedEntity.description && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Description</h4>
                      <p className="text-sm text-gray-600">{selectedEntity.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Importance</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${selectedEntity.importance * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{Math.round(selectedEntity.importance * 100)}%</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Properties</h4>
                    <div className="space-y-1">
                      {Object.entries(selectedEntity.properties || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700">Connected Entities</h4>
                    <div className="space-y-2 mt-2">
                      {getRelatedEntities(selectedEntity.id)
                        .slice(0, 5)
                        .map((entity) => {
                          const Icon = getEntityIcon(entity.entityType)
                          return (
                            <div
                              key={entity.id}
                              className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                              onClick={() => handleEntityClick(entity)}
                            >
                              <Icon className="h-4 w-4 text-gray-600" />
                              <span className="text-sm">{entity.name}</span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entity List */}
          <Card>
            <CardHeader>
              <CardTitle>Entities ({filteredEntities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEntities
                  .sort((a, b) => b.importance - a.importance)
                  .map((entity) => {
                    const Icon = getEntityIcon(entity.entityType)
                    return (
                      <div
                        key={entity.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedEntity?.id === entity.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleEntityClick(entity)}
                      >
                        <div
                          className={`w-8 h-8 ${getEntityColor(entity.entityType)} rounded-full flex items-center justify-center`}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{entity.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {entity.description || entity.entityType}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">{Math.round(entity.importance * 100)}%</div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

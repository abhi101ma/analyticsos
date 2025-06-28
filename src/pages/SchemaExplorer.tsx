import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database, Table, Key, Link } from 'lucide-react'
import axios from 'axios'

interface Table {
  name: string
  columns: Column[]
  relationships: Relationship[]
}

interface Column {
  name: string
  type: string
  nullable: boolean
  primary_key: boolean
  foreign_key: boolean
}

interface Relationship {
  from_table: string
  from_column: string
  to_table: string
  to_column: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

const SchemaExplorer: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<string>('')

  const { data: datasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const response = await axios.get('/api/datasets')
      return response.data
    }
  })

  const { data: schema, isLoading } = useQuery({
    queryKey: ['schema', selectedDataset],
    queryFn: async () => {
      if (!selectedDataset) return null
      const response = await axios.get(`/api/datasets/${selectedDataset}/schema`)
      return response.data
    },
    enabled: !!selectedDataset
  })

  const getColumnIcon = (column: Column) => {
    if (column.primary_key) {
      return <Key className="h-4 w-4 text-yellow-500" />
    }
    if (column.foreign_key) {
      return <Link className="h-4 w-4 text-blue-500" />
    }
    return <div className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    if (type.includes('int') || type.includes('number')) return 'text-blue-600'
    if (type.includes('varchar') || type.includes('text') || type.includes('string')) return 'text-green-600'
    if (type.includes('date') || type.includes('time')) return 'text-purple-600'
    if (type.includes('bool')) return 'text-orange-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schema Explorer</h1>
        <div className="flex gap-4">
          <select
            value={selectedDataset}
            onChange={(e) => {
              setSelectedDataset(e.target.value)
              setSelectedTable('')
            }}
            className="input w-48"
          >
            <option value="">Select Dataset</option>
            {datasets?.map((dataset: any) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedDataset && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables List */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tables
            </h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {schema?.tables?.map((table: Table) => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedTable === table.name
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <Table className="h-4 w-4" />
                    <span className="font-medium">{table.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {table.columns.length} cols
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table Details */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <div className="space-y-6">
                {/* Columns */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Columns - {selectedTable}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Column</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Type</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Nullable</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Key</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schema?.tables
                          ?.find((t: Table) => t.name === selectedTable)
                          ?.columns.map((column: Column) => (
                            <tr key={column.name} className="border-b border-gray-100">
                              <td className="py-2 px-3 flex items-center gap-2">
                                {getColumnIcon(column)}
                                <span className="font-medium">{column.name}</span>
                              </td>
                              <td className={`py-2 px-3 text-sm font-mono ${getTypeColor(column.type)}`}>
                                {column.type}
                              </td>
                              <td className="py-2 px-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  column.nullable 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {column.nullable ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-sm">
                                {column.primary_key && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs mr-1">
                                    PK
                                  </span>
                                )}
                                {column.foreign_key && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    FK
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Relationships */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Relationships</h3>
                  <div className="space-y-3">
                    {schema?.tables
                      ?.find((t: Table) => t.name === selectedTable)
                      ?.relationships?.map((rel: Relationship, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rel.from_table}</span>
                            <span className="text-gray-500">({rel.from_column})</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="h-px bg-gray-300 w-8"></div>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {rel.type}
                            </span>
                            <div className="h-px bg-gray-300 w-8"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rel.to_table}</span>
                            <span className="text-gray-500">({rel.to_column})</span>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">
                          No relationships found for this table
                        </p>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="text-center py-12">
                  <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Table</h3>
                  <p className="text-gray-500">
                    Choose a table from the list to view its schema details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedDataset && (
        <div className="card">
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dataset Selected</h3>
            <p className="text-gray-500">
              Select a dataset from the dropdown to explore its schema
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchemaExplorer
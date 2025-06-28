import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Plus, Settings, Trash2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

interface Dataset {
  id: string
  name: string
  type: 'postgresql' | 'mysql'
  host: string
  port: number
  database: string
  status: 'connected' | 'disconnected' | 'error'
  created_at: string
  tables_count: number
}

const Datasets: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgresql' as 'postgresql' | 'mysql',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: ''
  })

  const queryClient = useQueryClient()

  const { data: datasets, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: async () => {
      const response = await axios.get('/api/datasets')
      return response.data
    }
  })

  const addDatasetMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/datasets', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      setShowAddForm(false)
      setFormData({
        name: '',
        type: 'postgresql',
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: ''
      })
    }
  })

  const deleteDatasetMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/datasets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    }
  })

  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.post(`/api/datasets/${id}/test`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addDatasetMutation.mutate(formData)
  }

  const getStatusIcon = (status: Dataset['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-400" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = (status: Dataset['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Dataset
        </button>
      </div>

      {/* Add Dataset Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Dataset</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'postgresql' | 'mysql' })}
                  className="input"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addDatasetMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {addDatasetMutation.isPending ? 'Adding...' : 'Add Dataset'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Datasets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))
        ) : (
          datasets?.map((dataset: Dataset) => (
            <div key={dataset.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-primary-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                    <p className="text-sm text-gray-500">{dataset.type.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(dataset.status)}
                  <span className="text-sm text-gray-600">{getStatusText(dataset.status)}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-medium">Host:</span> {dataset.host}:{dataset.port}</p>
                <p><span className="font-medium">Database:</span> {dataset.database}</p>
                <p><span className="font-medium">Tables:</span> {dataset.tables_count}</p>
                <p><span className="font-medium">Added:</span> {new Date(dataset.created_at).toLocaleDateString()}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => testConnectionMutation.mutate(dataset.id)}
                  disabled={testConnectionMutation.isPending}
                  className="flex-1 btn-secondary text-sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Test
                </button>
                <button
                  onClick={() => deleteDatasetMutation.mutate(dataset.id)}
                  disabled={deleteDatasetMutation.isPending}
                  className="btn-secondary text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Datasets
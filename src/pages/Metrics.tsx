import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Target, Plus, Edit, Trash2, Play, History } from 'lucide-react'
import axios from 'axios'

interface Metric {
  id: string
  name: string
  description: string
  sql_query: string
  category: string
  version: number
  created_at: string
  last_run: string | null
  status: 'active' | 'draft' | 'archived'
}

const Metrics: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sql_query: '',
    category: 'revenue'
  })

  const queryClient = useQueryClient()

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await axios.get('/api/metrics')
      return response.data
    }
  })

  const addMetricMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.post('/api/metrics', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      setShowAddForm(false)
      resetForm()
    }
  })

  const updateMetricMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await axios.put(`/api/metrics/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      setEditingMetric(null)
      resetForm()
    }
  })

  const deleteMetricMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/metrics/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    }
  })

  const runMetricMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.post(`/api/metrics/${id}/run`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sql_query: '',
      category: 'revenue'
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMetric) {
      updateMetricMutation.mutate({ id: editingMetric.id, data: formData })
    } else {
      addMetricMutation.mutate(formData)
    }
  }

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric)
    setFormData({
      name: metric.name,
      description: metric.description,
      sql_query: metric.sql_query,
      category: metric.category
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingMetric(null)
    resetForm()
  }

  const categories = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'orders', label: 'Orders' },
    { value: 'customers', label: 'Customers' },
    { value: 'products', label: 'Products' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' }
  ]

  const getStatusColor = (status: Metric['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Business Metrics</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Metric
        </button>
      </div>

      {/* Add/Edit Metric Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingMetric ? 'Edit Metric' : 'Add New Metric'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Average Order Value"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Describe what this metric measures..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SQL Query
              </label>
              <textarea
                value={formData.sql_query}
                onChange={(e) => setFormData({ ...formData, sql_query: e.target.value })}
                className="input font-mono text-sm"
                rows={8}
                placeholder="SELECT AVG(total_amount) as avg_order_value FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addMetricMutation.isPending || updateMetricMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {editingMetric ? 'Update Metric' : 'Add Metric'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metrics List */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded w-full"></div>
            </div>
          ))
        ) : (
          metrics?.map((metric: Metric) => (
            <div key={metric.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-primary-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    <p className="text-sm text-gray-500">{metric.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                  <span className="text-xs text-gray-500">v{metric.version}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {metric.sql_query}
                </pre>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-4">
                  <span><span className="font-medium">Category:</span> {metric.category}</span>
                  <span><span className="font-medium">Created:</span> {new Date(metric.created_at).toLocaleDateString()}</span>
                  {metric.last_run && (
                    <span><span className="font-medium">Last run:</span> {new Date(metric.last_run).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => runMetricMutation.mutate(metric.id)}
                  disabled={runMetricMutation.isPending}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Play className="h-4 w-4" />
                  Run
                </button>
                <button
                  onClick={() => handleEdit(metric)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button className="btn-secondary text-sm flex items-center gap-1">
                  <History className="h-4 w-4" />
                  History
                </button>
                <button
                  onClick={() => deleteMetricMutation.mutate(metric.id)}
                  disabled={deleteMetricMutation.isPending}
                  className="btn-secondary text-red-600 hover:bg-red-50 text-sm"
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

export default Metrics
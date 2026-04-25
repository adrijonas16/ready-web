'use client';

import { useState, useEffect } from 'react';
import { listsApi, ordersApi } from '@/services/api';
import { SupplyList, Order } from '@/lib/types';
import { List, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [lists, setLists] = useState<SupplyList[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inReview: 0,
    approved: 0,
    totalOrders: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allLists = await listsApi.getAll();
      setLists(allLists);
      
      setStats({
        pending: allLists.filter(l => l.estado === 'PENDIENTE_REVISION').length,
        inReview: allLists.filter(l => l.estado === 'EN_REVISION').length,
        approved: allLists.filter(l => l.estado === 'VALIDADA' || l.estado === 'PROCESADA').length,
        totalOrders: 0
      });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <List className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inReview}</p>
              <p className="text-sm text-gray-500">En revisión</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-500">Validadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-500">Pedidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lists */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Listas recientes</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {lists.slice(0, 5).map(list => (
            <div key={list.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{list.schoolName} - {list.gradeName}</p>
                <p className="text-sm text-gray-500">{list.year}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                list.estado === 'PENDIENTE_REVISION' ? 'bg-yellow-100 text-yellow-800' :
                list.estado === 'EN_REVISION' ? 'bg-blue-100 text-blue-800' :
                list.estado === 'OBSERVADA' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                {list.estado.replace('_', ' ')}
              </span>
            </div>
          ))}
          {lists.length === 0 && (
            <p className="p-6 text-center text-gray-500">No hay listas</p>
          )}
        </div>
      </div>
    </div>
  );
}
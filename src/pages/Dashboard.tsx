import React, { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiRefreshCw, FiShoppingCart, FiDollarSign, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


type Sale = {
  id: number;
  product_id: number;
  quantity: number;
  sale_date: string;
  sale_value_brl: number;
  sale_value_usd: number;
  owner: string;
  product_name?: string;
  seller_name?: string;
};

type CategoryData = {
  name: string;
  revenue: number;
  color?: string;
};

type ProductData = {
  name: string;
  sales: number;
  revenue: number;
};

type SaleTrendData = {
  date: string;
  total: number;
};

const Dashboard = () => {
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);
  const [salesTrend, setSalesTrend] = useState<SaleTrendData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const ws = useRef<WebSocket | null>(null);

  const fetchData = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/';
      return;
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }
    };

    const [historyRes, categoryRes, productsRes, trendRes] = await Promise.all([
      fetch('http://localhost:8000/sales-history/', config),
      fetch('http://localhost:8000/sales-by-category/', config),
      fetch('http://localhost:8000/top-products/', config),
      fetch('http://localhost:8000/sales-trend/', config)
    ]);

    const historyData = await historyRes.json();
    const categoryData = await categoryRes.json();
    const productsData = await productsRes.json();
    const trendData = await trendRes.json();

    // Atualiza os estados de uma só vez para evitar renderizações múltiplas
    setSalesHistory(prev => [...historyData.slice(0, 4)]);
    setSalesByCategory(processCategoryData(categoryData));
    setTopProducts(prev => [...productsData.slice(0, 10)]);
    setSalesTrend(prev => [...trendData]);
    
    const totalQty = productsData.reduce((acc: number, product: ProductData) => acc + (product.sales || 0), 0);
    setTotalQuantity(totalQty);
    
    const totalRev = categoryData.reduce((acc: number, cat: CategoryData) => acc + (cat.revenue || 0), 0);
    setTotalSales(totalRev);
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  } finally {
    setIsLoading(false);
  }
};

  const processCategoryData = (categories: CategoryData[]) => {
    if (!categories || categories.length === 0) return [];
    
    if (categories.length <= 3) {
      const total = categories.reduce((acc, cat) => acc + (cat.revenue || 0), 0);
      setTotalSales(total);
      return categories;
    }

    const sorted = [...categories].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    const top3 = sorted.slice(0, 3);
    const others = sorted.slice(3);
    
    const othersSum = others.reduce((acc, cat) => acc + (cat.revenue || 0), 0);
    
    const result = [
      ...top3,
      {
        name: 'Outros',
        revenue: othersSum,
        color: '#6b7280'
      }
    ];

    setTotalSales(sorted.reduce((acc, cat) => acc + (cat.revenue || 0), 0));

    return result;
  };

const [notifications, setNotifications] = useState<Array<{message: string, timestamp: Date}>>([]);

const setupWebSocket = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.error('Nenhum token encontrado');
    return;
  }

  if (ws.current) {
    ws.current.close();
  }

  ws.current = new WebSocket(`ws://localhost:8000/dashboard-ws/?token=${token}`);

  ws.current.onopen = () => {
    console.log('WebSocket conectado');
    setSocketStatus('connected');
  };

  ws.current.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log('Nova mensagem recebida:', data);
      
      if (data.type === 'new_sale') {
        const message = `Nova venda: ${data.data.product_description} (${data.data.quantity} un.) - R$ ${data.data.value.toFixed(2)}`;
        
        // Adiciona notificação
        setNotifications(prev => [
          { message, timestamp: new Date() },
          ...prev.slice(0, 4) // Mantém apenas as 5 mais recentes
        ]);
        
        showNotification(message);
        fetchData(); // Atualiza os dados quando uma nova venda é recebida
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  };

  ws.current.onclose = (e) => {
    console.log('WebSocket desconectado:', e.code, e.reason);
    setSocketStatus('disconnected');
    
    if (e.code !== 1008) {
      setTimeout(setupWebSocket, 5000);
    } else {
      console.error('Token inválido - redirecionando para login');
      window.location.href = '/login';
    }
  };

  ws.current.onerror = (error) => {
    console.error('WebSocket error:', error);
    setSocketStatus('error');
  };
};

  const showNotification = (message: string) => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Nova Venda', { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Nova Venda', { body: message });
        }
      });
    }
  };

useEffect(() => {
  setupWebSocket();

  if ('Notification' in window) {
    Notification.requestPermission();
  }

  return () => {
    if (ws.current) {
      ws.current.close();
    }
  };
}, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return {
        date: format(date, 'dd/MM/yyyy', { locale: ptBR }),
        time: format(date, 'HH:mm', { locale: ptBR }),
        fullDate: format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
      };
    } catch {
      return {
        date: '--/--/----',
        time: '--:--',
        fullDate: 'Data inválida'
      };
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6'];

  const generateExcelReport = () => {
  const wb = XLSX.utils.book_new();

  // Últimas Vendas
  const historySheet = XLSX.utils.json_to_sheet(
    salesHistory.map(sale => ({
      'Data': formatDate(sale.sale_date).date,
      'Hora': formatDate(sale.sale_date).time,
      'Produto': sale.product_name || `ID: ${sale.product_id}`,
      'Vendedor': sale.seller_name || 'user@example.com',
      'Quantidade': sale.quantity,
      'Valor (R$)': sale.sale_value_brl?.toFixed(2) || '0.00'
    }))
  );
  XLSX.utils.book_append_sheet(wb, historySheet, 'Últimas Vendas');

  // Vendas por Categoria
  const categorySheet = XLSX.utils.json_to_sheet(
    salesByCategory.map(cat => ({
      'Categoria': cat.name,
      'Faturamento (R$)': cat.revenue?.toFixed(2) || '0.00'
    }))
  );
  XLSX.utils.book_append_sheet(wb, categorySheet, 'Vendas por Categoria');

  // Top Produtos
  const productSheet = XLSX.utils.json_to_sheet(
    topProducts.map(prod => ({
      'Produto': prod.name,
      'Quantidade Vendida': prod.sales,
      'Faturamento (R$)': prod.revenue?.toFixed(2) || '0.00'
    }))
  );
  XLSX.utils.book_append_sheet(wb, productSheet, 'Top Produtos');

  // Tendência de Vendas
  const trendSheet = XLSX.utils.json_to_sheet(
    salesTrend.map(trend => ({
      'Data': format(new Date(trend.date), 'dd/MM/yyyy'),
      'Total Vendido (R$)': trend.total.toFixed(2)
    }))
  );
  XLSX.utils.book_append_sheet(wb, trendSheet, 'Tendência');

  // Salvar o arquivo
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `relatorio_dashboard_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};


  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cabeçalho e filtros */}
      {/* Notificações em tempo real */}
<div className="col-span-1 lg:col-span-2 bg-[#2c2c2c] rounded-xl shadow-lg p-4">
  <div className="flex justify-between items-center mb-2">
    <h2 className="text-xl font-semibold">Notificações em Tempo Real</h2>
    <span className="text-sm text-gray-400">
      {socketStatus === 'connected' ? 'Conectado' : 'Desconectado'}
    </span>
  </div>
  <button
  onClick={generateExcelReport}
  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white flex items-center gap-2"
>
  📄 Gerar Relatório
</button>
  <div className="space-y-2 max-h-40 overflow-y-auto">
    {notifications.length > 0 ? (
      notifications.map((note, idx) => (
        <div key={idx} className="p-3 bg-gray-800 rounded-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <p className="text-sm">{note.message}</p>
            <span className="text-xs text-gray-400 ml-2">
              {format(note.timestamp, 'HH:mm:ss')}
            </span>
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-400 text-center py-2">
        Nenhuma notificação recente
      </p>
    )}
  </div>
</div>
      <div className="col-span-1 lg:col-span-2 bg-[#2c2c2c] rounded-xl shadow-lg p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
            <p className="text-gray-400 flex items-center gap-2">
              {socketStatus === 'connected' ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Conectado em tempo real
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  {socketStatus === 'connecting' ? 'Conectando...' : 'Atualização manual'}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-gray-300">De:</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="bg-gray-700 rounded px-3 py-1 text-white"
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-300">Até:</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="bg-gray-700 rounded px-3 py-1 text-white"
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
              />
            </div>
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="ml-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiRefreshCw />
              )}
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#2c2c2c] rounded-xl shadow-lg p-6 flex items-center">
          <div className="bg-blue-600/20 p-4 rounded-full mr-4">
            <FiShoppingCart className="text-blue-400 text-2xl" />
          </div>
          <div>
            <p className="text-gray-400">Total de Vendas</p>
            <p className="text-2xl font-bold">{totalQuantity}</p>
            <p className="text-sm text-gray-400">no período</p>
          </div>
        </div>
        
        <div className="bg-[#2c2c2c] rounded-xl shadow-lg p-6 flex items-center">
          <div className="bg-green-600/20 p-4 rounded-full mr-4">
            <FiDollarSign className="text-green-400 text-2xl" />
          </div>
          <div>
            <p className="text-gray-400">Faturamento</p>
            <p className="text-2xl font-bold">R$ {totalSales.toFixed(2)}</p>
            <p className="text-sm text-gray-400">no período</p>
          </div>
        </div>
        
        <div className="bg-[#2c2c2c] rounded-xl shadow-lg p-6 flex items-center">
          <div className="bg-purple-600/20 p-4 rounded-full mr-4">
            <FiTrendingUp className="text-purple-400 text-2xl" />
          </div>
          <div>
            <p className="text-gray-400">Ticket Médio</p>
            <p className="text-2xl font-bold">
              {totalQuantity > 0 ? `R$ ${(totalSales / totalQuantity).toFixed(2)}` : 'R$ 0,00'}
            </p>
            <p className="text-sm text-gray-400">por venda</p>
          </div>
        </div>
      </div>

      {/* Gráfico de tendência de vendas */}
      <div className="col-span-1 lg:col-span-2 bg-[#2c2c2c] rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tendência de Vendas</h2>
          <span className="text-sm text-gray-400">
            {startDate ? format(startDate, 'dd/MM/yy') : ''} - {endDate ? format(endDate, 'dd/MM/yy') : ''}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesTrend}>
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#fff' }}
              tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: ptBR })}
            />
            <YAxis tick={{ fill: '#fff' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#333', border: 'none' }}
              labelFormatter={(date) => format(new Date(date), 'PPP', { locale: ptBR })}
              formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Valor']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              name="Vendas Diárias" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Histórico de Vendas (4 últimas) */}
      <div className="bg-[#2c2c2c] rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Últimas Vendas</h2>
          <span className="text-sm text-gray-400">Mostrando 4 mais recentes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="p-2 text-left">Data/Hora</th>
                <th className="p-2 text-left">Vendedor</th>
                <th className="p-2 text-left">Produto</th>
                <th className="p-2 text-right">Quantidade</th>
                <th className="p-2 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.length > 0 ? (
                salesHistory.map((sale, idx) => {
                  const { fullDate } = formatDate(sale.sale_date);
                  return (
                    <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="p-2 text-left" title={fullDate}>
                        <div className="flex flex-col">
                          <span>{formatDate(sale.sale_date).date}</span>
                          <span className="text-xs text-gray-400">{formatDate(sale.sale_date).time}</span>
                        </div>
                      </td>
                      <td className="p-2 text-left">{sale.seller_name ||  'User@example.com'}</td>
                      <td className="p-2 text-left">{sale.product_name || `ID: ${sale.product_id}`}</td>
                      <td className="p-2 text-right">{sale.quantity}</td>
                      <td className="p-2 text-right font-medium text-green-400">
                        {sale.sale_value_brl?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-400">
                    {isLoading ? 'Carregando...' : 'Nenhuma venda encontrada no período'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendas por Categorias */}
      <div className="bg-[#2c2c2c] rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vendas por Categoria</h2>
          <span className="text-sm text-gray-400">
            {startDate ? format(startDate, 'dd/MM/yy') : ''} - {endDate ? format(endDate, 'dd/MM/yy') : ''}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={salesByCategory} 
                dataKey="revenue" 
                nameKey="name"
                innerRadius={60} 
                outerRadius={90}
                paddingAngle={2}
                label={({ name, percent }) => percent > 0.03 ? `${name} ${(percent * 100).toFixed(0)}%` : null}
                labelLine={false}
              >
                {salesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                contentStyle={{ backgroundColor: '#333', border: 'none' }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                height={36}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 text-lg">
            Total no período: <span className="font-bold">R$ {totalSales.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Produtos mais Vendidos (Top 10) */}
      <div className="col-span-1 lg:col-span-2 bg-[#2c2c2c] rounded-xl shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Top 10 Produtos Mais Vendidos</h2>
          <span className="text-sm text-gray-400">
            Período: {startDate ? format(startDate, 'dd/MM/yy') : ''} - {endDate ? format(endDate, 'dd/MM/yy') : ''}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={topProducts} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            layout="vertical"
          >
            <XAxis 
              type="number"
              tick={{ fill: '#fff' }} 
              label={{ 
                value: 'Quantidade Vendida', 
                position: 'insideBottom',
                offset: -5,
                fill: '#fff'
              }}
            />
            <YAxis 
              dataKey="name" 
              type="category"
              width={120}
              tick={{ fill: '#fff', fontSize: 12 }} 
              interval={0}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#333', border: 'none' }}
              formatter={(value, name, props) => [
                `${value} vendas (R$ ${props.payload.revenue?.toFixed(2) || '0.00'})`, 
                'Quantidade'
              ]}
              labelFormatter={(label) => `Produto: ${label}`}
            />
            <Bar 
              dataKey="sales" 
              name="Vendas"
              fill="#3b82f6" 
              radius={[0, 10, 10, 0]} 
              animationDuration={1500}
            >
              {topProducts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
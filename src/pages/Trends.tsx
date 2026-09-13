import { useEffect, useState, useMemo } from 'react';
import { localDb } from '../utils/localDb';
import { useAuth } from '../contexts/AuthContext';
import type { HealthParameter } from '../types';
import { format } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea 
} from 'recharts';
import { TrendingUp, Activity, AlertCircle, Loader2 } from 'lucide-react';

const Trends = () => {
  const { currentUser } = useAuth();
  const [parameters, setParameters] = useState<HealthParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

  useEffect(() => {
    const fetchParameters = async () => {
      if (!currentUser) return;
      
      try {
        const params = await localDb.getHealthParameters(currentUser.uid);
        setParameters(params);
      } catch (error) {
        console.error("Error fetching parameters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParameters();
  }, [currentUser]);

  // Filter data based on selected time range
  const filteredParameters = useMemo(() => {
    if (timeRange === 'ALL') return parameters;
    
    const now = Date.now();
    const timeRanges = {
      '1M': 30 * 24 * 60 * 60 * 1000,
      '3M': 90 * 24 * 60 * 60 * 1000,
      '6M': 180 * 24 * 60 * 60 * 1000,
      '1Y': 365 * 24 * 60 * 60 * 1000,
    };
    
    const cutoff = now - timeRanges[timeRange];
    return parameters.filter(p => p.testDate >= cutoff);
  }, [parameters, timeRange]);

  // Group data by parameter name and format for Recharts
  const chartData = useMemo(() => {
    const data: Record<string, any[]> = {
      'Hemoglobin': [],
      'Blood Glucose': [],
      'Total Cholesterol': []
    };

    filteredParameters.forEach(param => {
      if (data[param.parameterName] !== undefined && param.numericValue !== undefined) {
        data[param.parameterName].push({
          date: format(param.testDate, 'MMM d, yy'),
          timestamp: param.testDate,
          value: param.numericValue,
          unit: param.unit,
          refMin: param.referenceMin,
          refMax: param.referenceMax,
          status: param.status
        });
      }
    });

    return data;
  }, [filteredParameters]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
          <p className="font-semibold text-slate-700 mb-1">{label}</p>
          <p className="text-primary font-bold text-lg">
            {data.value} <span className="text-sm font-normal text-slate-500">{data.unit}</span>
          </p>
          {(data.refMin !== undefined || data.refMax !== undefined) && (
            <p className="text-xs text-slate-500 mt-1">
              Ref: {data.refMin} - {data.refMax}
            </p>
          )}
          <div className="mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
              data.status === 'HIGH' ? 'bg-red-50 text-red-700' :
              data.status === 'LOW' ? 'bg-orange-50 text-orange-700' :
              'bg-green-50 text-green-700'
            }`}>
              {data.status}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (title: string, dataKey: string, color: string, refColor: string) => {
    const data = chartData[dataKey];
    
    if (data.length === 0) {
      return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center h-[400px]">
          <Activity className="w-12 h-12 text-slate-200 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-slate-500 text-sm mt-2 text-center max-w-xs">
            Not enough data yet. Upload more reports to see your trend.
          </p>
        </div>
      );
    }

    const refMin = data[0]?.refMin;
    const refMax = data[0]?.refMax;
    const unit = data[0]?.unit;

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">Historical trend {unit ? `in ${unit}` : ''}</p>
          </div>
          
          {/* Latest Value Indicator */}
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Latest</p>
            <div className="flex items-baseline justify-end">
              <span className="text-2xl font-bold text-slate-900 mr-1">{data[data.length - 1].value}</span>
              <span className="text-sm text-slate-500">{unit}</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {refMin !== undefined && refMax !== undefined && (
                <ReferenceArea y1={refMin} y2={refMax} fill={refColor} fillOpacity={0.15} strokeOpacity={0} />
              )}
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {refMin !== undefined && refMax !== undefined && (
          <div className="mt-4 flex items-center justify-center text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: refColor, opacity: 0.2 }}></span>
            Normal reference range ({refMin} - {refMax} {unit})
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-primary" />
            Health Trends
          </h1>
          <p className="text-slate-500 mt-1">Visualize your health parameter changes over time.</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
          {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-slate-500">Loading your health trends...</p>
        </div>
      ) : parameters.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Health Data Available</h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto mb-8">
            We haven't extracted any health parameters from your documents yet. Upload medical reports like Blood Tests to see your trends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Chart 1: Hemoglobin */}
          {renderChart('Hemoglobin Trend', 'Hemoglobin', '#ef4444', '#fecaca')}
          
          {/* Chart 2: Blood Glucose */}
          {renderChart('Blood Glucose Trend', 'Blood Glucose', '#3b82f6', '#bfdbfe')}
          
          {/* Chart 3: Total Cholesterol */}
          {renderChart('Total Cholesterol Trend', 'Total Cholesterol', '#8b5cf6', '#ddd6fe')}
        </div>
      )}
    </div>
  );
};

export default Trends;

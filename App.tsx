import React, { useState, useMemo, useRef } from 'react';
import { Upload, FileText, BarChart2, PieChart, Filter, Download, Users, DollarSign, Leaf, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff, Database } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// --- CORES E ESTILOS ---
const COLORS: any = {
  organic: '#10B981', // Verde
  paid: '#3B82F6',    // Azul
  direct: '#8B5CF6',  // Roxo
  referral: '#F59E0B', // Laranja
  unknown: '#9CA3AF'  // Cinza
};

// --- COMPONENTES ---
interface StatCardProps {
  title: string;
  value: number;
  total: number;
  icon: any;
  colorClass: string;
  subText?: string;
}

const StatCard = ({ title, value, total, icon: Icon, colorClass, subText }: StatCardProps) => {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <div className="flex items-center mt-2 gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 ${colorClass}`}>
            {percentage}%
          </span>
        </div>
        {subText && <p className="text-xs text-slate-400 mt-2">{subText}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-slate-50 ${colorClass.replace('text-', 'text-opacity-80 text-')}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

// --- PARSER DE CSV OTIMIZADO ---
const robustCSVParser = (text: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  // Remove BOM e normaliza quebras de linha
  const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === ',' || char === ';') && !insideQuotes) {
      // Aceita vírgula ou ponto e vírgula como separador
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentField.trim());
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
};

// --- APP PRINCIPAL ---
export default function LeadAnalyticsApp() {
  const [leads, setLeads] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setIsProcessing(true);
    setLeads([]); // Limpa leads anteriores
    setDebugData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        processCSVData(e.target?.result as string);
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro crítico ao ler o arquivo.');
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const processCSVData = (csvText: string) => {
    const allRows = robustCSVParser(csvText);

    if (allRows.length < 2) {
      setErrorMsg("O arquivo parece vazio ou com formato inválido.");
      setIsProcessing(false);
      return;
    }

    // --- ESTRATÉGIA DE DETECÇÃO DE CABEÇALHO POR PONTUAÇÃO ---
    let bestHeaderIndex = -1;
    let maxScore = 0;

    // Palavras-chave esperadas no cabeçalho
    const keywords = ['nome', 'email', 'e-mail', 'whatsapp', 'cpf', 'utm_source', 'utm_medium', 'referência', 'origem', 'campaign'];

    for (let i = 0; i < Math.min(allRows.length, 20); i++) {
      const rowStr = allRows[i].map(c => c.toLowerCase()).join(' ');
      let score = 0;
      keywords.forEach(k => {
        if (rowStr.includes(k)) score++;
      });

      if (score > maxScore) {
        maxScore = score;
        bestHeaderIndex = i;
      }
    }

    if (bestHeaderIndex === -1 || maxScore < 2) {
      // Fallback: Tenta achar a linha 3 (índice 3 - linha 4) que é padrão desse arquivo
      if (allRows.length > 3) bestHeaderIndex = 3;
      else {
        setErrorMsg("Não conseguimos identificar automaticamente o cabeçalho do arquivo.");
        setIsProcessing(false);
        return;
      }
    }

    const headers = allRows[bestHeaderIndex].map(h => h.replace(/^"|"$/g, '').trim());

    // --- MAPEAMENTO DE COLUNAS COM FALLBACK POSICIONAL ---
    // Tenta achar pelo nome. Se retornar -1, usa o índice numérico fixo baseado no padrão do seu arquivo
    const findCol = (keys: string[], fallbackIndex: number) => {
      const idx = headers.findIndex(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase())));
      return idx !== -1 ? idx : fallbackIndex;
    };

    // Padrão do arquivo merge-csv:
    // 0: Nome, 1: Email, 5: utm_source, 6: utm_campaign, 7: utm_medium, 24: Referência
    const colMap = {
      name: findCol(['nome completo', 'name', 'nome'], 0),
      email: findCol(['e-mail', 'email'], 1),
      source: findCol(['utm_source', 'origem'], 5),
      medium: findCol(['utm_medium', 'midia'], 7),
      campaign: findCol(['utm_campaign', 'campanha'], 6),
      url: findCol(['referência', 'reference', 'url', 'link'], 24),
      date: findCol(['criado em', 'date', 'data'], 20)
    };

    // Guarda dados para debug
    setDebugData({
      headers,
      mappedCols: colMap,
      firstRow: allRows[bestHeaderIndex + 1]
    });

    const parsedLeads = [];
    let validCount = 0;

    for (let i = bestHeaderIndex + 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (!row || row.length < 3) continue; // Pula linhas vazias/quebradas

      const getVal = (idx: number) => (idx !== undefined && row[idx]) ? row[idx].replace(/^"|"$/g, '') : '';

      const leadData = {
        id: i,
        name: getVal(colMap.name) || 'Sem Nome',
        email: getVal(colMap.email) || '-',
        source: getVal(colMap.source).toLowerCase(),
        medium: getVal(colMap.medium).toLowerCase(),
        campaign: getVal(colMap.campaign).toLowerCase(),
        url: getVal(colMap.url),
        date: getVal(colMap.date)
      };

      // CLASSIFICAÇÃO
      const type = classifyLead(leadData);
      parsedLeads.push({ ...leadData, type });
      validCount++;
    }

    if (validCount === 0) {
      setErrorMsg("Arquivo lido, mas nenhum lead válido foi extraído. Verifique o debug.");
    } else {
      setLeads(parsedLeads);
    }
    setIsProcessing(false);
  };

  const classifyLead = (lead: any) => {
    const { source, medium, url } = lead;

    // 1. Definição de Pago
    // Procura termos pagos no Medium OU na URL (gclid, fbclid + cpc)
    const isPaidMedium = /cpc|paid|ppc|display|ads|banner|impulsionado|trafego/.test(medium);
    const isPaidSource = /facebook_ads|google_ads/.test(source);
    const hasGclid = /gclid/.test(url);
    const hasPaidUrlParams = /utm_medium=(cpc|paid)/.test(url);

    if (isPaidMedium || isPaidSource || hasGclid || hasPaidUrlParams) {
      return 'paid';
    }

    // 2. Definição de Orgânico
    const isOrganicMedium = /organic|referral|bio|linktree|social|feed/.test(medium);
    // Se tem fbclid mas NÃO caiu no 'paid' acima, é social orgânico
    const isSocialOrganic = /fbclid/.test(url) && !isPaidMedium;

    if (isOrganicMedium || isSocialOrganic) {
      return 'organic';
    }

    // 3. Definição de Direto
    // Se não tem source/medium E a URL não tem parâmetros de rastreio de marketing
    const urlHasNoUtm = !url.toLowerCase().includes('utm_source');
    const emptySourceMedium = (!source || source === 'nan') && (!medium || medium === 'nan');

    if (emptySourceMedium && urlHasNoUtm) {
      return 'direct';
    }

    // 4. Fallback (Geralmente leads manuais ou com source obscura)
    if (source && source !== 'nan') return 'organic'; // Se tem source mas não é paid, assume orgânico

    return 'direct'; // Padrão final
  };

  // --- DADOS COMPUTADOS ---
  const stats = useMemo(() => {
    const total = leads.length;
    const organic = leads.filter(l => l.type === 'organic').length;
    const paid = leads.filter(l => l.type === 'paid').length;
    const direct = leads.filter(l => l.type === 'direct').length;
    // Referral aqui usamos como 'Outros' apenas para dados muito estranhos
    const referral = leads.filter(l => l.type === 'referral').length;

    const pieData = [
      { name: 'Orgânico', value: organic, color: COLORS.organic },
      { name: 'Pago (Ads)', value: paid, color: COLORS.paid },
      { name: 'Direto', value: direct, color: COLORS.direct },
    ].filter(d => d.value > 0);

    // Top Campanhas Pagas
    const campaigns: any = {};
    leads.filter(l => l.type === 'paid' && l.campaign && l.campaign !== 'nan').forEach(l => {
      const camp = l.campaign.replace(/['"]/g, '');
      if (camp.length > 2) campaigns[camp] = (campaigns[camp] || 0) + 1;
    });

    const barData = Object.entries(campaigns)
      .map(([name, value]: [string, any]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { total, organic, paid, direct, referral, pieData, barData };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return filterType === 'all' ? leads : leads.filter(l => l.type === filterType);
  }, [leads, filterType]);

  const exportCSV = () => {
    if (leads.length === 0) return;
    const header = 'Nome,Email,Tipo,Origem,Midia,Campanha,URL\n';
    const rows = filteredLeads.map(l =>
      `"${l.name}","${l.email}","${l.type}","${l.source}","${l.medium}","${l.campaign}","${l.url}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${filterType}.csv`;
    link.click();
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-indigo-200 shadow-md">
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">LeadAnalytics <span className="text-indigo-600">Ultra</span></h1>
            <p className="text-xs text-slate-500 font-medium">Dashboard de Atribuição</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {leads.length > 0 && (
             <button 
               onClick={() => setShowDebug(!showDebug)}
               className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-slate-100 rounded-md transition-colors"
             >
               {showDebug ? <EyeOff size={14}/> : <Database size={14}/>}
               {showDebug ? 'Ocultar Debug' : 'Ver Dados Brutos'}
             </button>
           )}
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-slate-200 active:scale-95"
           >
             <Upload size={16} />
             <span>{leads.length > 0 ? 'Novo Arquivo' : 'Importar CSV'}</span>
           </button>
           <input 
             type="file" 
             accept=".csv" 
             ref={fileInputRef}
             onChange={handleFileUpload} 
             className="hidden" 
           />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* PAINEL DE DEBUG (Só aparece se ativado) */}
        {showDebug && debugData && (
          <div className="mb-8 bg-slate-900 text-slate-300 p-6 rounded-xl shadow-lg text-sm font-mono overflow-x-auto border border-slate-700">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Database size={16}/> Diagnóstico de Leitura</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-indigo-400 mb-2 font-bold">Colunas Identificadas (Índices):</p>
                <ul className="space-y-1">
                  {Object.entries(debugData.mappedCols).map(([key, val]: [string, any]) => (
                    <li key={key} className="flex justify-between border-b border-slate-700 pb-1">
                      <span>{key}:</span> 
                      <span className={val === -1 ? 'text-red-400' : 'text-emerald-400'}>
                        {val !== -1 ? `Coluna ${val} (${debugData.headers[val]})` : 'NÃO ENCONTRADO'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-indigo-400 mb-2 font-bold">Exemplo da 1ª Linha de Dados:</p>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(debugData.firstRow, null, 2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROS */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-r-lg shadow-sm animate-bounce-in">
            <AlertCircle size={24} />
            <div>
              <p className="font-bold">Erro na leitura</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {leads.length === 0 ? (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center mt-16 p-12 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-center max-w-2xl mx-auto hover:border-indigo-400 transition-colors">
            <div className={`p-6 rounded-full mb-6 transition-all ${isProcessing ? 'bg-indigo-100 animate-pulse' : 'bg-slate-50'}`}>
              {isProcessing ? <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <FileText size={48} className="text-slate-400" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              {isProcessing ? 'Processando Inteligência...' : 'Arraste seu arquivo CSV aqui'}
            </h2>
            <p className="text-slate-500 max-w-md mb-8">
              Algoritmo atualizado para detectar automaticamente colunas UTM e URLs, mesmo em arquivos complexos ou mesclados.
            </p>
          </div>
        ) : (
          // DASHBOARD
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total de Leads" value={stats.total} total={stats.total} icon={Users} colorClass="text-slate-600" />
              <StatCard title="Leads Orgânicos + Direto" value={stats.organic + stats.direct} total={stats.total} icon={Leaf} colorClass="text-emerald-600" subText="Tráfego Gratuito" />
              <StatCard title="Leads Pagos (Ads)" value={stats.paid} total={stats.total} icon={DollarSign} colorClass="text-blue-600" subText="Tráfego Pago" />
            </div>

            {/* GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[350px]">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <PieChart size={20} className="text-slate-400" /> Distribuição
                </h3>
                <div className="flex-1 w-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {stats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <BarChart2 size={20} className="text-slate-400" /> Top Campanhas Pagas
                </h3>
                {stats.barData.length > 0 ? (
                  <div className="flex-1 w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.barData} layout="vertical" margin={{ left: 20, right: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} />
                        <Bar dataKey="value" fill={COLORS.paid} radius={[0, 6, 6, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                    <p>Nenhuma campanha paga detectada.</p>
                    <p className="text-xs mt-2">Verifique se as colunas UTM estão preenchidas.</p>
                  </div>
                )}
              </div>
            </div>

            {/* TABELA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex gap-2">
                  {['all', 'organic', 'paid', 'direct'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                        filterType === type ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'all' ? 'Todos' : type}
                    </button>
                  ))}
                </div>
                <button onClick={exportCSV} className="text-indigo-600 font-medium text-sm flex items-center gap-1 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors">
                  <Download size={16} /> CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 w-1/3">Lead</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Origem (Source)</th>
                      <th className="px-6 py-3">Mídia (Medium)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.slice(0, 100).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-medium text-slate-800">{lead.name}</div>
                          <div className="text-xs text-slate-400">{lead.email}</div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            lead.type === 'organic' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            lead.type === 'paid' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            lead.type === 'direct' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-gray-50 text-gray-700 border-gray-100'
                          }`}>
                            {lead.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600 max-w-[150px] truncate" title={lead.source}>{lead.source || '-'}</td>
                        <td className="px-6 py-3 text-slate-600 max-w-[150px] truncate" title={lead.medium}>{lead.medium || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
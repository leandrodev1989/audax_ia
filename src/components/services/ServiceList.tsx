import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBarberData } from '../../context/BarberDataContext';
import { Service, ServiceCategory } from '../../types';
import {
  Scissors,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Clock,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface ServiceListProps {
  onScheduleService?: (serviceId: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ onScheduleService }) => {
  const { isOwner, activeRole, setActiveRole } = useAuth();
  const canManage = isOwner();
  const {
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceActive,
    appointments,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useBarberData();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');

  // Modal State for Create / Edit Service
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Modal State for Category Management
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>(50);
  const [formDuration, setFormDuration] = useState<number | string>(30);
  const [formCategory, setFormCategory] = useState<string>('cabelo');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState<string | null>(null);

  // Category visual styles & icons
  const getCategoryBadge = (category: ServiceCategory) => {
    const found = categories.find(
      (c) => c.slug === category || c.id === category || c.name.toLowerCase() === category.toLowerCase()
    );
    const label = found ? found.name : category;
    const lowerSlug = (found?.slug || found?.name || category || '').toLowerCase();

    if (lowerSlug.includes('cabelo') || lowerSlug === 'cabelo') {
      return { label, color: 'text-amber-900 bg-amber-100 border-amber-300', dot: 'bg-[#a16a1c]' };
    }
    if (lowerSlug.includes('barba') && !lowerSlug.includes('corte')) {
      return { label, color: 'text-amber-900 bg-orange-100 border-orange-300', dot: 'bg-orange-600' };
    }
    if ((lowerSlug.includes('corte') && lowerSlug.includes('barba')) || lowerSlug === 'corte_barba') {
      return { label, color: 'text-cyan-900 bg-cyan-100 border-cyan-300', dot: 'bg-cyan-700' };
    }
    if (lowerSlug.includes('combo') || lowerSlug.includes('pacote')) {
      return { label, color: 'text-purple-900 bg-purple-100 border-purple-300', dot: 'bg-purple-700' };
    }
    if (lowerSlug.includes('tratamento') || lowerSlug.includes('spa') || lowerSlug.includes('hidratacao')) {
      return { label, color: 'text-emerald-900 bg-emerald-100 border-emerald-300', dot: 'bg-emerald-700' };
    }

    return { label, color: 'text-stone-800 bg-stone-100 border-stone-300', dot: 'bg-stone-500' };
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingService(null);
    setFormName('');
    setFormDescription('');
    setFormPrice(60);
    setFormDuration(35);
    setFormCategory('cabelo');
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setFormName(service.name);
    setFormDescription(service.description || '');
    setFormPrice(service.price);
    setFormDuration(service.durationMinutes);
    setFormCategory(service.category);
    setFormIsActive(service.isActive !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Service (Create or Update)
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('O nome do serviço é obrigatório.');
      return;
    }

    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Informe um valor de preço válido maior que zero.');
      return;
    }

    const durationNum = Number(formDuration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setFormError('A duração estimada deve ser de pelo menos 5 minutos.');
      return;
    }

    if (editingService) {
      // Update existing
      updateService(editingService.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        durationMinutes: durationNum,
        category: formCategory,
        isActive: formIsActive,
      });
    } else {
      // Create new
      addService({
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        durationMinutes: durationNum,
        category: formCategory,
        isActive: formIsActive,
      });
    }

    setIsModalOpen(false);
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError('O nome da categoria é obrigatório.');
      return;
    }

    addCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      isActive: true,
    });

    setNewCatName('');
    setNewCatDesc('');
    setCatError(null);
  };

  // Confirm delete
  const handleConfirmDelete = (id: string) => {
    deleteService(id);
    setDeleteConfirmId(null);
  };

  // Filtered services
  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'todos' || srv.category === selectedCategory;

    const isActive = srv.isActive !== false;
    const matchesStatus =
      selectedStatus === 'todos' ||
      (selectedStatus === 'ativos' && isActive) ||
      (selectedStatus === 'inativos' && !isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats
  const totalCount = services.length;
  const activeCount = services.filter((s) => s.isActive !== false).length;
  const avgPrice = totalCount
    ? services.reduce((acc, s) => acc + s.price, 0) / totalCount
    : 0;
  const avgDuration = totalCount
    ? Math.round(services.reduce((acc, s) => acc + s.durationMinutes, 0) / totalCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2dcce] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-[#a16a1c] border border-amber-300">
              <Tag className="w-3 h-3" />
              <span>{canManage ? 'Gestão de Serviços & Procedimentos' : 'Catálogo & Procedimentos'}</span>
            </span>
            {canManage && (
              <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>Permissão: Dono (Edição Liberada)</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 mt-1.5">
            {canManage ? 'Catálogo de Serviços da Barbearia' : 'Nossos Serviços & Cuidados'}
          </h1>
          <p className="text-xs text-stone-700 font-semibold mt-1 max-w-2xl">
            {canManage
              ? 'Configure cortes, barbas, combos e tratamentos estéticos. Defina preços em R$, tempo de cadeira e disponibilidade na grade.'
              : 'Conheça nossos cortes, barboterapia e combos exclusivos. Escolha o procedimento e agende seu horário com facilidade.'}
          </p>
        </div>

        {/* Action Button */}
        {canManage && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-[#f8f5ee] hover:bg-[#eae3d5] text-stone-900 font-bold text-xs transition-all border border-[#e2dcce] shadow-xs"
            >
              <Tag className="w-3.5 h-3.5 text-[#a16a1c]" />
              <span>Gerenciar Categorias</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              id="btn-add-new-service"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Serviço</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Bar - Only visible to Owner */}
      {canManage && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-[#e2dcce] bg-white flex flex-col justify-between shadow-2xs">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              Total no Catálogo
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-stone-900">{totalCount}</span>
              <span className="text-[11px] text-stone-600 font-semibold">serviços</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#e2dcce] bg-white flex flex-col justify-between shadow-2xs">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              Serviços Ativos
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-800">{activeCount}</span>
              <span className="text-[11px] text-stone-600 font-semibold">disponíveis</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#e2dcce] bg-white flex flex-col justify-between shadow-2xs">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-[#a16a1c]">
                R$ {avgPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#e2dcce] bg-white flex flex-col justify-between shadow-2xs">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              Duração Média
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-blue-900">{avgDuration}</span>
              <span className="text-[11px] text-stone-600 font-semibold">minutos</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl border border-[#e2dcce] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por corte, barba, combo ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f8f5ee] border border-[#e2dcce] rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-[#a16a1c]"
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos', label: 'Todos' },
            ...categories.map((c) => ({ id: c.slug || c.name, label: c.name })),
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-[#a16a1c] text-white shadow-xs'
                    : 'bg-[#f8f5ee] text-stone-800 hover:bg-[#eae3d5]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1 bg-[#f8f5ee] border border-[#e2dcce] rounded-lg p-1">
          <button
            onClick={() => setSelectedStatus('todos')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
              selectedStatus === 'todos'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedStatus('ativos')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
              selectedStatus === 'ativos'
                ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ativos
          </button>
          <button
            onClick={() => setSelectedStatus('inativos')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
              selectedStatus === 'inativos'
                ? 'bg-rose-100 text-rose-900 font-bold border border-rose-300'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Inativos
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-[#e2dcce] bg-white space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto border border-stone-200">
            <Scissors className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-stone-900">Nenhum serviço encontrado</h3>
          <p className="text-xs text-stone-600 font-semibold max-w-sm mx-auto">
            Tente alterar os termos de busca ou filtros de categoria.
          </p>
          {canManage && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md"
            >
              Cadastrar Primeiro Serviço
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => {
            const badge = getCategoryBadge(srv.category);
            const isActive = srv.isActive !== false;
            const completedTimes = appointments.filter(
              (a) => a.serviceId === srv.id && a.status === 'finalizado'
            ).length;

            return (
              <div
                key={srv.id}
                className={`relative rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                  isActive
                    ? 'border-[#e2dcce] bg-white hover:border-[#a16a1c] shadow-xs'
                    : 'border-[#e2dcce]/60 bg-[#f5f2eb]/60 opacity-70'
                }`}
              >
                <div>
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-stone-200 text-stone-700 border border-stone-300'
                        }`}
                      >
                        {isActive ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-black text-stone-900 leading-snug">
                      {srv.name}
                    </h3>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-lg font-black text-[#a16a1c]">
                        R$ {srv.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-stone-600 font-semibold mt-2 line-clamp-2 leading-relaxed min-h-[36px]">
                    {srv.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Meta: Duration & Demand */}
                  <div className="flex items-center space-x-4 mt-4 text-[11px] font-bold text-stone-600 pt-3 border-t border-[#e2dcce]">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-[#a16a1c]" />
                      <span>{srv.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3.5 h-3.5 text-stone-500" />
                      <span>{completedTimes} atendimentos</span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="mt-5 pt-3 border-t border-[#e2dcce] flex items-center justify-between gap-2">
                  {/* Schedule CTA */}
                  {onScheduleService && (
                    <button
                      onClick={() => onScheduleService(srv.id)}
                      disabled={!isActive}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        isActive
                          ? !canManage
                            ? 'bg-[#a16a1c] hover:bg-[#8c5a15] text-white shadow-md hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-[#f8f5ee] hover:bg-[#a16a1c] hover:text-white text-stone-900 border border-[#e2dcce]'
                          : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{canManage ? 'Agendar' : 'Agendar Horário'}</span>
                    </button>
                  )}

                  {/* Dono Management Controls */}
                  {canManage && (
                    <div className="flex items-center space-x-1.5">
                      {/* Toggle Active Switch */}
                      <button
                        onClick={() => toggleServiceActive(srv.id)}
                        className={`p-2 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'text-stone-500 hover:text-[#a16a1c] hover:bg-stone-100'
                            : 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300'
                        }`}
                        title={isActive ? 'Pausar serviço no catálogo' : 'Ativar serviço'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => handleOpenEditModal(srv)}
                        id={`btn-edit-service-${srv.id}`}
                        className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Editar serviço"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteConfirmId(srv.id)}
                        id={`btn-delete-service-${srv.id}`}
                        className="p-2 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Excluir serviço"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-stone-900">
            <div className="flex items-center justify-between border-b border-[#e2dcce] pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-100 text-[#a16a1c]">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
                  </h3>
                  <p className="text-[11px] text-stone-600 font-semibold">
                    Defina especificações, preço e tempo na grade
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Service Name */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê Americano / Barboterapia"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f5ee] border border-[#e2dcce] rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                />
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-900">
                    Categoria *
                  </label>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-[#a16a1c] hover:underline font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nova Categoria</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-0.5">
                  {categories.map((cat) => {
                    const catKey = cat.slug || cat.name;
                    const isSelected =
                      formCategory === catKey ||
                      formCategory === cat.name ||
                      formCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormCategory(catKey)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-bold truncate border transition-all text-center ${
                          isSelected
                            ? 'bg-[#a16a1c] text-white border-[#8c5a15] shadow-2xs'
                            : 'bg-[#f8f5ee] border-[#e2dcce] text-stone-800 hover:bg-[#eae3d5]'
                        }`}
                        title={cat.name}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Preço (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-stone-600">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#f8f5ee] border border-[#e2dcce] rounded-xl text-xs font-black text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Duração (minutos) *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
                    <input
                      type="number"
                      step="5"
                      min="5"
                      max="300"
                      required
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#f8f5ee] border border-[#e2dcce] rounded-xl text-xs font-black text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-stone-600">
                <span>Atalhos:</span>
                {[20, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormDuration(mins)}
                    className="px-2 py-0.5 rounded bg-[#f8f5ee] border border-[#e2dcce] hover:border-[#a16a1c] hover:text-[#a16a1c]"
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique o que inclui o serviço, produtos utilizados e diferenciais."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8f5ee] border border-[#e2dcce] rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c] resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="p-3 bg-[#f8f5ee] rounded-xl border border-[#e2dcce] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-stone-900">Serviço Ativo no Catálogo</p>
                  <p className="text-[10px] text-stone-600 font-semibold">
                    Disponível imediatamente para agendamento online
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#a16a1c] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-service"
                  className="px-5 py-2 rounded-xl bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow-md transition-all"
                >
                  {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4 text-stone-900">
            <div className="flex items-center space-x-3 text-rose-800">
              <div className="p-2.5 rounded-xl bg-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900">Confirmar Exclusão</h3>
                <p className="text-xs text-stone-600 font-semibold">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 font-medium leading-relaxed">
              Tem certeza que deseja remover este serviço? Caso ele já possua agendamentos históricos,
              recomendamos apenas <strong>pausar o serviço</strong> para manter a integridade dos relatórios.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:text-stone-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md"
              >
                Excluir Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Category Management */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#e2dcce] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-stone-900">
            <div className="flex items-center justify-between border-b border-[#e2dcce] pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-amber-100 text-[#a16a1c]">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Gerenciar Categorias de Serviços</h3>
                  <p className="text-[11px] text-stone-600 font-semibold">
                    Crie e organize categorias como Corte + Barba, Cabelo, Barba, Combo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {catError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{catError}</span>
                </div>
              )}

              {/* Add Category Form */}
              <form onSubmit={handleSaveCategory} className="p-4 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] space-y-3">
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">Adicionar Nova Categoria</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-900 mb-1">Nome da Categoria *</label>
                    <input
                      type="text"
                      placeholder="Ex: Corte + Barba"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#e2dcce] rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-900 mb-1">Descrição curta</label>
                    <input
                      type="text"
                      placeholder="Ex: Pacote completo de cabelo e barba"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#e2dcce] rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:border-[#a16a1c]"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#a16a1c] hover:bg-[#8c5a15] text-white font-bold text-xs shadow transition-all"
                  >
                    Cadastrar Categoria
                  </button>
                </div>
              </form>

              {/* Categories List */}
              <div>
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Categorias Cadastradas ({categories.length})</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-3 rounded-xl bg-[#f8f5ee] border border-[#e2dcce] flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-stone-900">{cat.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white text-stone-700 font-mono border border-stone-300">slug: {cat.slug}</span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-stone-600 font-semibold mt-0.5">{cat.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Excluir categoria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#e2dcce] flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

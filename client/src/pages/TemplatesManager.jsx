import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  FileText,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  Shield,
} from 'lucide-react';

export const TemplatesManager = () => {
  const { isAdmin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    description: '',
    isDefault: false,
    fieldsConfigText: '',
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openEditModal = (tmpl) => {
    setEditingTemplate(tmpl);
    setForm({
      name: tmpl.name,
      specialty: tmpl.specialty,
      description: tmpl.description || '',
      isDefault: tmpl.isDefault,
      fieldsConfigText: JSON.stringify(tmpl.fieldsConfig, null, 2),
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingTemplate(null);
    setForm({
      name: '',
      specialty: '',
      description: '',
      isDefault: false,
      fieldsConfigText: JSON.stringify(
        {
          sections: ['complaints', 'hpi', 'pastHistory', 'vitals', 'examination', 'diagnosis', 'prescription'],
          customFields: [
            { key: 'customNote', label: 'Specialty Assessment Note', type: 'text', placeholder: 'Enter observations' }
          ]
        },
        null,
        2
      ),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(form.fieldsConfigText);
    } catch (e) {
      alert('Invalid JSON in Fields Configuration. Please check syntax.');
      return;
    }

    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          specialty: form.specialty,
          description: form.description,
          isDefault: form.isDefault,
          fieldsConfig: parsedConfig,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save template');
      }

      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            <span>Specialty Case Templates</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin configuration for specialty fields (General Medicine, Homeopathy, Dental, Pediatrics).
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Specialty Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft hover:shadow-card transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700">
                  {tmpl.specialty}
                </span>
                {tmpl.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Default Template
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900">{tmpl.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{tmpl.description || 'Specialty case configuration.'}</p>

              {/* Custom fields preview */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Configured Specialty Fields:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.fieldsConfig?.customFields?.length > 0 ? (
                    tmpl.fieldsConfig.customFields.map((cf) => (
                      <span
                        key={cf.key}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                      >
                        {cf.label} ({cf.type || 'text'})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Standard general medicine layout</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => openEditModal(tmpl)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-teal-600 hover:text-teal-700 text-slate-700 text-xs font-bold transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Template Schema</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? `Edit ${editingTemplate.name}` : 'New Specialty Template'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Template Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dermatology"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty *</label>
              <input
                type="text"
                required
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="e.g. Dermatology"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Clinical scope and guidelines for this template"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Configuration (JSON schema)
            </label>
            <textarea
              rows="8"
              value={form.fieldsConfigText}
              onChange={(e) => setForm({ ...form, fieldsConfigText: e.target.value })}
              className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Define customFields array with key, label, type ('text', 'number', 'select', 'textarea'), and options.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs font-semibold text-slate-800">Set as default template for new consultations</span>
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition"
            >
              Save Template
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

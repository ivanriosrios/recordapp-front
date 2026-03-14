import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Estado global
      business: null,      // { id, name, business_type, whatsapp_phone, plan, ... }
      clients: [],
      services: [],
      templates: [],

      // Acciones business
      setBusiness: (business) => {
        if (business?.id) {
          localStorage.setItem('business_id', business.id)
        }
        set({ business })
      },

      clearBusiness: () => {
        localStorage.removeItem('business_id')
        set({ business: null, clients: [], services: [], templates: [] })
      },

      // Acciones clients
      setClients: (clients) => set({ clients }),
      addClient: (client) => set((s) => ({ clients: [client, ...s.clients] })),
      updateClient: (id, data) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),

      // Acciones services
      setServices: (services) => set({ services }),
      addService: (service) => set((s) => ({ services: [...s.services, service] })),

      // Acciones templates
      setTemplates: (templates) => set({ templates }),
      addTemplate: (template) => set((s) => ({ templates: [...s.templates, template] })),
    }),
    {
      name: 'recordapp-store',
      partialize: (state) => ({ business: state.business }),
    }
  )
)

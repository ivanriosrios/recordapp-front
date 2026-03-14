import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      business: null,
      clients: [],
      services: [],
      templates: [],

      // Auth actions
      setAuth: ({ access_token, business_id, business_name, business }) => {
        set({
          token: access_token,
          business: business || { id: business_id, name: business_name },
        })
      },

      setBusiness: (business) => set({ business }),

      logout: () => {
        set({ token: null, business: null, clients: [], services: [], templates: [] })
      },

      // Helpers
      isAuthenticated: () => Boolean(get().token && get().business?.id),

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
      partialize: (state) => ({
        token: state.token,
        business: state.business,
      }),
    }
  )
)

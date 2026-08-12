import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { makeId } from '../lib/id';
import type { AspectId } from '../lib/aspect';
import type { SlideData, ProjectFile } from '../types';

function emptySlide(): SlideData {
  return { id: makeId(), json: null, thumbnail: null };
}

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
      if (useEditorStore.getState().saveError) useEditorStore.getState().setSaveError(false);
    } catch {
      if (!useEditorStore.getState().saveError) useEditorStore.getState().setSaveError(true);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

interface EditorState {
  projectName: string;
  slides: SlideData[];
  activeSlideId: string | null;
  aspect: AspectId;
  showPageNumbers: boolean;
  saveError: boolean;

  setProjectName: (name: string) => void;
  addSlide: () => string;
  duplicateSlide: (id: string) => void;
  removeSlide: (id: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  setActiveSlide: (id: string) => void;
  updateSlide: (id: string, data: Partial<Omit<SlideData, 'id'>>) => void;
  setAspect: (aspect: AspectId) => void;
  togglePageNumbers: () => void;
  setSaveError: (v: boolean) => void;
  resetProject: () => void;
  loadProject: (data: ProjectFile) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      projectName: 'Mein Karussell',
      slides: [emptySlide()],
      activeSlideId: null,
      aspect: 'portrait',
      showPageNumbers: false,
      saveError: false,

      setProjectName: (projectName) => set({ projectName }),

      addSlide: () => {
        const slide = emptySlide();
        set((state) => ({ slides: [...state.slides, slide], activeSlideId: slide.id }));
        return slide.id;
      },

      duplicateSlide: (id) => {
        const state = get();
        const idx = state.slides.findIndex((s) => s.id === id);
        if (idx === -1) return;
        const copy: SlideData = {
          id: makeId(),
          json: state.slides[idx].json ? JSON.parse(JSON.stringify(state.slides[idx].json)) : null,
          thumbnail: state.slides[idx].thumbnail,
        };
        const slides = [...state.slides];
        slides.splice(idx + 1, 0, copy);
        set({ slides, activeSlideId: copy.id });
      },

      removeSlide: (id) => {
        const state = get();
        if (state.slides.length <= 1) return;
        const idx = state.slides.findIndex((s) => s.id === id);
        const slides = state.slides.filter((s) => s.id !== id);
        let activeSlideId = state.activeSlideId;
        if (activeSlideId === id) {
          const nextIdx = Math.max(0, idx - 1);
          activeSlideId = slides[nextIdx]?.id ?? null;
        }
        set({ slides, activeSlideId });
      },

      reorderSlides: (fromIndex, toIndex) => {
        const state = get();
        const slides = [...state.slides];
        const [moved] = slides.splice(fromIndex, 1);
        slides.splice(toIndex, 0, moved);
        set({ slides });
      },

      setActiveSlide: (activeSlideId) => set({ activeSlideId }),

      updateSlide: (id, data) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },

      setAspect: (aspect) => set({ aspect }),

      togglePageNumbers: () => set((state) => ({ showPageNumbers: !state.showPageNumbers })),

      setSaveError: (saveError) => set({ saveError }),

      resetProject: () => {
        const slide = emptySlide();
        set({
          projectName: 'Mein Karussell',
          slides: [slide],
          activeSlideId: slide.id,
          aspect: 'portrait',
          showPageNumbers: false,
        });
      },

      loadProject: (data) => {
        set({
          projectName: data.projectName,
          slides: data.slides.length ? data.slides : [emptySlide()],
          activeSlideId: data.slides[0]?.id ?? null,
          aspect: data.aspect,
          showPageNumbers: data.showPageNumbers,
        });
      },
    }),
    {
      name: 'insta-carousel-project',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        projectName: state.projectName,
        slides: state.slides,
        activeSlideId: state.activeSlideId,
        aspect: state.aspect,
        showPageNumbers: state.showPageNumbers,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.activeSlideId && state.slides.length) {
          state.activeSlideId = state.slides[0].id;
        }
      },
    },
  ),
);

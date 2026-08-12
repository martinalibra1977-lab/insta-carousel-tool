import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Canvas, IText, Rect, Circle, Line, FabricImage, Gradient, type FabricObject } from 'fabric';
import { useEditorStore } from '../store/useEditorStore';
import { getEditDims } from '../lib/aspect';
import { renderBrandedSlide, type BrandedPostInput } from '../lib/brandPost';

export type ShapeKind = 'rect' | 'circle' | 'line';

interface CanvasContextValue {
  canvasElRef: RefObject<HTMLCanvasElement | null>;
  canvas: Canvas | null;
  selected: FabricObject | null;
  selectedVersion: number;
  bumpSelected: () => void;
  addText: (text?: string) => void;
  addShape: (kind: ShapeKind) => void;
  addImageFile: (file: File) => Promise<void>;
  setBackgroundColor: (color: string) => void;
  setBackgroundGradient: (colors: [string, string], angleDeg: number) => void;
  setBackgroundImageFile: (file: File) => Promise<void>;
  clearBackgroundImage: () => void;
  applyBackgroundToAllSlides: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  updateSelected: (props: Record<string, unknown>) => void;
  scheduleSave: () => void;
  generateBrandPost: (input: BrandedPostInput) => Promise<void>;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fitImageToCanvas(img: FabricImage, canvas: Canvas) {
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  const iw = img.width ?? cw;
  const ih = img.height ?? ch;
  const scale = Math.max(cw / iw, ch / ih);
  img.set({
    originX: 'left',
    originY: 'top',
    scaleX: scale,
    scaleY: scale,
    left: (cw - iw * scale) / 2,
    top: (ch - ih * scale) / 2,
  });
}

export function CanvasProvider({ children }: { children: ReactNode }) {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const isLoadingRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [selectedVersion, setSelectedVersion] = useState(0);

  const activeSlideId = useEditorStore((s) => s.activeSlideId);
  const aspect = useEditorStore((s) => s.aspect);
  const updateSlide = useEditorStore((s) => s.updateSlide);

  const prevSlideIdRef = useRef<string | null>(null);

  const bumpSelected = useCallback(() => setSelectedVersion((v) => v + 1), []);

  // Serializes the canvas' *current* contents into the given slide immediately,
  // bypassing the debounce. Used when leaving a slide, so a pending debounced
  // save (scheduled against the slide we're leaving) can't fire late — after the
  // canvas has already been cleared and reloaded for the next slide — and
  // overwrite the old slide with the new slide's contents.
  const flushSave = useCallback(
    (slideId: string | null) => {
      const fc = fabricRef.current;
      if (!fc || !slideId) return;
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const json = fc.toJSON();
      let thumbnail: string | null = null;
      try {
        thumbnail = fc.toDataURL({
          format: 'jpeg',
          quality: 0.55,
          multiplier: 260 / fc.getWidth(),
        });
      } catch {
        thumbnail = null;
      }
      updateSlide(slideId, { json: json as Record<string, unknown>, thumbnail });
    },
    [updateSlide],
  );

  const scheduleSave = useCallback(() => {
    const fc = fabricRef.current;
    const slideId = useEditorStore.getState().activeSlideId;
    if (!fc || !slideId || isLoadingRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      flushSave(slideId);
    }, 300);
  }, [flushSave]);

  // Initialize fabric canvas once.
  useEffect(() => {
    if (!canvasElRef.current) return;
    const { width, height } = getEditDims(useEditorStore.getState().aspect);
    const fc = new Canvas(canvasElRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selectionColor: 'rgba(129, 52, 255, 0.15)',
      selectionBorderColor: '#8134ff',
      selectionLineWidth: 1.5,
    });
    fabricRef.current = fc;
    setCanvas(fc);

    const onSelection = () => setSelected(fc.getActiveObject() ?? null);
    const onCleared = () => setSelected(null);
    const onChanged = () => {
      scheduleSave();
      bumpSelected();
    };

    fc.on('selection:created', onSelection);
    fc.on('selection:updated', onSelection);
    fc.on('selection:cleared', onCleared);
    fc.on('object:modified', onChanged);
    fc.on('object:added', onChanged);
    fc.on('object:removed', onChanged);
    fc.on('text:changed', onChanged);

    return () => {
      fc.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load active slide contents when it changes.
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !activeSlideId) return;

    if (saveTimerRef.current && prevSlideIdRef.current && prevSlideIdRef.current !== activeSlideId) {
      flushSave(prevSlideIdRef.current);
    }
    prevSlideIdRef.current = activeSlideId;

    const slide = useEditorStore.getState().slides.find((s) => s.id === activeSlideId);
    isLoadingRef.current = true;
    setSelected(null);
    fc.discardActiveObject();

    const finish = () => {
      fc.renderAll();
      isLoadingRef.current = false;
    };

    if (slide?.json) {
      fc.loadFromJSON(slide.json)
        .then(() => finish())
        .catch(() => finish());
    } else {
      fc.clear();
      fc.backgroundColor = '#ffffff';
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideId]);

  // Resize canvas when aspect ratio changes.
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const { width, height } = getEditDims(aspect);
    fc.setDimensions({ width, height });
    fc.renderAll();
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  const addText = useCallback(
    (text = 'Text hinzufügen') => {
      const fc = fabricRef.current;
      if (!fc) return;
      const obj = new IText(text, {
        left: fc.getWidth() / 2,
        top: fc.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fontFamily: 'Poppins, sans-serif',
        fontSize: 36,
        fill: '#1a1a1a',
        textAlign: 'center',
      });
      fc.add(obj);
      fc.setActiveObject(obj);
      fc.requestRenderAll();
    },
    [],
  );

  const addShape = useCallback((kind: ShapeKind) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const common = {
      left: fc.getWidth() / 2,
      top: fc.getHeight() / 2,
      originX: 'center' as const,
      originY: 'center' as const,
      fill: '#8134ff',
    };
    let obj: FabricObject;
    if (kind === 'rect') {
      obj = new Rect({ ...common, width: 160, height: 160, rx: 12, ry: 12 });
    } else if (kind === 'circle') {
      obj = new Circle({ ...common, radius: 90 });
    } else {
      obj = new Line([0, 0, 200, 0], {
        left: fc.getWidth() / 2,
        top: fc.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        stroke: '#8134ff',
        strokeWidth: 6,
      });
    }
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.requestRenderAll();
  }, []);

  const addImageFile = useCallback(async (file: File) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const dataUrl = await readFileAsDataURL(file);
    const img = await FabricImage.fromURL(dataUrl);
    const maxDim = Math.min(fc.getWidth(), fc.getHeight()) * 0.7;
    const scale = maxDim / Math.max(img.width ?? maxDim, img.height ?? maxDim);
    img.set({
      left: fc.getWidth() / 2,
      top: fc.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
    });
    fc.add(img);
    fc.setActiveObject(img);
    fc.requestRenderAll();
  }, []);

  const setBackgroundColor = useCallback(
    (color: string) => {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.backgroundImage = undefined;
      fc.backgroundColor = color;
      fc.requestRenderAll();
      scheduleSave();
    },
    [scheduleSave],
  );

  const setBackgroundGradient = useCallback(
    (colors: [string, string], angleDeg: number) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const rad = (angleDeg * Math.PI) / 180;
      const w = fc.getWidth();
      const h = fc.getHeight();
      const cx = w / 2;
      const cy = h / 2;
      const dx = (Math.cos(rad) * w) / 2;
      const dy = (Math.sin(rad) * h) / 2;
      fc.backgroundImage = undefined;
      fc.backgroundColor = new Gradient({
        type: 'linear',
        coords: { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy },
        colorStops: [
          { offset: 0, color: colors[0] },
          { offset: 1, color: colors[1] },
        ],
      });
      fc.requestRenderAll();
      scheduleSave();
    },
    [scheduleSave],
  );

  const setBackgroundImageFile = useCallback(
    async (file: File) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const dataUrl = await readFileAsDataURL(file);
      const img = await FabricImage.fromURL(dataUrl);
      fitImageToCanvas(img, fc);
      fc.backgroundImage = img;
      fc.requestRenderAll();
      scheduleSave();
    },
    [scheduleSave],
  );

  const clearBackgroundImage = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.backgroundImage = undefined;
    fc.requestRenderAll();
    scheduleSave();
  }, [scheduleSave]);

  const applyBackgroundToAllSlides = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const bg = fc.backgroundColor;
    const bgImg = fc.backgroundImage;
    const state = useEditorStore.getState();
    state.slides.forEach((slide) => {
      if (slide.id === state.activeSlideId) return;
      const json = slide.json ?? { objects: [], background: '#ffffff' };
      const nextJson = {
        ...json,
        background: bg,
        backgroundImage: bgImg ? (bgImg as FabricImage).toObject() : undefined,
      };
      state.updateSlide(slide.id, { json: nextJson as Record<string, unknown> });
    });
  }, []);

  const deleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const objs = fc.getActiveObjects();
    if (!objs.length) return;
    objs.forEach((o) => fc.remove(o));
    fc.discardActiveObject();
    fc.requestRenderAll();
  }, []);

  const duplicateSelected = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObject();
    if (!active) return;
    const cloned = await active.clone();
    cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
    fc.add(cloned);
    fc.setActiveObject(cloned);
    fc.requestRenderAll();
  }, []);

  const bringForward = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    fc.bringObjectForward(obj);
    fc.requestRenderAll();
    scheduleSave();
  }, [scheduleSave]);

  const sendBackward = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    fc.sendObjectBackwards(obj);
    fc.requestRenderAll();
    scheduleSave();
  }, [scheduleSave]);

  const bringToFront = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    fc.bringObjectToFront(obj);
    fc.requestRenderAll();
    scheduleSave();
  }, [scheduleSave]);

  const sendToBack = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    fc.sendObjectToBack(obj);
    fc.requestRenderAll();
    scheduleSave();
  }, [scheduleSave]);

  const updateSelected = useCallback(
    (props: Record<string, unknown>) => {
      const fc = fabricRef.current;
      const obj = fc?.getActiveObject();
      if (!fc || !obj) return;
      obj.set(props);
      obj.setCoords();
      fc.requestRenderAll();
      bumpSelected();
      scheduleSave();
    },
    [bumpSelected, scheduleSave],
  );

  const generateBrandPost = useCallback(async (input: BrandedPostInput) => {
    const logoUrl = `${import.meta.env.BASE_URL}brand/logo.png`;
    const aspect = useEditorStore.getState().aspect;
    const { json, thumbnail } = await renderBrandedSlide(input, aspect, logoUrl);
    const newId = useEditorStore.getState().addSlide();
    useEditorStore.getState().updateSlide(newId, { json, thumbnail });
  }, []);

  const value = useMemo<CanvasContextValue>(
    () => ({
      canvasElRef,
      canvas,
      selected,
      selectedVersion,
      bumpSelected,
      addText,
      addShape,
      addImageFile,
      setBackgroundColor,
      setBackgroundGradient,
      setBackgroundImageFile,
      clearBackgroundImage,
      applyBackgroundToAllSlides,
      deleteSelected,
      duplicateSelected,
      bringForward,
      sendBackward,
      bringToFront,
      sendToBack,
      updateSelected,
      scheduleSave,
      generateBrandPost,
    }),
    [
      canvas,
      selected,
      selectedVersion,
      bumpSelected,
      addText,
      addShape,
      addImageFile,
      setBackgroundColor,
      setBackgroundGradient,
      setBackgroundImageFile,
      clearBackgroundImage,
      applyBackgroundToAllSlides,
      deleteSelected,
      duplicateSelected,
      bringForward,
      sendBackward,
      bringToFront,
      sendToBack,
      updateSelected,
      scheduleSave,
      generateBrandPost,
    ],
  );

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvasEditor(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasEditor must be used within CanvasProvider');
  return ctx;
}

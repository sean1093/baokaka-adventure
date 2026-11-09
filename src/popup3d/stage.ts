import {
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  MeshLambertMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PointLight,
  RGBADepthPacking,
  Raycaster,
  SRGBColorSpace,
  Scene,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { holds, partState } from '../popup/core/cond';
import { nodePos } from '../popup/core/graph';
import { mochaNode } from '../popup/core/mocha';
import { compilePart } from '../popup/core/presets';
import { stepGrowth } from '../popup/core/step';
import { initialState } from '../popup/core/state';
import type { SimEvent } from '../popup/core/events';
import type { Id, PageDef, SimState } from '../popup/core/types';
import { SPRITE_MANIFEST, chapterGradeKey, frameAt, frameUrl, shownStem, toPage, type SpriteId } from '../popup/sprites';
import { MOCHA_STATE_ANIM, babyAnim, chooseFrame, edgeKind, mochaState, reachedHigh, sayingWord, standeeTilt, stepT, travelDir, type ActorAnim } from '../popup/view/actors';
import { GUTTER_Y, PAGE_W, type BookLayout, type Hit, type Pt } from '../popup/view/geometry';
import { MIN_HIT_PX, targetsOf, type PartPreview, type Target } from '../popup/view/gestures';
import { clamp01, drawnNodePos, easeInOut, partProgress, stepPose } from '../popup/view/interp';
import { CARDS } from './cards.gen';
import type { CardDef } from './cards';
import { DEFAULT_EYE, FLOOR_DEPTH, FLOOR_W, floorPoint, floorToPage, footDepth, footScale, planeToPage, standPoint, windowFrustum, type V3 } from './camera';
import type { Page3D } from './pages3d';

/**
 * The 3D page stage (#225, the three.js spike; option B): 1-2 「月台的縫」 as a real pop-up book
 * in WebGL. It draws only the page; the HUD, the bubbles and the subtitles stay DOM (`Popup3D.tsx`),
 * placed by `project()`. Like `PageView` it is a pure function of the session's frame: `update()`
 * reads `(def, prev, state, ms)` and never touches the simulation.
 *
 * - **Book:** the navy board under everything, the page block, the floor page lying flat, the
 *   standing page hinged at the gutter with a soft crease shadow.
 * - **Cards** (`cards.gen.ts`, cut by `npm run bake:3d` from the game's own art): each a textured
 *   plane mapped along the default eye's rays (`camera.ts`), so from the default eye the page is
 *   pixel-for-pixel the 2D layout; a cream copy 1.6 units behind is the cut paper edge you see as
 *   the book leans.
 * - **Light:** a cool moon (the one shadow-casting light, a 1024² PCF soft shadow map; cards cast
 *   through their alpha), two warm lamp point lights, a warm/cool hemisphere fill.
 * - **Opening** (`open` 0 → 1): the standing page swings up from lying shut over the floor, then
 *   each card rises from the floor about its foot, back to front, with a little overshoot; the
 *   characters pop up last.
 * - **Characters:** die-cut standees from the baked v2 frames (`sprites/`), the same animation
 *   choice as the 2D page (`babyAnim`, `mochaState`, `chooseFrame`).
 * - **Touch:** `pick()` raycasts invisible hit planes, one per touchable on the plane it is drawn
 *   on, grown so each is ≥ 48 CSS px on screen (`touchables()` reports the sizes).
 */

export type ShadowMode = 'map' | 'blob' | 'off';

export interface StageOptions {
  readonly shadows: ShadowMode;
  /** Cap on the device pixel ratio the canvas renders at */
  readonly maxDpr: number;
}

/** What the session hands the stage each frame (the same inputs as `PageView`). */
export interface StageFrame {
  readonly prev: SimState;
  readonly state: SimState;
  readonly events: readonly SimEvent[];
  readonly ms: number;
  readonly tickMs: number;
  readonly reduced: boolean;
  /** A part held between stops by the finger (`GestureTracker`) */
  readonly preview: PartPreview | null;
  readonly dragging: Id | null;
  /** Where the finger is (page units), while it holds the world: Baokaka watches it */
  readonly finger: Pt | null;
  /** Wall-clock ms, for loops that run on their own clock (idle breathing) */
  readonly now: number;
}

/** A touchable's hit plane. */
interface HitPlane {
  readonly target: Target;
  readonly mesh: Mesh;
  /** 'floor', or the ray scale of its standing plane */
  readonly plane: 'floor' | number;
}

interface CardMesh {
  readonly def: CardDef;
  /** Rotates about the card's foot line for the opening */
  readonly pivot: Group;
  readonly face: Mesh;
  readonly edge: Mesh | null;
  /** Ray scale (stand cards) */
  readonly s: number;
  /** World position of the card's box centre (stand cards) */
  readonly home: Vector3;
  /** Rise order 0…1 for the opening */
  readonly order: number;
}

const PAPER_EDGE = new Color('#F3E7CF');
const EDGE_OFFSET = 1.6;
/** A card rises over this share of the opening, staggered by depth. */
const RISE_SPAN = 0.4;

const loader = new TextureLoader();
const CARD_FILES = import.meta.glob<string>('./assets/**/*.webp', { eager: true, query: '?url', import: 'default' });
const cardUrl = (file: string): string => {
  const url = CARD_FILES[`./assets/${file}@2x.webp`];
  if (url === undefined) throw new Error(`3D card ${file}: no bitmap`);
  return url;
};

function prepare(tex: Texture): Texture {
  tex.colorSpace = SRGBColorSpace;
  // The cards are drawn near 1:1 (2 px per unit at DPR 2): no mip chain, a third less memory
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 1;
  return tex;
}

const easeOutBack = (t: number) => {
  const c = 1.4;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
const smooth = (t: number) => t * t * (3 - 2 * t);

/** The book's linen, the page block's stacked edges: tiny canvas textures (no download). */
function stripesTexture(colors: readonly string[], h = 64): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = h;
  const g = c.getContext('2d')!;
  colors.forEach((col, i) => {
    g.fillStyle = col;
    g.fillRect(0, (i * h) / colors.length, 4, h / colors.length + 1);
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A soft radial blot (contact shadows, the crease, lamp pools). */
function blotTexture(inner: string, outer: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The crease: dark at the fold, fading toward the reader. */
function creaseTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, 'rgba(20,12,52,0.55)');
  grad.addColorStop(0.35, 'rgba(20,12,52,0.18)');
  grad.addColorStop(1, 'rgba(20,12,52,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The book's cover (the standing page's outside): navy linen, a foil frame, the game's name and the page's. */
function coverTexture(title: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 396;
  c.height = 366;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1E1A4A';
  g.fillRect(0, 0, c.width, c.height);
  g.globalAlpha = 0.07;
  g.fillStyle = '#ffffff';
  for (let x = 0; x < c.width; x += 3) g.fillRect(x, 0, 1, c.height);
  for (let y = 0; y < c.height; y += 3) g.fillRect(0, y, c.width, 1);
  g.globalAlpha = 1;
  g.strokeStyle = '#D9B45A';
  g.lineWidth = 3;
  g.strokeRect(22, 22, c.width - 44, c.height - 44);
  g.lineWidth = 1;
  g.strokeRect(30, 30, c.width - 60, c.height - 60);
  g.fillStyle = '#E8C66A';
  g.textAlign = 'center';
  g.font = "900 54px 'Noto Serif TC', serif";
  g.fillText('翻翻台北', c.width / 2, 160);
  g.font = "700 18px 'Fredoka', 'Chiron GoRound TC', sans-serif";
  g.fillText('Pop-Up Taipei', c.width / 2, 196);
  g.font = "900 26px 'Noto Serif TC', serif";
  g.fillText(`「${title}」`, c.width / 2, 262);
  g.beginPath();
  g.arc(c.width / 2, 80, 14, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1E1A4A';
  g.beginPath();
  g.arc(c.width / 2 + 7, 76, 12, 0, Math.PI * 2);
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  // Seen while the book is shut: lying face up with its head at the fold, so it reads from the front
  t.center.set(0.5, 0.5);
  t.rotation = Math.PI;
  return t;
}

const hitBox = (h: Hit) => ('r' in h ? { x: h.cx - h.r, y: h.cy - h.r, w: h.r * 2, h: h.r * 2 } : h);

export class Stage3D {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera();
  private readonly def: PageDef;
  private readonly cfg: Page3D;
  private readonly opts: StageOptions;
  private layout: BookLayout | null = null;
  private eye: V3 = DEFAULT_EYE;
  private open = 1;
  private readonly cards = new Map<string, CardMesh>();
  private readonly back = new Group();
  private readonly hits: HitPlane[] = [];
  private readonly hitRoot = new Group();
  private readonly raycaster = new Raycaster();
  private readonly owned: { geometries: BufferGeometry[]; materials: Material[]; textures: Texture[] } = { geometries: [], materials: [], textures: [] };
  private readonly frames = new Map<string, Texture | 'loading'>();
  private readonly grade: string | undefined;
  private baby!: { group: Group; mesh: Mesh; mat: MeshLambertMaterial; blob: Mesh | null };
  private mocha!: { group: Group; mesh: Mesh; mat: MeshLambertMaterial; blob: Mesh | null };
  private readonly carriageX: number;
  /** Where the bubbles hang (world), refreshed by `update` */
  private heads: { baby: V3 | null; mocha: V3 | null; tudigong: V3 | null } = { baby: null, mocha: null, tudigong: null };
  private targetsKey = '';
  /** Bytes of texture memory uploaded (RGBA8, no mips), for the spike's measurements */
  textureBytes = 0;

  constructor(canvas: HTMLCanvasElement, def: PageDef, cfg: Page3D, opts: StageOptions) {
    this.def = def;
    this.cfg = cfg;
    this.opts = opts;
    this.grade = chapterGradeKey(def.chapter);
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(opts.maxDpr, window.devicePixelRatio || 1));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = opts.shadows === 'map';
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.info.autoReset = true;
    this.camera.matrixAutoUpdate = true;
    // The carriage card was cut at the page's start: it slides by T1's offset from there
    this.carriageX = nodePos(def, initialState(def), 'T1')?.[0] ?? 0;
  }

  // ——— Building ———

  /** Loads every card and the first character frames, then builds the scene. */
  async build(): Promise<void> {
    const cards = CARDS[this.def.id] ?? [];
    const tex = new Map<string, Texture>();
    await Promise.all(cards.map(async (c) => tex.set(c.id, this.track(prepare(await loader.loadAsync(cardUrl(c.file)))))));
    this.buildBook(tex.get('floor'));
    this.buildLights();
    for (const c of cards) {
      const t = tex.get(c.id)!;
      if (c.kind === 'back') this.buildBack(c, t);
      else if (c.kind === 'lie') this.buildLie(c, t);
      else if (c.kind === 'stand') this.buildStand(c, t);
    }
    this.baby = this.buildActor();
    this.mocha = this.buildActor();
    // The frames the page opens on, before it is shown; the rest stream in as first used
    const first: [SpriteId, number][] = [['baokaka.crawl', 0], ['baokaka.reach', 0], ['mocha.sit', 0], ['mocha.jump', 0]];
    await Promise.all(first.map(async ([id, file]) => {
      const stem = shownStem(SPRITE_MANIFEST.sprites[id], file, this.grade);
      const url = frameUrl(stem, 2);
      if (url !== undefined && !this.frames.has(stem)) this.frames.set(stem, this.track(prepare(await loader.loadAsync(url))));
    }));
  }

  private track<T extends Texture>(t: T): T {
    this.owned.textures.push(t);
    const img = t.image as { width?: number; height?: number } | undefined;
    if (img?.width && img.height) this.textureBytes += img.width * img.height * 4;
    return t;
  }

  private geo<T extends BufferGeometry>(g: T): T {
    this.owned.geometries.push(g);
    return g;
  }

  private mat<T extends Material>(m: T): T {
    this.owned.materials.push(m);
    return m;
  }

  private buildBook(floorTex: Texture | undefined) {
    const navy = this.mat(new MeshLambertMaterial({ color: '#1E1A4A' }));
    const block = this.track(stripesTexture(['#F4EAD3', '#D9CBB0', '#F4EAD3', '#D2C3A6', '#F1E5CC', '#CDBD9F', '#EFE2C7']));
    const blockMat = this.mat(new MeshLambertMaterial({ map: block }));
    const W = FLOOR_W + 8;
    // The page block under the floor page (a thick old book), then the cover board under that
    const pages = new Mesh(this.geo(new BoxGeometry(W, 14, FLOOR_DEPTH + 6)), [blockMat, blockMat, blockMat, blockMat, blockMat, blockMat]);
    pages.position.set(0, -7.2, FLOOR_DEPTH / 2 + 1);
    pages.receiveShadow = true;
    const board = new Mesh(this.geo(new BoxGeometry(W + 22, 5, FLOOR_DEPTH + 26)), navy);
    board.position.set(0, -16.5, FLOOR_DEPTH / 2 + 6);
    board.receiveShadow = true;
    this.scene.add(pages, board);
    // The floor page, lying flat
    if (floorTex) {
      const floor = new Mesh(this.geo(new PlaneGeometry(FLOOR_W, FLOOR_DEPTH)), this.mat(new MeshLambertMaterial({ map: floorTex })));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, FLOOR_DEPTH / 2);
      floor.receiveShadow = true;
      this.scene.add(floor);
    }
    // The crease's shadow along the fold
    const crease = new Mesh(this.geo(new PlaneGeometry(FLOOR_W, 26)), this.mat(new MeshBasicMaterial({ map: this.track(creaseTexture()), transparent: true, depthWrite: false })));
    crease.rotation.x = -Math.PI / 2;
    crease.position.set(0, 0.2, 13);
    crease.renderOrder = 1;
    this.scene.add(crease);
  }

  private buildLights() {
    this.scene.add(new HemisphereLight('#ECE7FF', '#FFE4BC', 1.35));
    // The moon: high behind the page, as it hangs in the sky art; the one shadow caster, so every
    // card throws its shadow forward onto the floor page, where the eye can see it
    const moon = new DirectionalLight('#DCE2FF', 1.0);
    moon.position.set(-380, 1100, -560);
    moon.target.position.set(0, 0, 200);
    this.scene.add(moon, moon.target);
    // A soft fill from the reader's side (no shadow): the cards face it, as they face the room's light
    const fill = new DirectionalLight('#FFF1DC', 0.75);
    fill.position.set(120, 900, 2400);
    this.scene.add(fill);
    if (this.opts.shadows === 'map') {
      moon.castShadow = true;
      moon.shadow.mapSize.set(1024, 1024);
      const cam = moon.shadow.camera;
      cam.left = -480;
      cam.right = 480;
      cam.top = 480;
      cam.bottom = -480;
      cam.near = 100;
      cam.far = 2600;
      cam.updateProjectionMatrix();
      moon.shadow.radius = 5;
      moon.shadow.bias = -0.0006;
      moon.shadow.normalBias = 0.6;
    }
    // The street lamps: warm, short-range, no shadows
    for (const [x, y, foot] of this.cfg.lamps) {
      const lamp = new PointLight('#FFC678', 1.6, 260, 0);
      lamp.position.set(...standPoint([x, y], foot));
      lamp.position.z += 30;
      this.scene.add(lamp);
    }
  }

  private buildBack(card: CardDef, tex: Texture) {
    // The standing page: a board (cover navy on the back) with the sky printed on its face; hinged at the gutter
    const { w, h } = card.box;
    const face = new Mesh(this.geo(new PlaneGeometry(w, h)), this.mat(new MeshLambertMaterial({ map: tex })));
    face.position.set(card.box.x + w / 2 - PAGE_W / 2, GUTTER_Y - card.box.y - h / 2, 0.6);
    face.receiveShadow = true;
    const board = new Mesh(this.geo(new BoxGeometry(FLOOR_W + 8, GUTTER_Y + 6, 4)), this.mat(new MeshLambertMaterial({ color: '#1E1A4A' })));
    board.position.set(0, (GUTTER_Y + 6) / 2, -1.6);
    board.castShadow = this.opts.shadows === 'map';
    // Its outside is the book's cover: what you see while the book is shut
    const cover = new Mesh(this.geo(new PlaneGeometry(FLOOR_W + 8, GUTTER_Y + 6)), this.mat(new MeshLambertMaterial({ map: this.track(coverTexture(this.def.title)) })));
    cover.rotation.y = Math.PI;
    cover.position.set(0, (GUTTER_Y + 6) / 2, -3.7);
    this.back.add(face, board, cover);
    this.scene.add(this.back);
  }

  /** A card printed on the floor: each vertex where its page point's ray meets the floor. */
  private buildLie(card: CardDef, tex: Texture) {
    const seg = 6;
    const g = this.geo(new PlaneGeometry(1, 1, seg, seg));
    const pos = g.getAttribute('position');
    const uv = g.getAttribute('uv');
    const arr: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const [u, v] = [uv.getX(i), uv.getY(i)];
      const p = floorPoint([card.box.x + u * card.box.w, card.box.y + (1 - v) * card.box.h]);
      arr.push(p[0], 0, p[2]);
    }
    g.setAttribute('position', new Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    const mat = this.mat(new MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: DoubleSide }));
    const face = new Mesh(g, mat);
    face.position.y = card.id === 'tab' ? 0.9 : 0.4;
    face.renderOrder = card.id === 'tab' ? 3 : 2;
    face.receiveShadow = true;
    const pivot = new Group();
    pivot.add(face);
    this.scene.add(pivot);
    this.cards.set(card.id, { def: card, pivot, face, edge: null, s: 1, home: new Vector3(), order: 0.5 });
  }

  private buildStand(card: CardDef, tex: Texture) {
    const foot = this.cfg.stands[card.id] ?? (card.id.startsWith('board') ? this.cfg.stands.board : undefined);
    if (foot === undefined) return;
    const s = footScale(foot);
    const z = footDepth(foot);
    const { x, y, w, h } = card.box;
    const centre = standPoint([x + w / 2, y + h / 2], foot);
    const geom = this.geo(new PlaneGeometry(w * s, h * s));
    const face = new Mesh(geom, this.mat(new MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.02 })));
    face.castShadow = this.opts.shadows === 'map';
    face.receiveShadow = this.opts.shadows === 'map';
    face.customDepthMaterial = this.mat(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: tex, alphaTest: 0.5 }));
    // The cut edge: the silhouette in paper cream, just behind
    const edge = new Mesh(geom, this.mat(new MeshLambertMaterial({ map: tex, color: '#000000', emissive: PAPER_EDGE, emissiveIntensity: 0.62, alphaTest: 0.55 })));
    edge.position.z = -EDGE_OFFSET;
    // The pivot sits on the floor at the card's foot line: the opening rotates it up from lying flat
    const pivot = new Group();
    pivot.position.set(0, 0, z);
    face.position.set(centre[0], centre[1], 0);
    edge.position.x = centre[0] + 0.5;
    edge.position.y = centre[1] - 0.6;
    pivot.add(edge, face);
    // Ties at one depth draw in bake order
    face.renderOrder = 10 + Math.round(z);
    if (this.opts.shadows === 'blob' && centre[1] - (h * s) / 2 < 6) pivot.add(this.blob(centre[0], (w * s) / 2, 0));
    this.scene.add(pivot);
    this.cards.set(card.id, { def: card, pivot, face, edge, s, home: new Vector3(centre[0], centre[1], z), order: clamp01((foot - 360) / 300) });
  }

  private blobTex: Texture | null = null;
  /** A contact shadow on the floor under a card (the `blob` shadow mode). */
  private blob(x: number, halfW: number, z: number): Mesh {
    this.blobTex ??= this.track(blotTexture('rgba(20,12,52,0.42)', 'rgba(20,12,52,0)'));
    const m = new Mesh(this.geo(new PlaneGeometry(halfW * 2.3, 26)), this.mat(new MeshBasicMaterial({ map: this.blobTex, transparent: true, depthWrite: false })));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.3, z + 6);
    m.renderOrder = 2;
    return m;
  }

  private buildActor() {
    const group = new Group();
    const mat = this.mat(new MeshLambertMaterial({ transparent: true, alphaTest: 0.02 }));
    const mesh = new Mesh(this.geo(new PlaneGeometry(1, 1)), mat);
    mesh.castShadow = this.opts.shadows === 'map';
    mesh.customDepthMaterial = this.mat(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, alphaTest: 0.5 }));
    mesh.renderOrder = 400;
    group.add(mesh);
    const blob = this.opts.shadows === 'off' ? null : this.blob(0, 18, 0);
    if (blob) {
      blob.renderOrder = 399;
      this.scene.add(blob);
    }
    this.scene.add(group);
    return { group, mesh, mat, blob };
  }

  // ——— Sprites ———

  /** The texture of a sprite's frame, loading it on first use (null until it has arrived). */
  private frameTexture(id: SpriteId, file: number): Texture | null {
    const sprite = SPRITE_MANIFEST.sprites[id];
    const stem = shownStem(sprite, file, this.grade);
    const got = this.frames.get(stem);
    if (got instanceof Texture) return got;
    if (got === undefined) {
      const url = frameUrl(stem, 2);
      if (url !== undefined) {
        this.frames.set(stem, 'loading');
        loader.loadAsync(url).then((t) => this.frames.set(stem, this.track(prepare(t))), () => this.frames.delete(stem));
      }
    }
    return null;
  }

  /** Places an actor's standee: frame `file` of `id`, its feet on page point `at` on the play plane. */
  private placeActor(actor: Stage3D['baby'], id: SpriteId, file: number, at: Pt, facing: 'l' | 'r', tilt: number, rise: number, opacity: number) {
    const sprite = SPRITE_MANIFEST.sprites[id];
    const tex = this.frameTexture(id, file);
    if (tex !== null && actor.mat.map !== tex) {
      actor.mat.map = tex;
      actor.mat.needsUpdate = true;
      (actor.mesh.customDepthMaterial as MeshDepthMaterial).map = tex;
      (actor.mesh.customDepthMaterial as MeshDepthMaterial).needsUpdate = true;
    }
    actor.mesh.visible = actor.mat.map !== null;
    const foot = this.cfg.playFoot;
    const s = footScale(foot);
    const k = s * sprite.mapScale;
    const [w, h] = sprite.size;
    const mirror = facing === 'l' && !sprite.noMirror;
    actor.mesh.scale.set(w * k * (mirror ? -1 : 1), h * k, 1);
    actor.mesh.position.set((w / 2 - sprite.anchor[0]) * k * (mirror ? -1 : 1), (sprite.anchor[1] - h / 2) * k, 0);
    const p = standPoint(at, foot);
    actor.group.position.set(p[0], p[1], p[2]);
    actor.group.rotation.z = (-tilt * Math.PI) / 180;
    // Pops up from the floor at the end of the opening
    actor.group.scale.setScalar(Math.max(0.001, rise));
    actor.mat.opacity = opacity;
    if (actor.blob) {
      const g = floorPoint([at[0], Math.max(GUTTER_Y, at[1])]);
      actor.blob.position.set(p[0], Math.max(0.35, p[1] - 0.5), p[2] + 2);
      actor.blob.visible = rise > 0.5 && p[1] < 80 && g !== null;
      actor.blob.scale.set(0.55, 1, 1);
      actor.blob.rotation.x = p[1] > 2 ? 0 : -Math.PI / 2;
      // Standing on a ledge (above the floor), the blot hangs as a soft shade on the card behind
      if (p[1] > 2) actor.blob.position.set(p[0], p[1] + 2, p[2] - 0.8);
    }
  }

  // ——— Per frame ———

  /** Sizes the canvas and the window frustum to the viewport (the 2D layout for the same viewport). */
  resize(layout: BookLayout) {
    this.layout = layout;
    this.renderer.setSize(layout.vw, layout.vh, false);
    this.applyCamera();
  }

  /** The eye and the opening progress (0 shut, 1 open). */
  setView(eye: V3, open: number) {
    this.eye = eye;
    this.open = open;
    this.applyCamera();
  }

  private applyCamera() {
    if (this.layout === null) return;
    const near = 40;
    const f = windowFrustum(this.layout, this.eye, near);
    this.camera.position.set(...this.eye);
    this.camera.rotation.set(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.camera.near = near;
    this.camera.far = 9000;
    this.camera.projectionMatrix.makePerspective(f.left, f.right, f.top, f.bottom, near, 9000);
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
  }

  update(f: StageFrame) {
    const { prev, state, ms, tickMs, reduced, preview } = f;
    const def = this.def;
    const open = this.open;
    // The standing page swings up over the first half of the opening
    const pageT = smooth(clamp01(open / 0.4));
    this.back.rotation.x = (1 - pageT) * (Math.PI / 2);
    for (const c of this.cards.values()) {
      if (c.def.kind === 'lie') {
        c.face.visible = open > 0.3;
        continue;
      }
      const start = 0.3 + c.order * RISE_SPAN;
      const t = clamp01((open - start) / 0.24);
      c.pivot.rotation.x = -(1 - (t >= 1 ? 1 : easeOutBack(t))) * (Math.PI / 2);
      c.pivot.visible = t > 0;
    }
    const rise = easeOutBack(clamp01((open - 0.8) / 0.18));

    // The train: the carriage slides with T1; the tab with its stop (a drag holds it between stops)
    const t1 = drawnNodePos(def, prev, state, 'T1', ms, reduced, preview);
    const carriage = this.cards.get('carriage');
    if (carriage && t1) carriage.face.position.x = carriage.home.x + (t1[0] - this.carriageX) * carriage.s;
    if (carriage?.edge && t1) carriage.edge.position.x = carriage.face.position.x + 0.5;
    const tab = this.cards.get('tab');
    const train = def.parts.find((p) => p.id === 'train');
    if (tab && train?.track) {
      const states = compilePart(train).states;
      const at = (s: SimState) => Math.max(0, states.indexOf(partState(s, 'train') ?? states[0]));
      const idx = preview?.part === 'train' ? preview.index : at(prev) + (at(state) - at(prev)) * partProgress(ms, reduced);
      const [x0] = train.track.from;
      const [x1] = train.track.to;
      const dx = ((x1 - x0) * idx) / Math.max(1, states.length - 1);
      const p0 = floorPoint([x0, train.track.from[1]]);
      const p1 = floorPoint([x0 + dx, train.track.from[1]]);
      tab.face.position.x = p1[0] - p0[0];
      // Lifted while dragged (bible § 4.1)
      tab.face.position.y = f.dragging === 'train' ? 3 : 0.9;
    }

    // The departure board flips; the 土地公 peeks out when it has
    const flip = partState(state, 'board') === 'flip';
    for (const [id, shown] of [['board.times', !flip], ['board.flip', flip]] as const) {
      const card = this.cards.get(id);
      if (card) {
        card.face.visible = shown;
        if (card.edge) card.edge.visible = shown;
      }
    }
    const tdg = this.cards.get('tudigong');
    const tdgShown = holds(def, state, def.tudigong.visibleWhen);
    if (tdg) tdg.pivot.visible = tdg.pivot.visible && tdgShown;
    this.heads.tudigong = tdgShown ? standPoint([def.tudigong.x, def.tudigong.y - 16], this.cfg.stands.tudigong ?? 400) : null;

    // The bead until grabbed; the paw marks on the perches Mocha is not on
    const bead = this.cards.get('bead');
    if (bead) bead.pivot.visible = bead.pivot.visible && !state.consumed.includes('bead') && !(state.done && state.baby.mode !== 'reaching');
    for (const perch of def.perches) {
      const paw = this.cards.get(`paw.${perch.id}`);
      if (paw) paw.pivot.visible = paw.pivot.visible && state.mocha.perch !== perch.id && state.mocha.path.length === 0 && !state.done;
    }

    // The pigeon: on the track, then up and away over the tick it flees
    const pigeon = this.cards.get('pigeon');
    const cre = def.creatures[0];
    if (pigeon && cre) {
      const was = prev.creatures[cre.id] ?? cre.initial;
      const now = state.creatures[cre.id] ?? cre.initial;
      if (now === was) {
        if (now !== cre.initial) pigeon.pivot.visible = false;
        pigeon.face.position.set(pigeon.home.x, pigeon.home.y, 0);
        pigeon.face.rotation.z = 0;
        if (pigeon.edge) pigeon.edge.position.set(pigeon.home.x + 0.5, pigeon.home.y - 0.6, -EDGE_OFFSET);
      } else {
        const k = reduced ? 1 : easeInOut(clamp01(ms / Math.max(1, tickMs * 0.9)));
        pigeon.pivot.visible = k < 1;
        const fx = pigeon.home.x + 180 * k;
        const fy = pigeon.home.y + 140 * k + Math.sin(k * Math.PI * 6) * 4;
        pigeon.face.position.set(fx, fy, 0);
        pigeon.face.rotation.z = 0.25 * k;
        if (pigeon.edge) pigeon.edge.position.set(fx + 0.5, fy - 0.6, -EDGE_OFFSET);
      }
    }

    this.updateActors(f, rise);
    this.updateHits(state);
  }

  private updateActors(f: StageFrame, rise: number) {
    const { prev, state, events, ms, tickMs, reduced } = f;
    const def = this.def;
    const tStep = stepT(ms, tickMs);
    const kStep = easeInOut(tStep);
    const held = reduced;

    // Baokaka (the same choice as PageView, without the carried / linked / walk cases 1-2 never has)
    const from = prev.baby.node;
    const to = state.baby.node;
    const a = nodePos(def, prev, from);
    const b = nodePos(def, state, to);
    const edge = from === to ? null : edgeKind(def, from, to);
    const riding = from === to && a !== undefined && b !== undefined && (a[0] !== b[0] || a[1] !== b[1]);
    const bAnim = babyAnim({ mode: state.baby.mode, edge, riding, growth: stepGrowth(def, state), watching: f.finger !== null, word: sayingWord(prev, state, events), high: reachedHigh(def, state), plop: false });
    const dist = edge !== null && a && b ? Math.hypot(b[0] - a[0], b[1] - a[1]) : 0;
    const pose = stepPose(def, prev, state, from, to, tStep, ms, { reduced, preview: f.preview });
    if (pose) {
      const file = this.fileOf(bAnim, chooseFrame(bAnim, { k: kStep, dist, tickMs, hold: held }), f.now, reduced);
      const tilt = standeeTilt(ms, tickMs, edge !== null && a && b ? travelDir(a, b) : 0, reduced);
      this.placeActor(this.baby, bAnim.sprite, file, [pose.x, pose.y], state.baby.facing, tilt, rise, 1);
      const sprite = SPRITE_MANIFEST.sprites[bAnim.sprite];
      this.heads.baby = standPoint(toPage(sprite, state.baby.facing, pose.x, pose.y, sprite.head, sprite.mapScale), this.cfg.playFoot);
    }

    // Mocha
    const mFrom = mochaNode(def, prev);
    const mTo = mochaNode(def, state);
    const travel = mFrom !== null && mTo !== null && mFrom !== mTo;
    const mState = mochaState({
      travelling: travel,
      landed: tStep >= 1 || held,
      edge: travel ? edgeKind(def, mFrom!, mTo!) : null,
      staring: state.mocha.stare !== undefined,
      puff: events.some((e) => e.type === 'mochaPuff'),
      nope: events.some((e) => e.type === 'mochaNope'),
    });
    const mAnim = MOCHA_STATE_ANIM[mState];
    const ma = mFrom === null ? undefined : nodePos(def, prev, mFrom);
    const mb = mTo === null ? undefined : nodePos(def, state, mTo);
    const mDist = travel && ma && mb ? Math.hypot(mb[0] - ma[0], mb[1] - ma[1]) : 0;
    const mPose = stepPose(def, prev, state, mFrom, mTo, tStep, ms, { reduced, hop: 24, preview: f.preview });
    this.mocha.group.visible = mPose !== null;
    if (this.mocha.blob) this.mocha.blob.visible = mPose !== null;
    if (mPose) {
      const file = this.fileOf(mAnim, chooseFrame(mAnim, { k: tStep, dist: mDist, tickMs, hold: held }), f.now, reduced);
      const dir = travel && ma && mb ? travelDir(ma, mb) : 0;
      const facing = dir !== 0 ? (dir < 0 ? 'l' : 'r') : pose && pose.x < mPose.x - 4 ? 'l' : 'r';
      this.placeActor(this.mocha, mAnim.sprite, file, [mPose.x, mPose.y], facing, standeeTilt(ms, tickMs, dir, reduced), rise, 1);
      const sprite = SPRITE_MANIFEST.sprites[mAnim.sprite];
      this.heads.mocha = standPoint(toPage(sprite, facing, mPose.x, mPose.y, sprite.head, sprite.mapScale), this.cfg.playFoot);
    } else this.heads.mocha = null;
  }

  /** The file index (into the sprite's `files`) to show for an animation choice. */
  private fileOf(anim: ActorAnim, choice: ReturnType<typeof chooseFrame>, now: number, reduced: boolean): number {
    const sprite = SPRITE_MANIFEST.sprites[anim.sprite];
    const a = sprite.anims[choice.anim] ?? sprite.anims.main;
    if (choice.frame !== undefined) return a.frames[Math.min(choice.frame, a.frames.length - 1)];
    if (choice.playing) return frameAt(a, now, reduced).frame;
    return a.frames[a.hold];
  }

  // ——— Touch ———

  /** The plane a target is touched on. */
  private planeOf(t: Target): 'floor' | number {
    if (t.kind === 'part') {
      const p = this.cfg.partPlane[t.id];
      return p === 'floor' ? 'floor' : footScale(p ?? this.cfg.playFoot);
    }
    if (t.kind === 'tudigong') return footScale(this.cfg.stands.tudigong ?? this.cfg.playFoot);
    return footScale(this.cfg.playFoot);
  }

  /** Rebuilds the hit planes when the touchables change (their set, or where they are). */
  private updateHits(state: SimState) {
    if (this.layout === null) return;
    const targets = targetsOf(this.def, state);
    const key = JSON.stringify(targets.map((t) => [t.key, t.hit]));
    if (key === this.targetsKey) return;
    this.targetsKey = key;
    for (const h of this.hits) h.mesh.geometry.dispose();
    this.hits.length = 0;
    this.hitRoot.clear();
    // Grown to 48 CSS px (and 2 px to spare) about the centre: the window maps one page unit to `layout.scale` px on every plane
    const min = (MIN_HIT_PX + 2) / this.layout.scale;
    for (const target of targets) {
      const b = hitBox(target.hit);
      const w = Math.max(b.w, min);
      const h = Math.max(b.h, min);
      const box = { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
      const plane = this.planeOf(target);
      const corners: Pt[] = [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]];
      const world = corners.map((c) => (plane === 'floor' ? floorPoint(c) : standPoint(c, footOfScale(plane))));
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(world.flat(), 3));
      g.setIndex([0, 2, 1, 1, 2, 3]);
      const mesh = new Mesh(g, HIT_MATERIAL);
      mesh.userData.key = target.key;
      this.hitRoot.add(mesh);
      this.hits.push({ target, mesh, plane });
    }
    this.hitRoot.updateMatrixWorld(true);
  }

  /**
   * What a finger at (px, py) CSS px touches: the hit planes the ray crosses, the one whose own
   * shape holds the point first, then the topmost layer, then the nearest. Its page point is where
   * the ray meets that target's plane.
   */
  pick(px: number, py: number): { target: Target; page: Pt; plane: 'floor' | number } | null {
    if (this.layout === null) return null;
    this.raycaster.setFromCamera(new Vector2((px / this.layout.vw) * 2 - 1, -(py / this.layout.vh) * 2 + 1), this.camera);
    const found = this.raycaster.intersectObjects(this.hitRoot.children, false);
    let best: { target: Target; page: Pt; plane: 'floor' | number; own: boolean; dist: number } | null = null;
    for (const hit of found) {
      const h = this.hits.find((x) => x.mesh === hit.object);
      if (h === undefined) continue;
      const page = h.plane === 'floor' ? floorToPage(hit.point.x, hit.point.z) : planeToPage([hit.point.x, hit.point.y], h.plane);
      const b = hitBox(h.target.hit);
      const own = page[0] >= b.x && page[0] <= b.x + b.w && page[1] >= b.y && page[1] <= b.y + b.h;
      const better = best === null || (own && !best.own) || (own === best.own && (h.target.layer > best.target.layer || (h.target.layer === best.target.layer && hit.distance < best.dist)));
      if (better) best = { target: h.target, page, plane: h.plane, own, dist: hit.distance };
    }
    return best === null ? null : { target: best.target, page: best.page, plane: best.plane };
  }

  /** Where the ray through (px, py) meets a plane, in that plane's page units (a drag's finger). */
  pageOn(px: number, py: number, plane: 'floor' | number): Pt | null {
    if (this.layout === null) return null;
    this.raycaster.setFromCamera(new Vector2((px / this.layout.vw) * 2 - 1, -(py / this.layout.vh) * 2 + 1), this.camera);
    const p = new Vector3();
    const geomPlane = plane === 'floor' ? new Plane(new Vector3(0, 1, 0), 0) : new Plane(new Vector3(0, 0, 1), -EYE_Z_OF(plane));
    if (this.raycaster.ray.intersectPlane(geomPlane, p) === null) return null;
    return plane === 'floor' ? floorToPage(p.x, p.z) : planeToPage([p.x, p.y], plane);
  }

  /** A world point on screen (CSS px), through the live camera. */
  project([x, y, z]: V3): Pt {
    const v = new Vector3(x, y, z).project(this.camera);
    const l = this.layout!;
    return [((v.x + 1) / 2) * l.vw, ((1 - v.y) / 2) * l.vh];
  }

  /** Where the bubbles hang, on screen (CSS px). */
  anchors(): { baby: Pt | null; mocha: Pt | null; tudigong: Pt | null } {
    const p = (v: V3 | null) => (v === null || this.layout === null ? null : this.project(v));
    return { baby: p(this.heads.baby), mocha: p(this.heads.mocha), tudigong: p(this.heads.tudigong) };
  }

  /** Every touchable's effective target on screen now: its hit plane's projected box (CSS px). */
  touchables(): { key: string; w: number; h: number; x: number; y: number }[] {
    return this.hits.map((h) => {
      const pos = h.mesh.geometry.getAttribute('position');
      const pts = [0, 1, 2, 3].map((i) => this.project([pos.getX(i), pos.getY(i), pos.getZ(i)]));
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return { key: h.target.key, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /** The spike's measurements: draw calls and triangles of the last frame, textures and memory. */
  private readonly cpu: { update: number[]; render: number[] } = { update: [], render: [] };
  /** Main-thread ms of the last frames: the stage's update (JS) and the render call (three's submission, plus any GPU wait) */
  noteCpu(update: number, render: number) {
    for (const [list, v] of [[this.cpu.update, update], [this.cpu.render, render]] as const) {
      list.push(v);
      if (list.length > 240) list.shift();
    }
  }

  stats() {
    const i = this.renderer.info;
    const p = (list: number[], q: number) => {
      const s = [...list].sort((a, b) => a - b);
      return s.length === 0 ? 0 : +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2);
    };
    return {
      calls: i.render.calls,
      triangles: i.render.triangles,
      textures: i.memory.textures,
      geometries: i.memory.geometries,
      textureMB: +(this.textureBytes / 1048576).toFixed(2),
      // A 1024² depth map, RGBA8
      shadowMapMB: this.opts.shadows === 'map' ? 4 : 0,
      updateMs: { p50: p(this.cpu.update, 0.5), p95: p(this.cpu.update, 0.95) },
      renderMs: { p50: p(this.cpu.render, 0.5), p95: p(this.cpu.render, 0.95) },
    };
  }

  dispose() {
    for (const g of this.owned.geometries) g.dispose();
    for (const m of this.owned.materials) m.dispose();
    for (const t of this.owned.textures) t.dispose();
    for (const h of this.hits) h.mesh.geometry.dispose();
    this.renderer.dispose();
  }
}

/** One shared invisible material for the hit planes (they are raycast, never drawn). */
const HIT_MATERIAL = new MeshBasicMaterial({ visible: false, side: DoubleSide });

/** The foot whose ray scale is `s` (the inverse of `footScale`). */
const footOfScale = (s: number): number => GUTTER_Y + DEFAULT_EYE[1] / s - DEFAULT_EYE[1];
const EYE_Z_OF = (s: number): number => DEFAULT_EYE[2] * (1 - s);

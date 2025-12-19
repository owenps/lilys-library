import { Suspense, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Link } from "react-router-dom";
import { TextureLoader } from "three";
import * as THREE from "three";
import {
  hashStringToColor,
  darkenColor,
  isColorBright,
} from "@/lib/color-extraction";
import type { BookWithDetails } from "@/types/database";

interface BookCard3DProps {
  book: BookWithDetails;
}

function getSpineColor(book: BookWithDetails): string {
  if (book.spine_color) {
    return book.spine_color;
  }
  return hashStringToColor(book.title);
}

function createPlaceholderTexture(color: string, title: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, 256, 384);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, darkenColor(color, 0.2));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 384);

  ctx.fillStyle = isColorBright(color) ? "#1f2937" : "#ffffff";
  ctx.font = "bold 20px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > 200) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 28;
  const startY = 192 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, 128, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function BookMesh({ book, hovered }: { book: BookWithDetails; hovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  const pageCount = book.page_count || 200;
  const spineWidth = Math.min(Math.max(pageCount / 400, 0.08), 0.18);
  const bookHeight = 1.4;
  const bookWidth = 0.95;

  const spineColor = getSpineColor(book);
  const isBright = isColorBright(spineColor);
  const textColor = isBright ? "#1f2937" : "#ffffff";

  const coverTexture = useMemo(() => {
    if (book.cover_url) {
      const loader = new TextureLoader();
      const texture = loader.load(book.cover_url);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }
    return createPlaceholderTexture(spineColor, book.title);
  }, [book.cover_url, spineColor, book.title]);

  // Animate based on hover state
  useFrame(() => {
    if (meshRef.current) {
      const targetRotationY = hovered ? -0.15 : -0.35;
      const targetRotationX = hovered ? 0.05 : 0;
      const targetY = hovered ? 0.1 : 0;

      meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.1;
      meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.1;
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;
    }
  });

  const spineTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createLinearGradient(0, 0, 64, 0);
    gradient.addColorStop(0, darkenColor(spineColor, 0.15));
    gradient.addColorStop(0.3, spineColor);
    gradient.addColorStop(0.7, spineColor);
    gradient.addColorStop(1, darkenColor(spineColor, 0.1));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 512);

    ctx.strokeStyle = "rgba(218, 165, 32, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(64, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 492);
    ctx.lineTo(64, 492);
    ctx.stroke();

    ctx.save();
    ctx.translate(32, 256);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = textColor;
    ctx.font = "bold 14px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const truncatedTitle = book.title.length > 40 ? book.title.substring(0, 37) + "..." : book.title;
    ctx.fillText(truncatedTitle, 0, 0);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [spineColor, textColor, book.title]);

  const pageTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#faf8f0";
    ctx.fillRect(0, 0, 64, 256);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 64; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  return (
    <group ref={meshRef} rotation={[0, -0.35, 0]}>
      {/* Front Cover */}
      <mesh position={[0, 0, spineWidth / 2]} castShadow>
        <planeGeometry args={[bookWidth, bookHeight]} />
        <meshStandardMaterial map={coverTexture} />
      </mesh>

      {/* Back Cover */}
      <mesh position={[0, 0, -spineWidth / 2]} rotation={[0, Math.PI, 0]} castShadow>
        <planeGeometry args={[bookWidth, bookHeight]} />
        <meshStandardMaterial color={darkenColor(spineColor, 0.2)} />
      </mesh>

      {/* Spine */}
      <mesh position={[-bookWidth / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[spineWidth, bookHeight]} />
        <meshStandardMaterial map={spineTexture} />
      </mesh>

      {/* Right edge (pages) */}
      <mesh position={[bookWidth / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <planeGeometry args={[spineWidth, bookHeight]} />
        <meshStandardMaterial map={pageTexture} />
      </mesh>

      {/* Top edge (pages) */}
      <mesh position={[0, bookHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[bookWidth, spineWidth]} />
        <meshStandardMaterial color="#faf8f0" />
      </mesh>

      {/* Bottom edge (pages) */}
      <mesh position={[0, -bookHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[bookWidth, spineWidth]} />
        <meshStandardMaterial color="#e8e4d4" />
      </mesh>
    </group>
  );
}

function BookScene({ book, hovered }: { book: BookWithDetails; hovered: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={0.8} castShadow />
      <directionalLight position={[-2, 3, 2]} intensity={0.3} />
      <Environment preset="studio" />
      <BookMesh book={book} hovered={hovered} />
    </>
  );
}

export function BookCard3D({ book }: BookCard3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/book/${book.id}`}
      className="block group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-transparent">
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <BookScene book={book} hovered={hovered} />
          </Suspense>
        </Canvas>
      </div>
      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
      </div>
    </Link>
  );
}

type FacePoint = { x: number; y: number; z?: number };
type PosePoint = { x: number; y: number; visibility?: number };

export interface ImagePipelineInput {
  sourceDataUrl: string;
  faceLandmarks: FacePoint[];
  poseLandmarks: PosePoint[];
}

export interface ImagePipelineResult {
  processedImageDataUrl: string;
  maskedImageDataUrl: string;
  faceMasked: boolean;
  modelName: string;
  modelConfidence: number;
  imageRiskScore: number;
  qualityScore: number;
  visibleSigns: string[];
}

declare global {
  interface Window {
    tf?: any;
  }
}

let tfPromise: Promise<any> | null = null;
let mobileNetPromise: Promise<any> | null = null;

async function loadScript(src: string): Promise<void> {
  if (document.querySelector(`script[src="${src}"]`)) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadTensorFlow() {
  if (window.tf?.browser) {
    return window.tf;
  }
  if (!tfPromise) {
    tfPromise = new Promise(async (resolve, reject) => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
        if (!window.tf?.browser) {
          reject(new Error("TensorFlow.js failed to initialize."));
          return;
        }
        resolve(window.tf);
      } catch (error) {
        reject(error);
      }
    });
  }
  return tfPromise;
}

async function loadMobileNetV3Model() {
  if (!mobileNetPromise) {
    mobileNetPromise = (async () => {
      const tf = await loadTensorFlow();
      return tf.loadGraphModel(
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/classification/5/default/1",
        { fromTFHub: true },
      );
    })();
  }
  return mobileNetPromise;
}

async function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  return image;
}

function getScaledDimensions(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildFaceBounds(
  faceLandmarks: FacePoint[],
  poseLandmarks: PosePoint[],
  width: number,
  height: number,
) {
  if (faceLandmarks.length >= 50) {
    const xs = faceLandmarks.map((point) => point.x * width);
    const ys = faceLandmarks.map((point) => point.y * height);
    return {
      minX: Math.max(0, Math.min(...xs)),
      maxX: Math.min(width, Math.max(...xs)),
      minY: Math.max(0, Math.min(...ys)),
      maxY: Math.min(height, Math.max(...ys)),
    };
  }

  const nose = poseLandmarks[0];
  const leftEar = poseLandmarks[7];
  const rightEar = poseLandmarks[8];
  if (!nose || (!leftEar && !rightEar)) {
    return null;
  }

  const anchor = leftEar && rightEar ? distance(leftEar, rightEar) : 0.12;
  const size = clamp(anchor * width * 1.7, width * 0.14, width * 0.35);
  const centerX = nose.x * width;
  const centerY = nose.y * height;
  return {
    minX: clamp(centerX - size / 2, 0, width),
    maxX: clamp(centerX + size / 2, 0, width),
    minY: clamp(centerY - size * 0.55, 0, height),
    maxY: clamp(centerY + size * 0.75, 0, height),
  };
}

function estimateVisibleSigns(
  poseLandmarks: PosePoint[],
  faceLandmarks: FacePoint[],
): { visibleSigns: string[]; bodyRisk: number } {
  const visibleSigns: string[] = [];
  let bodyRisk = 0;

  const shouldersReady = poseLandmarks[11] && poseLandmarks[12];
  const hipsReady = poseLandmarks[23] && poseLandmarks[24];
  if (shouldersReady && hipsReady) {
    const shoulderWidth = distance(poseLandmarks[11], poseLandmarks[12]);
    const hipWidth = distance(poseLandmarks[23], poseLandmarks[24]);
    const minY = Math.min(...poseLandmarks.map((point) => point.y));
    const maxY = Math.max(...poseLandmarks.map((point) => point.y));
    const bodyHeight = Math.max(0.01, maxY - minY);
    const shoulderRatio = shoulderWidth / bodyHeight;
    const hipRatio = hipWidth / bodyHeight;

    if (shoulderRatio < 0.16) {
      visibleSigns.push("Reduced shoulder breadth");
      bodyRisk += 24;
    }
    if (hipRatio < 0.14) {
      visibleSigns.push("Reduced torso and hip fullness");
      bodyRisk += 24;
    }
  }

  if (faceLandmarks.length >= 300) {
    const leftCheek = faceLandmarks[234];
    const rightCheek = faceLandmarks[454];
    const forehead = faceLandmarks[10];
    const chin = faceLandmarks[152];
    if (leftCheek && rightCheek && forehead && chin) {
      const faceWidth = distance(leftCheek, rightCheek);
      const faceHeight = distance(forehead, chin);
      const faceRatio = faceWidth / Math.max(faceHeight, 0.01);
      if (faceRatio < 0.82) {
        visibleSigns.push("Gaunt facial pattern");
        bodyRisk += 18;
      }
    }
  }

  return {
    visibleSigns,
    bodyRisk: clamp(bodyRisk, 0, 100),
  };
}

function applyCanvasPreprocessing(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to prepare image canvas.");
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  let sum = 0;
  let sqSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const luminance =
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    sum += luminance;
    sqSum += luminance * luminance;
  }

  const pixelCount = Math.max(1, data.length / 4);
  const meanBefore = sum / pixelCount;
  const targetBrightness = 142;
  const lift = clamp((targetBrightness - meanBefore) * 0.12, -18, 18);
  const gain = clamp(1 + (targetBrightness - meanBefore) / 510, 0.92, 1.12);

  sum = 0;
  sqSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = clamp(Math.round(data[i] * gain + lift), 0, 255);
    const g = clamp(Math.round(data[i + 1] * gain + lift), 0, 255);
    const b = clamp(Math.round(data[i + 2] * gain + lift), 0, 255);

    const avg = (r + g + b) / 3;
    data[i] = clamp(Math.round(r * 1.02 + (avg - r) * 0.04), 0, 255);
    data[i + 1] = clamp(Math.round(g * 1.01 + (avg - g) * 0.03), 0, 255);
    data[i + 2] = clamp(Math.round(b * 0.99 + (avg - b) * 0.02), 0, 255);

    const luminance =
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    sum += luminance;
    sqSum += luminance * luminance;
  }

  ctx.putImageData(imageData, 0, 0);
  const mean = sum / pixelCount;
  const variance = Math.max(0, sqSum / pixelCount - mean * mean);
  const stddev = Math.sqrt(variance);

  return {
    qualityBrightness: mean / 255,
    qualityContrast: stddev / 96,
  };
}

function applyFaceMask(
  canvas: HTMLCanvasElement,
  faceBounds: { minX: number; maxX: number; minY: number; maxY: number } | null,
) {
  if (!faceBounds) {
    return false;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) {
    return false;
  }

  const width = faceBounds.maxX - faceBounds.minX;
  const height = faceBounds.maxY - faceBounds.minY;
  maskCtx.drawImage(canvas, 0, 0);
  maskCtx.filter = "blur(20px)";
  maskCtx.drawImage(
    canvas,
    faceBounds.minX,
    faceBounds.minY,
    width,
    height,
    faceBounds.minX,
    faceBounds.minY,
    width,
    height,
  );
  maskCtx.filter = "none";
  maskCtx.fillStyle = "rgba(20, 20, 20, 0.08)";
  maskCtx.beginPath();
  maskCtx.ellipse(
    faceBounds.minX + width / 2,
    faceBounds.minY + height / 2,
    width / 2,
    height / 2,
    0,
    0,
    Math.PI * 2,
  );
  maskCtx.fill();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(maskCanvas, 0, 0);
  return true;
}

function computeModelConfidence(predictions: number[]) {
  if (predictions.length === 0) return 0;
  const maxLogit = Math.max(...predictions);
  const exp = predictions.map((value) => Math.exp(value - maxLogit));
  const sum = exp.reduce((total, value) => total + value, 0);
  if (sum <= 0) return 0;
  return Math.max(...exp) / sum;
}

export async function preprocessAndAnalyzeImage(
  input: ImagePipelineInput,
): Promise<ImagePipelineResult> {
  const image = await createImageFromDataUrl(input.sourceDataUrl);
  const scaled = getScaledDimensions(image.width, image.height, 1024);
  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to prepare image canvas.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { qualityBrightness, qualityContrast } = applyCanvasPreprocessing(canvas);
  const qualityScore = clamp(
    Math.round((qualityBrightness * 0.45 + qualityContrast * 0.55) * 100),
    0,
    100,
  );

  const faceBounds = buildFaceBounds(
    input.faceLandmarks,
    input.poseLandmarks,
    canvas.width,
    canvas.height,
  );
  const faceMasked = applyFaceMask(canvas, faceBounds);
  const maskedImageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

  const { visibleSigns, bodyRisk } = estimateVisibleSigns(
    input.poseLandmarks,
    input.faceLandmarks,
  );

  let modelConfidence = 0;
  let modelName = "Heuristic preprocessing fallback";

  try {
    const [tf, mobileNet] = await Promise.all([
      loadTensorFlow(),
      loadMobileNetV3Model(),
    ]);

    const tensor = tf.tidy(() =>
      tf.browser
        .fromPixels(canvas)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(127.5)
        .sub(1)
        .expandDims(0),
    );

    let rawOutput = mobileNet.predict
      ? mobileNet.predict(tensor)
      : mobileNet.execute(tensor);
    if (Array.isArray(rawOutput)) {
      [rawOutput] = rawOutput;
    }
    const logits = Array.from(await rawOutput.data()) as number[];
    modelConfidence = clamp(
      Math.round(computeModelConfidence(logits) * 100),
      0,
      100,
    );
    tensor.dispose();
    rawOutput.dispose?.();
    modelName = "TensorFlow.js MobileNetV3 + Canvas";
  } catch {
    modelConfidence = clamp(Math.round(qualityScore * 0.55 + (100 - bodyRisk) * 0.2), 35, 78);
    modelName = "Canvas preprocessing + landmark heuristics";
  }

  const imageRiskScore = clamp(
    Math.round(
      bodyRisk * 0.65 +
        (100 - qualityScore) * 0.15 +
        (100 - modelConfidence) * 0.2,
    ),
    0,
    100,
  );

  return {
    processedImageDataUrl: maskedImageDataUrl,
    maskedImageDataUrl,
    faceMasked,
    modelName,
    modelConfidence,
    imageRiskScore,
    qualityScore,
    visibleSigns,
  };
}

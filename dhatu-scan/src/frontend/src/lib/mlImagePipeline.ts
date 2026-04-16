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

function expandFaceBounds(
  faceBounds: { minX: number; maxX: number; minY: number; maxY: number } | null,
  width: number,
  height: number,
) {
  if (!faceBounds) return null;
  const faceWidth = faceBounds.maxX - faceBounds.minX;
  const faceHeight = faceBounds.maxY - faceBounds.minY;
  const padX = Math.max(10, faceWidth * 0.35);
  const padTop = Math.max(10, faceHeight * 0.45);
  const padBottom = Math.max(10, faceHeight * 0.3);
  return {
    minX: clamp(faceBounds.minX - padX, 0, width),
    maxX: clamp(faceBounds.maxX + padX, 0, width),
    minY: clamp(faceBounds.minY - padTop, 0, height),
    maxY: clamp(faceBounds.maxY + padBottom, 0, height),
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

    const shoulderHipRatio = shoulderWidth / Math.max(hipWidth, 0.01);
    if (shoulderHipRatio < 0.85) {
      visibleSigns.push("Upper body appears proportionally narrow");
      bodyRisk += 12;
    }

    // ── Abdominal distension / belly swelling detection ──────────────────
    // In kwashiorkor, the belly is disproportionately wide relative to the
    // shoulder and limb widths. Compare hip width to shoulder width — a hip
    // region significantly wider than shoulders with thin limbs suggests
    // abdominal distension (edema/ascites).
    if (hipWidth > shoulderWidth * 1.25) {
      visibleSigns.push("Possible abdominal distension (belly wider than shoulders)");
      bodyRisk += 20;
    }

    // Belly prominence: midpoint between shoulders and hips is abnormally
    // far from the body center line compared to limb thickness.
    const shoulderMidY = (poseLandmarks[11].y + poseLandmarks[12].y) / 2;
    const hipMidY = (poseLandmarks[23].y + poseLandmarks[24].y) / 2;
    const torsoLength = Math.abs(hipMidY - shoulderMidY);
    const torsoToLimb = torsoLength / bodyHeight;
    // A very short torso relative to total body height with wide hips
    // suggests a distended belly pushing landmarks outward.
    if (torsoToLimb < 0.22 && hipRatio > 0.18) {
      visibleSigns.push("Short torso with wide hip region (potential edema sign)");
      bodyRisk += 15;
    }
  }

  // ── Peripheral edema / limb swelling detection ──────────────────────────
  // Compare ankle-to-knee distance vs knee-to-hip distance. In peripheral
  // edema the lower legs appear puffy/swollen, making the ankle region
  // disproportionately thick relative to the upper leg.
  const leftAnkle = poseLandmarks[27];
  const rightAnkle = poseLandmarks[28];
  const leftKnee = poseLandmarks[25];
  const rightKnee = poseLandmarks[26];
  const leftHip = poseLandmarks[23];
  const rightHip = poseLandmarks[24];

  if (leftAnkle && leftKnee && leftHip) {
    const lowerLeg = distance(leftAnkle, leftKnee);
    const upperLeg = distance(leftKnee, leftHip);
    if (upperLeg > 0.01) {
      const legRatio = lowerLeg / upperLeg;
      // Swollen lower legs appear shorter relative to upper (landmarks
      // pushed outward by puffiness compress the apparent length).
      if (legRatio < 0.65) {
        visibleSigns.push("Left lower limb proportions suggest possible swelling");
        bodyRisk += 12;
      }
    }
  }
  if (rightAnkle && rightKnee && rightHip) {
    const lowerLeg = distance(rightAnkle, rightKnee);
    const upperLeg = distance(rightKnee, rightHip);
    if (upperLeg > 0.01) {
      const legRatio = lowerLeg / upperLeg;
      if (legRatio < 0.65) {
        visibleSigns.push("Right lower limb proportions suggest possible swelling");
        bodyRisk += 12;
      }
    }
  }

  // ── Wrist/ankle thickness indicator ────────────────────────────────────
  // Puffy wrists: distance from wrist to elbow is unusually short compared
  // to forearm (swelling makes joints appear thicker / closer together).
  const leftWrist = poseLandmarks[15];
  const rightWrist = poseLandmarks[16];
  const leftElbow = poseLandmarks[13];
  const rightElbow = poseLandmarks[14];
  if (leftWrist && leftElbow && poseLandmarks[11]) {
    const wristToElbow = distance(leftWrist, leftElbow);
    const elbowToShoulder = distance(leftElbow, poseLandmarks[11]);
    if (elbowToShoulder > 0.01 && wristToElbow / elbowToShoulder < 0.55) {
      visibleSigns.push("Left wrist-to-elbow ratio suggests possible joint swelling");
      bodyRisk += 8;
    }
  }
  if (rightWrist && rightElbow && poseLandmarks[12]) {
    const wristToElbow = distance(rightWrist, rightElbow);
    const elbowToShoulder = distance(rightElbow, poseLandmarks[12]);
    if (elbowToShoulder > 0.01 && wristToElbow / elbowToShoulder < 0.55) {
      visibleSigns.push("Right wrist-to-elbow ratio suggests possible joint swelling");
      bodyRisk += 8;
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
      // ── Facial puffiness / moon face (edema) ──────────────────────────
      // Abnormally round face (width ≈ height) can indicate facial edema.
      if (faceRatio > 1.15) {
        visibleSigns.push("Facial puffiness detected (possible facial edema)");
        bodyRisk += 14;
      }
    }
  }

  const leftUpperArm = poseLandmarks[11] && poseLandmarks[13]
    ? distance(poseLandmarks[11], poseLandmarks[13])
    : null;
  const rightUpperArm = poseLandmarks[12] && poseLandmarks[14]
    ? distance(poseLandmarks[12], poseLandmarks[14])
    : null;
  const leftForearm = poseLandmarks[13] && poseLandmarks[15]
    ? distance(poseLandmarks[13], poseLandmarks[15])
    : null;
  const rightForearm = poseLandmarks[14] && poseLandmarks[16]
    ? distance(poseLandmarks[14], poseLandmarks[16])
    : null;
  if (leftUpperArm && rightUpperArm && leftForearm && rightForearm) {
    const forearmToUpper =
      (leftForearm + rightForearm) / Math.max(leftUpperArm + rightUpperArm, 0.01);
    if (forearmToUpper > 1.35) {
      visibleSigns.push("Possible muscle loss pattern in upper limbs");
      bodyRisk += 10;
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

  const expanded = expandFaceBounds(faceBounds, canvas.width, canvas.height);
  if (!expanded) return false;
  const width = expanded.maxX - expanded.minX;
  const height = expanded.maxY - expanded.minY;

  maskCtx.drawImage(canvas, 0, 0);
  maskCtx.save();
  maskCtx.beginPath();
  maskCtx.ellipse(
    expanded.minX + width / 2,
    expanded.minY + height / 2,
    width / 2,
    height / 2,
    0,
    0,
    Math.PI * 2,
  );
  maskCtx.clip();

  const downscale = document.createElement("canvas");
  downscale.width = Math.max(8, Math.floor(width / 16));
  downscale.height = Math.max(8, Math.floor(height / 16));
  const downCtx = downscale.getContext("2d");
  if (!downCtx) {
    maskCtx.restore();
    return false;
  }
  downCtx.imageSmoothingEnabled = true;
  downCtx.drawImage(
    canvas,
    expanded.minX,
    expanded.minY,
    width,
    height,
    0,
    0,
    downscale.width,
    downscale.height,
  );

  maskCtx.imageSmoothingEnabled = false;
  maskCtx.drawImage(
    downscale,
    0,
    0,
    downscale.width,
    downscale.height,
    expanded.minX,
    expanded.minY,
    width,
    height,
  );
  maskCtx.imageSmoothingEnabled = true;
  maskCtx.filter = "blur(30px) saturate(0.7) contrast(0.9)";
  maskCtx.drawImage(
    canvas,
    expanded.minX,
    expanded.minY,
    width,
    height,
    expanded.minX,
    expanded.minY,
    width,
    height,
  );
  maskCtx.filter = "none";
  maskCtx.fillStyle = "rgba(16, 16, 16, 0.32)";
  maskCtx.fillRect(expanded.minX, expanded.minY, width, height);
  maskCtx.restore();

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

function detectSkinAbnormalities(canvas: HTMLCanvasElement): string[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const signs: string[] = [];

  let count = 0;
  let sumL = 0, sumA = 0, sumB = 0;

  // Sample roughly every 16th pixel to save processing time
  for (let i = 0; i < data.length; i += 64) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    
    // Simple background threshold (ignore very dark pixels)
    if (r > 30 || g > 30 || b > 30) {
      // Rough sRGB to CIELAB conversion
      let xR = r / 255.0, xG = g / 255.0, xB = b / 255.0;
      xR = xR > 0.04045 ? Math.pow((xR + 0.055) / 1.055, 2.4) : xR / 12.92;
      xG = xG > 0.04045 ? Math.pow((xG + 0.055) / 1.055, 2.4) : xG / 12.92;
      xB = xB > 0.04045 ? Math.pow((xB + 0.055) / 1.055, 2.4) : xB / 12.92;

      xR = xR * 100; xG = xG * 100; xB = xB * 100;

      const x = xR * 0.4124 + xG * 0.3576 + xB * 0.1805;
      const y = xR * 0.2126 + xG * 0.7152 + xB * 0.0722;
      const z = xR * 0.0193 + xG * 0.1192 + xB * 0.9505;

      const valX = x / 95.047;
      const valY = y / 100.000;
      const valZ = z / 108.883;

      const fX = valX > 0.008856 ? Math.pow(valX, 1 / 3) : (7.787 * valX) + (16 / 116);
      const fY = valY > 0.008856 ? Math.pow(valY, 1 / 3) : (7.787 * valY) + (16 / 116);
      const fZ = valZ > 0.008856 ? Math.pow(valZ, 1 / 3) : (7.787 * valZ) + (16 / 116);

      const L = (116 * fY) - 16;
      const a = 500 * (fX - fY);
      const labB = 200 * (fY - fZ);

      sumL += L; sumA += a; sumB += labB;
      count++;
    }
  }

  if (count > 100) {
    const meanL = sumL / count;
    const meanA = sumA / count;
    const meanB = sumB / count;

    // High lightness and low redness -> pallor
    if (meanL > 65 && meanA < 10) {
      signs.push("Skin pallor detected (possible anemia or nutrient deficiency)");
    }
    // High yellowness (b* channel) -> yellowish/jaundice
    if (meanB > 22) {
      signs.push("Yellowish skin tinge detected (possible jaundice indicator)");
    }
  }

  return signs;
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

  // Analyze skin abnormalities from the raw pixels before modifying canvas
  const skinSigns = detectSkinAbnormalities(canvas);

  const { qualityBrightness, qualityContrast } = applyCanvasPreprocessing(canvas);
  const landmarkCoverage = clamp(
    input.poseLandmarks.filter((point) => (point.visibility ?? 1) > 0.4).length / 33,
    0,
    1,
  );
  const qualityScore = clamp(
    Math.round(
      (qualityBrightness * 0.35 + qualityContrast * 0.45 + landmarkCoverage * 0.2) *
        100,
    ),
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

  const { visibleSigns: estimatedSigns, bodyRisk } = estimateVisibleSigns(
    input.poseLandmarks,
    input.faceLandmarks,
  );
  
  const visibleSigns = [...skinSigns, ...estimatedSigns];

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
      bodyRisk * 0.6 +
        (100 - qualityScore) * 0.25 +
        (100 - modelConfidence) * 0.15,
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

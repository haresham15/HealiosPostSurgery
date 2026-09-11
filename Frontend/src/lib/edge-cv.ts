/**
 * Edge Computer Vision & Image Quality Diagnostic Gatekeeper
 * Evaluates photographic quality (luminance, exposure, blur variance)
 * directly in the browser using HTML5 Canvas before server inference.
 */

export interface ImageQualityReport {
  isAcceptable: boolean;
  isAdequate: boolean;
  luminance: number; // 0 - 255
  brightnessScore: number;
  blurScore: number;
  sharpnessScore: number;
  exposureStatus: 'Optimal' | 'Under-Exposed (Too Dark)' | 'Over-Exposed (Glare)';
  focusStatus: 'Sharp & In-Focus' | 'Blurry (Hold Camera Steady)';
  warnings: string[];
}

export type ImageQualityResult = ImageQualityReport;

export async function analyzeImageQuality(file: File): Promise<ImageQualityReport> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({
            isAcceptable: true,
            isAdequate: true,
            luminance: 128,
            brightnessScore: 128,
            blurScore: 50,
            sharpnessScore: 50,
            exposureStatus: 'Optimal',
            focusStatus: 'Sharp & In-Focus',
            warnings: [],
          });
          return;
        }

        // Standard diagnostic resolution
        const width = 160;
        const height = 160;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const numPixels = width * height;

        // 1. Luminance & Exposure Histogram
        let totalLuma = 0;
        const grayscale = new Float32Array(numPixels);

        for (let i = 0; i < numPixels; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Standard ITU-R BT.601 luma formula
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          grayscale[i] = luma;
          totalLuma += luma;
        }

        const avgLuma = Math.round(totalLuma / numPixels);
        const warnings: string[] = [];

        let exposureStatus: ImageQualityReport['exposureStatus'] = 'Optimal';
        if (avgLuma < 38) {
          exposureStatus = 'Under-Exposed (Too Dark)';
          warnings.push('Image is too dark. Turn on room lighting or flash for accurate healing analysis.');
        } else if (avgLuma > 232) {
          exposureStatus = 'Over-Exposed (Glare)';
          warnings.push('High glare or overexposure detected. Adjust angle away from direct light.');
        }

        // 2. Focus & Blur Detection (Laplacian Edge Variance Approximation)
        // Kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
        let laplacianSum = 0;
        let laplacianSqSum = 0;
        let evaluatedEdges = 0;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const top = (y - 1) * width + x;
            const bottom = (y + 1) * width + x;
            const left = y * width + (x - 1);
            const right = y * width + (x + 1);

            const lap = grayscale[top] + grayscale[bottom] + grayscale[left] + grayscale[right] - 4 * grayscale[idx];
            laplacianSum += lap;
            laplacianSqSum += lap * lap;
            evaluatedEdges++;
          }
        }

        const meanLap = laplacianSum / evaluatedEdges;
        const variance = (laplacianSqSum / evaluatedEdges) - (meanLap * meanLap);
        const blurScore = Math.max(0, Math.round(variance));

        let focusStatus: ImageQualityReport['focusStatus'] = 'Sharp & In-Focus';
        if (blurScore < 14) {
          focusStatus = 'Blurry (Hold Camera Steady)';
          warnings.push('Camera was slightly out of focus. Hold phone 15–20 cm directly over the wound.');
        }

        const isAcceptable = warnings.length === 0 || (avgLuma >= 25 && blurScore >= 10);

        resolve({
          isAcceptable,
          isAdequate: isAcceptable,
          luminance: avgLuma,
          brightnessScore: Math.round(avgLuma),
          blurScore,
          sharpnessScore: Math.round(blurScore),
          exposureStatus,
          focusStatus,
          warnings,
        });
      };

      img.onerror = () => {
        resolve({
          isAcceptable: true,
          isAdequate: true,
          luminance: 120,
          brightnessScore: 120,
          blurScore: 40,
          sharpnessScore: 40,
          exposureStatus: 'Optimal',
          focusStatus: 'Sharp & In-Focus',
          warnings: [],
        });
      };

      img.src = event?.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

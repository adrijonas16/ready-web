export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  width: number;
  height: number;
  brightness: number;
  blurScore: number;
}

export async function validateImage(file: File): Promise<ImageValidationResult> {
  const errors: string[] = [];
  let width = 0;
  let height = 0;
  let brightness = 0;
  let blurScore = 0;

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      width = img.width;
      height = img.height;

      // Check minimum resolution — only reject very tiny images
      if (width < 200 || height < 200) {
        errors.push('La imagen es muy pequena. Intenta con una foto de mejor calidad.');
      }

      // Calculate brightness and blur
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        const data = imageData.data;
        let totalBrightness = 0;

        // Sample pixels for performance
        const step = Math.max(1, Math.floor(data.length / 4 / 10000));
        let pixelCount = 0;
        let variance = 0;
        let prevPixel = 0;

        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightnessValue = (r + g + b) / 3;
          totalBrightness += brightnessValue;

          if (i > 0) {
            variance += Math.pow(brightnessValue - prevPixel, 2);
          }
          prevPixel = brightnessValue;
          pixelCount++;
        }

        brightness = totalBrightness / pixelCount;
        blurScore = variance / pixelCount;

        // Only warn for extremely dark images
        if (brightness < 20) {
          errors.push('La imagen esta muy oscura. Intenta con mejor iluminacion.');
        }

        // Only warn for extremely blurry images
        if (blurScore < 15) {
          errors.push('La imagen parece muy borrosa. Intenta una foto mas nitida.');
        }
      }

      resolve({
        isValid: errors.length === 0,
        errors,
        width,
        height,
        brightness,
        blurScore,
      });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        errors: ['No se pudo cargar la imagen'],
        width: 0,
        height: 0,
        brightness: 0,
        blurScore: 0,
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(price);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDIENTE_REVISION: 'bg-yellow-100 text-yellow-800',
    EN_REVISION: 'bg-blue-100 text-blue-800',
    OBSERVADA: 'bg-orange-100 text-orange-800',
    VALIDADA: 'bg-green-100 text-green-800',
    PROCESADA: 'bg-emerald-100 text-emerald-800',
    RECIBIDO: 'bg-purple-100 text-purple-800',
    EN_PREPARACION: 'bg-blue-100 text-blue-800',
    ARMADO: 'bg-indigo-100 text-indigo-800',
    EN_CAMINO: 'bg-cyan-100 text-cyan-800',
    ENTREGADO: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDIENTE_REVISION: 'Pendiente',
    EN_REVISION: 'En revisión',
    OBSERVADA: 'Observada',
    VALIDADA: 'Validada',
    PROCESADA: 'Procesada',
    RECIBIDO: 'Recibido',
    EN_PREPARACION: 'En preparación',
    ARMADO: 'Armado',
    EN_CAMINO: 'En camino',
    ENTREGADO: 'Entregado',
  };
  return labels[status] || status;
}
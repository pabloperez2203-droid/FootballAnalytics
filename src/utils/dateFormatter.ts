/**
 * ─── Football Date Formatter & Timezone Shield ────────────────────────────────
 * Manejo robusto de fechas y horarios para partidos de LaLiga y Champions League.
 * 
 * Reglas fundamentales:
 * 1. Zona horaria de referencia: 'Europe/Madrid' (CET / CEST) para asegurar que
 *    los horarios de emisión televisiva oficial coincidan exactamente y no sufran
 *    desplazamientos de día por diferencias de huso horario o SSR.
 * 2. Soporte nativo para partidos Sin Confirmar (TBD):
 *    - Si confirmed === false o time_confirmed === false
 *    - Si la hora es 00:00 / 00:00:00 / T00:00:00
 *    - Si solo viene YYYY-MM-DD sin hora
 *    En estos casos se muestra "Por confirmar" o "Fin de semana del [Día]".
 * 3. Anti-Hydration Mismatch: Intl.DateTimeFormat con opciones deterministas
 *    garantiza que servidor (SSR) y cliente produzcan exactamente el mismo HTML.
 */

export const DEFAULT_TIMEZONE = 'Europe/Madrid';

export interface DateFormatOptions {
  timeZone?: string;
  showTime?: boolean;
  showDayOfWeek?: boolean;
  showYear?: boolean;
  confirmed?: boolean;
  fallbackText?: string;
}

export interface ParsedMatchDate {
  rawDate: string;
  dateObj: Date | null;
  isValid: boolean;
  isConfirmed: boolean;
  isTbdTime: boolean;
  formattedDate: string;
  formattedTime: string;
  formattedFull: string;
  relativeLabel: string;
}

/**
 * Normaliza cualquier formato de fecha entrante (SQL 'YYYY-MM-DD HH:mm:ss', ISO, o fecha corta)
 * a una instancia de Date interpretada en la zona horaria correcta.
 */
export function parseMatchDate(
  rawDate: string | Date | undefined | null,
  confirmedFlag?: boolean
): ParsedMatchDate {
  if (!rawDate) {
    return {
      rawDate: '',
      dateObj: null,
      isValid: false,
      isConfirmed: false,
      isTbdTime: true,
      formattedDate: 'Fecha por confirmar',
      formattedTime: 'Por confirmar',
      formattedFull: 'Por confirmar',
      relativeLabel: 'Pendiente',
    };
  }

  const rawStr = typeof rawDate === 'string' ? rawDate.trim() : rawDate.toISOString();

  // Detección de hora 00:00 o TBD
  const hasZeroTime =
    rawStr.includes('00:00:00') ||
    rawStr.endsWith('00:00') ||
    rawStr.includes('T00:00') ||
    !rawStr.includes(':');

  const isConfirmed = confirmedFlag !== false && !hasZeroTime;

  let isoCandidate = rawStr;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(rawStr)) {
    isoCandidate = rawStr.replace(' ', 'T');
    const parts = rawStr.split(/[- :]/).map(Number);
    if (parts.length >= 3) {
      const year = parts[0];
      const month = parts[1] - 1;
      const day = parts[2];
      const hours = parts[3] || 0;
      const minutes = parts[4] || 0;
      const seconds = parts[5] || 0;
      
      const dateObj = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
      return buildParsedResult(rawStr, dateObj, isConfirmed, hasZeroTime);
    }
  }

  const dateObj = new Date(isoCandidate);
  const isValid = !isNaN(dateObj.getTime());

  if (!isValid) {
    return {
      rawDate: rawStr,
      dateObj: null,
      isValid: false,
      isConfirmed: false,
      isTbdTime: true,
      formattedDate: 'Fecha por confirmar',
      formattedTime: 'Por confirmar',
      formattedFull: 'Por confirmar',
      relativeLabel: 'Pendiente',
    };
  }

  return buildParsedResult(rawStr, dateObj, isConfirmed, hasZeroTime);
}

function buildParsedResult(
  rawStr: string,
  dateObj: Date,
  isConfirmed: boolean,
  isTbdTime: boolean
): ParsedMatchDate {
  const dayOfWeekFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: DEFAULT_TIMEZONE,
    weekday: 'short',
  });

  const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: DEFAULT_TIMEZONE,
    day: 'numeric',
    month: 'short',
  });

  const timeFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  let weekday = '';
  let dayMonth = '';
  let time = '';

  try {
    weekday = capitalize(dayOfWeekFormatter.format(dateObj).replace('.', ''));
    dayMonth = dateFormatter.format(dateObj);
    time = timeFormatter.format(dateObj);
  } catch {
    weekday = '';
    dayMonth = rawStr.slice(0, 10);
    time = '21:00';
  }

  const formattedDate = `${weekday} ${dayMonth}`.trim();
  const formattedTime = isConfirmed ? `${time}h` : 'Por confirmar';

  let formattedFull = '';
  if (isConfirmed) {
    formattedFull = `${formattedDate} · ${formattedTime}`;
  } else {
    formattedFull = `Fin de semana del ${dayMonth} (Por confirmar)`;
  }

  const relativeLabel = calculateRelativeLabel(dateObj, isConfirmed);

  return {
    rawDate: rawStr,
    dateObj,
    isValid: true,
    isConfirmed,
    isTbdTime,
    formattedDate,
    formattedTime,
    formattedFull,
    relativeLabel,
  };
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function calculateRelativeLabel(targetDate: Date, isConfirmed: boolean): string {
  try {
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffHours < -3) {
      return 'Finalizado';
    }
    if (diffHours >= -3 && diffHours <= 2) {
      return 'En directo';
    }
    if (diffDays === 0) {
      return 'Hoy';
    }
    if (diffDays === 1) {
      return 'Mañana';
    }
    if (diffDays > 1 && diffDays <= 6) {
      return isConfirmed ? `En ${diffDays} días` : 'Próxima jornada';
    }
    if (!isConfirmed) {
      return 'Por confirmar';
    }
    return 'Próxima jornada';
  } catch {
    return 'Próximamente';
  }
}

export function formatMatchDisplay(
  rawDate: string | Date | undefined | null,
  options: DateFormatOptions = {}
): string {
  const parsed = parseMatchDate(rawDate, options.confirmed);
  if (!parsed.isValid) {
    return options.fallbackText || 'Por confirmar';
  }

  if (!parsed.isConfirmed) {
    return `Fin de semana del ${parsed.formattedDate.replace(/^[A-Za-zÁÉÍÓÚáéíóú]+\s*/, '')} (Por confirmar)`;
  }

  if (options.showTime === false) {
    return parsed.formattedDate;
  }

  return parsed.formattedFull;
}

export function formatMatchTimeOnly(
  rawDate: string | Date | undefined | null,
  confirmedFlag?: boolean
): string {
  const parsed = parseMatchDate(rawDate, confirmedFlag);
  return parsed.formattedTime;
}
